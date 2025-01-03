"""
NetPulse - Real-Time Network Traffic Analyzer
Backend implementation using FastAPI, Scapy, NetworkX, and Pydantic.
"""

import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional, Set

import networkx as nx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, IPvAnyAddress
from scapy.all import sniff
from scapy.layers.inet import IP


# Pydantic models for data validation and documentation
class Node(BaseModel):
    """Represents a network host/node in the system."""

    id: str = Field(..., description="IP address of the host")
    type: str = Field(default="host", description="Type of the node")
    first_seen: datetime = Field(
        default_factory=datetime.now,
        description="When the node was first observed",
    )


class Edge(BaseModel):
    """Represents a network connection between two hosts."""

    source: str = Field(..., description="Source IP address")
    target: str = Field(..., description="Destination IP address")
    weight: int = Field(default=1, description="Number of packets transmitted")
    last_seen: datetime = Field(
        default_factory=datetime.now,
        description="Last packet transmission time",
    )


class PacketUpdate(BaseModel):
    """Represents a network packet update."""

    type: str = Field(default="packet", description="Type of update")
    source: IPvAnyAddress = Field(..., description="Source IP address")
    destination: IPvAnyAddress = Field(
        ...,
        description="Destination IP address",
    )
    protocol: int = Field(..., description="IP protocol number")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Packet timestamp"
    )
    size: int = Field(..., description="Packet size in bytes")


class NetworkSummary(BaseModel):
    """Network-wide statistics and summary."""

    num_hosts: int = Field(..., description="Total number of active hosts")
    num_connections: int = Field(
        ...,
        description="Total number of active connections",
    )
    packet_stats: Dict[str, Dict[str, int]] = Field(
        ..., description="Packet statistics per host"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Summary timestamp"
    )
    uptime: float = Field(..., description="System uptime in seconds")


class HostStats(BaseModel):
    """Detailed statistics for a single host."""

    ip: str = Field(..., description="Host IP address")
    connections: int = Field(..., description="Number of active connections")
    packets_sent: int = Field(..., description="Total packets sent")
    packets_received: int = Field(..., description="Total packets received")
    first_seen: datetime = Field(
        ...,
        description="When the host was first observed",
    )


class HostList(BaseModel):
    """List of hosts with their statistics."""

    hosts: List[HostStats] = Field(..., description="List of host statistics")


class NetworkState:
    """Global network state management."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.active_connections: Set[WebSocket] = set()
        self.packet_stats = defaultdict(lambda: defaultdict(int))
        self.start_time = datetime.now()


class NetworkAnalyzer:
    """Analyzes network packets and maintains network graph state."""

    def __init__(self, state: NetworkState):
        self.state = state

    async def process_packet(self, packet) -> Optional[PacketUpdate]:
        """
        Process a network packet and update the network graph.

        Args:
            packet: Scapy packet object

        Returns:
            Optional[PacketUpdate]: Packet update information if valid IP packet,
                                None otherwise
        """
        if IP in packet:
            src_ip = str(packet[IP].src)  # Convert to string
            dst_ip = str(packet[IP].dst)  # Convert to string

            # Update graph nodes
            for ip in (src_ip, dst_ip):
                if not self.state.graph.has_node(ip):
                    self.state.graph.add_node(
                        ip, type="host", first_seen=datetime.now()
                    )

            # Update or add edge
            if self.state.graph.has_edge(src_ip, dst_ip):
                self.state.graph[src_ip][dst_ip]["weight"] += 1
            else:
                self.state.graph.add_edge(
                    src_ip, dst_ip, weight=1, first_seen=datetime.now()
                )

            # Update statistics
            self.state.packet_stats[src_ip][dst_ip] += 1

            return PacketUpdate(
                source=src_ip,  # Using string version
                destination=dst_ip,  # Using string version
                protocol=packet[IP].proto,
                size=len(packet),
            )
        return None


async def broadcast_update(state: NetworkState, data: Dict):
    """
    Broadcast updates to all connected WebSocket clients.

    Args:
        state: Current network state
        data: Update data to broadcast
    """
    # Convert any datetime objects in the data to ISO format strings
    if "timestamp" in data:
        data["timestamp"] = data["timestamp"].isoformat()

    # Convert IP addresses to strings
    if "source" in data:
        data["source"] = str(data["source"])
    if "destination" in data:
        data["destination"] = str(data["destination"])

    if state.active_connections:
        # Create a copy of the set to avoid modification during iteration
        for connection in state.active_connections.copy():
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
                if connection in state.active_connections:
                    state.active_connections.remove(connection)


async def capture_packets():
    """Capture and process network packets"""
    loop = asyncio.get_running_loop()

    def packet_callback(packet):
        # Use the loop to create a task in the correct event loop
        loop.create_task(process_packet_async(packet))

    async def process_packet_async(packet):
        update = await app.state.analyzer.process_packet(packet)
        if update:
            await broadcast_update(app.state.network, update.model_dump())

    try:
        # Run sniffing in a separate thread to not block the event loop
        await loop.run_in_executor(
            None,
            lambda: sniff(
                prn=packet_callback,
                store=0,
                filter="ip",  # Only capture IP packets
                quiet=True,  # Reduce console output
            ),
        )
    except Exception:
        print("Error starting packet capture:")
        print("This application requires root privileges to capture packets.")
        print("Please run with 'sudo' (unsafe) or grant capabilities with:")
        print("sudo setcap cap_net_raw+ep $(which python3)")
        raise


# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle.

    Args:
        app: FastAPI application instance
    """
    # Initialize state
    state = NetworkState()
    app.state.network = state
    app.state.analyzer = NetworkAnalyzer(state)

    # Start packet capture
    capture_task = asyncio.create_task(capture_packets())

    try:
        yield
    finally:
        # Cleanup
        capture_task.cancel()
        try:
            await capture_task
        except asyncio.CancelledError:
            pass
        app.state.network.active_connections.clear()


# Initialize FastAPI with lifecycle management
app = FastAPI(
    title="NetPulse API",
    description="Real-time network traffic analysis and visualization API",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.

    Args:
        websocket: WebSocket connection instance
    """
    await websocket.accept()
    app.state.network.active_connections.add(websocket)

    try:
        # Send initial graph state
        nodes = [
            {
                "id": n,
                "type": app.state.network.graph.nodes[n].get("type", "host"),
                "first_seen": app.state.network.graph.nodes[n]
                .get("first_seen", datetime.now())
                .isoformat(),
            }
            for n in app.state.network.graph.nodes()
        ]

        edges = [
            {
                "source": u,
                "target": v,
                "weight": d["weight"],
                "last_seen": d.get("last_seen", datetime.now()).isoformat(),
            }
            for u, v, d in app.state.network.graph.edges(data=True)
        ]

        await websocket.send_json(
            {
                "type": "init",
                "nodes": nodes,
                "edges": edges,
            }
        )

        # Handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Process client messages if needed

    except WebSocketDisconnect:
        # Only try to remove if it exists
        if websocket in app.state.network.active_connections:
            app.state.network.active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        # Only try to remove if it exists
        if websocket in app.state.network.active_connections:
            app.state.network.active_connections.remove(websocket)


@app.get("/network/summary", response_model=NetworkSummary)
async def get_network_summary():
    """Get current network-wide statistics."""
    return NetworkSummary(
        num_hosts=len(app.state.network.graph.nodes()),
        num_connections=len(app.state.network.graph.edges()),
        packet_stats=dict(app.state.network.packet_stats),
        uptime=(datetime.now() - app.state.network.start_time).total_seconds(),
    )


@app.get("/network/hosts", response_model=HostList)
async def get_hosts():
    """Get detailed statistics for all hosts."""
    return HostList(
        hosts=[
            HostStats(
                ip=node,
                connections=len(list(app.state.network.graph.neighbors(node))),
                packets_sent=sum(app.state.network.packet_stats[node].values()),  # noqa
                packets_received=sum(
                    stats[node]
                    for host_stats in app.state.network.packet_stats.values()
                    for dest, stats in host_stats.items()
                ),
                first_seen=app.state.network.graph.nodes[node].get(
                    "first_seen", datetime.now()
                ),
            )
            for node in app.state.network.graph.nodes()
        ]
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

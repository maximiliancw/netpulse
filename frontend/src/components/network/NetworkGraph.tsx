import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import { Activity, Network, Clock, AlertCircle } from 'lucide-react'

interface Node {
    id: string
    type: string
    val: number
}

interface Link {
    source: string
    target: string
    value: number
}

interface GraphData {
    nodes: Node[]
    links: Link[]
}

interface NetworkStats {
    hosts: number
    connections: number
    uptime: number
    lastUpdate: string | null
}

export function NetworkGraph() {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [stats, setStats] = useState<NetworkStats>({
        hosts: 0,
        connections: 0,
        uptime: 0,
        lastUpdate: null
    })
    const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')
    const wsRef = useRef<WebSocket | null>(null)
    const graphRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const connectWebSocket = () => {
            wsRef.current = new WebSocket('ws://localhost:8000/ws')

            wsRef.current.onopen = () => {
                setStatus('connected')
            }

            wsRef.current.onclose = () => {
                setStatus('disconnected')
                // Attempt to reconnect after 5 seconds
                setTimeout(connectWebSocket, 5000)
            }

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data)

                if (data.type === 'init') {
                    // Initialize graph with empty arrays if data is undefined
                    const nodes = (data.nodes || []).map((node: any) => ({
                        id: node.id,
                        type: node.type || 'host',
                        val: 1
                    }))
                    const links = (data.edges || []).map((edge: any) => ({
                        source: edge.source,
                        target: edge.target,
                        value: edge.weight || 1
                    }))
                    setGraphData({ nodes, links })
                } else if (data.type === 'packet') {
                    setGraphData(prevData => {
                        const nodes = [...(prevData.nodes || [])]
                        const links = [...(prevData.links || [])]

                            // Add nodes if they don't exist
                            ;[data.source, data.destination].forEach(id => {
                                if (!nodes.find(n => n.id === id)) {
                                    nodes.push({ id, type: 'host', val: 1 })
                                }
                            })

                        // Update or add link
                        const existingLink = links.find(
                            l => (
                                typeof l.source === 'object'
                                    ? l.source.id === data.source
                                    : l.source === data.source
                            ) && (
                                    typeof l.target === 'object'
                                        ? l.target.id === data.destination
                                        : l.target === data.destination
                                )
                        )

                        if (existingLink) {
                            existingLink.value = (existingLink.value || 0) + 1
                        } else {
                            links.push({
                                source: data.source,
                                target: data.destination,
                                value: 1
                            })
                        }

                        return { nodes, links }
                    })
                }
            }
        }

        connectWebSocket()

        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [])

    // Fetch network statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8000/network/summary')
                const data = await response.json()
                setStats({
                    hosts: data.num_hosts || 0,
                    connections: data.num_connections || 0,
                    uptime: Math.floor(data.uptime || 0),
                    lastUpdate: new Date().toLocaleTimeString()
                })
            } catch (error) {
                console.error('Failed to fetch network stats:', error)
            }
        }

        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (graphRef.current) {
                    graphRef.current.width = width;
                    graphRef.current.height = height;
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, []);

    const handleEngineStop = useCallback(() => {
        if (graphRef.current) {
            // Only zoom to fit once when the graph is first rendered
            if (!graphRef.current.zoomingToFit) {
                graphRef.current.zoomingToFit = true;
                graphRef.current.zoomToFit(400, 50); // 50ms transition
            }
        }
    }, []);

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours}h ${minutes}m ${secs}s`
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Active Hosts</h3>
                        <Network className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-blue-500">{stats.hosts}</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Connections</h3>
                        <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-blue-500">{stats.connections}</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
                        <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-blue-500">{formatUptime(stats.uptime)}</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                        <span className="text-sm font-medium text-gray-700">
                            {status === 'connected' ? 'Connected' : 'Reconnecting...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Network Graph */}
            <div
                ref={containerRef}
                className="relative h-[600px] w-full rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel={node => `Host: ${node.id}`}
                    nodeColor={node =>
                        selectedNode?.id === node.id ? '#3B82F6' : '#10B981'
                    }
                    linkWidth={link => Math.sqrt(link.value || 1)}
                    linkColor={() => '#94A3B8'}
                    onNodeClick={(node: any) => setSelectedNode(node)}
                    nodeRelSize={6}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={0.005}
                    cooldownTicks={50}
                    onEngineStop={handleEngineStop}
                    width={containerRef.current?.clientWidth || window.innerWidth - 300} // Fallback width
                    height={600}
                    backgroundColor="#ffffff"
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                    minZoom={1}
                    maxZoom={10}
                />
            </div>
            {/* Selected Node Details */}
            {selectedNode && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h3 className="text-lg font-medium text-gray-900">Host Details</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">IP Address</p>
                            <p className="mt-1 font-medium text-blue-500">{selectedNode.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="mt-1 font-medium text-blue-500">{selectedNode.type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Connections</p>
                            <p className="mt-1 font-medium text-blue-500">
                                {graphData.links.filter(l => {
                                    const sourceId = typeof l.source === 'object' ? l.source.id : l.source
                                    const targetId = typeof l.target === 'object' ? l.target.id : l.target
                                    return sourceId === selectedNode.id || targetId === selectedNode.id
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
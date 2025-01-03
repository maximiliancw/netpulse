import { NetworkGraph } from '../../components/network/NetworkGraph'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Network Overview</h1>
      <NetworkGraph />
    </div>
  )
}
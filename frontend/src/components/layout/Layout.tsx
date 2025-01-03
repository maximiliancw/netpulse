import { Link } from 'react-router-dom'
import { Activity, Settings } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-gray-200 px-4">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-semibold text-blue-600">NetPulse</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Activity className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="max-w-[calc(100vw-16rem)] p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
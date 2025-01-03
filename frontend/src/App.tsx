import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout'
import { Dashboard } from './pages/dashboard/Dashboard'
import { Settings } from './components/Settings'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
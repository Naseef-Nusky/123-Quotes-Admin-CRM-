import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import QuotesAdmin from './pages/QuotesAdmin.jsx'
import LeadsAdmin from './pages/LeadsAdmin.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/quotes" element={<QuotesAdmin />} />
                <Route path="/leads" element={<LeadsAdmin />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  )
}

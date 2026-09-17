import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Services from './pages/Services.jsx'
import Questionnaires from './pages/Questionnaires.jsx'
import Requests from './pages/Requests.jsx'
import Leads from './pages/Leads.jsx'
import Packages from './pages/Packages.jsx'
import Payments from './pages/Payments.jsx'
import Templates from './pages/Templates.jsx'
import Settings from './pages/Settings.jsx'
import Pages from './pages/Pages.jsx'
import Activity from './pages/Activity.jsx'
import AdjustTokens from './pages/AdjustTokens.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas text-slate-500">
        Loading…
      </div>
    )
  }
  if (!user || user.role !== 'ADMIN') return <Navigate to="/login" replace />
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
                <Route path="/users" element={<Users />} />
                <Route path="/services" element={<Services />} />
                <Route path="/questionnaires" element={<Questionnaires />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pages" element={<Pages />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/tokens" element={<AdjustTokens />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  )
}

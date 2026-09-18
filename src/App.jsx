import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LockedLeads from './pages/LockedLeads.jsx'
import RecentLeads from './pages/RecentLeads.jsx'
import RecentPros from './pages/RecentPros.jsx'
import Leads from './pages/Leads.jsx'
import Professionals from './pages/Professionals.jsx'
import ProMgmt from './pages/ProMgmt.jsx'
import PaymentDetails from './pages/PaymentDetails.jsx'
import SystemUsers from './pages/SystemUsers.jsx'
import BusinessRegistration from './pages/BusinessRegistration.jsx'
import CategoryErrors from './pages/CategoryErrors.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas text-slate-500">
        Loading…
      </div>
    )
  }
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/login" replace />
  }
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
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/business-registration" element={<BusinessRegistration />} />
                <Route path="/category-errors" element={<CategoryErrors />} />
                <Route path="/system-users" element={<SystemUsers />} />
                <Route path="/locked-leads" element={<LockedLeads />} />
                <Route path="/recent-leads" element={<RecentLeads />} />
                <Route path="/recent-pros" element={<RecentPros />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/professionals" element={<Professionals />} />
                <Route path="/pro-mgmt" element={<ProMgmt />} />
                <Route path="/recent-payment-online" element={<PaymentDetails variant="online" />} />
                <Route path="/recent-payment" element={<PaymentDetails variant="recent" />} />
                <Route path="/recent-purchases" element={<PaymentDetails variant="purchases" />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  )
}

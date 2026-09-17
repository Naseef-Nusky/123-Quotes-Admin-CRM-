import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users' },
  { to: '/services', label: 'Services' },
  { to: '/questionnaires', label: 'Questionnaires' },
  { to: '/requests', label: 'Requests' },
  { to: '/leads', label: 'Leads' },
  { to: '/packages', label: 'Token packages' },
  { to: '/payments', label: 'Payments' },
  { to: '/templates', label: 'Email templates' },
  { to: '/settings', label: 'Settings' },
  { to: '/pages', label: 'Pages' },
  { to: '/activity', label: 'Activity logs' },
  { to: '/tokens', label: 'Adjust tokens' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const displayName =
    user?.customer?.firstName ||
    user?.professional?.contactName ||
    user?.email

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-navy text-white">
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <img src="/logo.png" alt="123 Quotes" className="h-10 w-10 rounded-md object-contain" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">123 Quotes</p>
            <p className="text-[11px] uppercase tracking-wider text-muted">Admin CRM</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-blue text-white' : 'text-muted hover:bg-panel hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 text-xs font-semibold text-muted hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  )
}

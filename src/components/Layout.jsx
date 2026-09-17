import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/quotes', label: 'Quotes' },
  { to: '/leads', label: 'Leads' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col bg-navy text-white">
        <div className="border-b border-line px-5 py-5">
          <p className="font-display text-xl font-bold">123 Quotes</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-muted">Admin CRM</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-accent text-white' : 'text-muted hover:bg-panel hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-medium">{user?.name || user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-xs font-semibold text-muted hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  )
}

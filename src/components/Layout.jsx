import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Lock,
  Clock3,
  ListChecks,
  UserRound,
  UsersRound,
  Settings2,
  LogOut,
  Menu,
  X,
  CreditCard,
  Wallet,
  ShoppingBag,
  Shield,
  ClipboardCheck,
  TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: '/business-registration', label: 'Business Registration', icon: ClipboardCheck },
      { to: '/category-errors', label: 'Category Errors', icon: TriangleAlert },
      { to: '/system-users', label: 'System Users', icon: Shield },
    ],
  },
  {
    title: 'Leads',
    items: [
      { to: '/locked-leads', label: 'Locked Leads', icon: Lock },
      { to: '/recent-leads', label: 'Recent Leads', icon: Clock3 },
      { to: '/leads', label: 'All Leads', icon: ListChecks },
    ],
  },
  {
    title: 'Professionals',
    items: [
      { to: '/recent-pros', label: 'Recent Pro.', icon: UserRound },
      { to: '/professionals', label: 'Professional', icon: UsersRound },
      { to: '/pro-mgmt', label: 'Pro.Mgmt', icon: Settings2 },
    ],
  },
  {
    title: 'Payment Details',
    items: [
      { to: '/recent-payment-online', label: 'Recent Payment Online', icon: CreditCard },
      { to: '/recent-payment', label: 'Recent Payment', icon: Wallet },
      { to: '/recent-purchases', label: 'Recent purchases', icon: ShoppingBag },
    ],
  },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const displayName =
    user?.name ||
    user?.customer?.firstName ||
    user?.professional?.contactName ||
    user?.email ||
    'Admin'

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-sm">
            <img src="/logo.png" alt="123 Quotes" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-white">123 Quotes</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-200/80">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue text-white shadow-lg shadow-blue/25'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="size-[18px] shrink-0" strokeWidth={1.9} />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-left text-xs font-semibold text-white transition hover:bg-blue"
          >
            <LogOut className="size-3.5" strokeWidth={2} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-hidden bg-navy lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-navy shadow-2xl">{sidebar}</aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-navy lg:hidden"
              aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div>
              <p className="text-sm font-semibold text-navy">Admin Console</p>
              <p className="text-xs text-slate-500">Manage leads, pros & platform settings</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

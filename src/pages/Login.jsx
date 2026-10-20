import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useAuth } from '../context/auth.js'
import { Button } from '../components/ui.jsx'

const DEMO_ACCOUNTS = [
  {
    label: 'Super admin',
    email: 'superadmin@123quotes.com',
    password: 'superadmin123',
  },
  {
    label: 'Admin',
    email: 'admin@123quotes.com',
    password: 'admin123',
  },
]

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    setShowPassword(true)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4">
      <form
        onSubmit={onSubmit}
        autoComplete="off"
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl"
      >
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="123 Quotes" className="h-14 w-auto object-contain" />
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <LockKeyhole className="size-3.5" strokeWidth={2} />
            Admin CRM Login
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-navy">
            Email
            <input
              type="email"
              name="crm-email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            Password
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                name="crm-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2.5 pr-11 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={2} />
                ) : (
                  <Eye className="size-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-warn">{error}</p> : null}

        <Button type="submit" disabled={loading} className="mt-6 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="mt-4 space-y-2">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Quick fill (dev)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-blue hover:text-navy"
              >
                <span className="block font-semibold text-navy">{account.label}</span>
                <span className="block truncate">{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { Button } from '../components/ui.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('superadmin@123quotes.com')
  const [password, setPassword] = useState('superadmin123')
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

  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo.png"
            alt="123 Quotes"
            className="h-14 w-auto object-contain"
          />
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

        {error && <p className="mt-3 text-sm text-warn">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-6 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="mt-4 text-center text-xs text-slate-400">
          Super admin: superadmin@123quotes.com / superadmin123
        </p>
      </form>
    </div>
  )
}

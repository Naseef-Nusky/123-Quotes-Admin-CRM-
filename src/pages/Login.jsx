import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('admin@123quotes.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

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
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl"
      >
        <p className="font-display text-2xl font-bold text-navy">123 Quotes</p>
        <h1 className="mt-1 text-lg font-semibold text-navy/80">Admin CRM Login</h1>

        <label className="mt-6 block text-sm font-semibold">
          Email
          <input
            className="mt-1 w-full rounded-md border border-line/30 px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Password
          <input
            className="mt-1 w-full rounded-md border border-line/30 px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="mt-3 text-sm text-warn">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-center text-xs text-muted">
          Default: admin@123quotes.com / admin123
        </p>
      </form>
    </div>
  )
}

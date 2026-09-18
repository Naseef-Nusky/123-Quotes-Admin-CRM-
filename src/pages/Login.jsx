import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Button, Input } from '../components/ui.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('superadmin@123quotes.com')
  const [password, setPassword] = useState('superadmin123')
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
          <h1 className="mt-4 text-sm font-semibold text-slate-500">Admin CRM Login</h1>
        </div>

        <div className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
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

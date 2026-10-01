import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Unlock } from 'lucide-react'
import { api } from '../api/client.js'
import { Button, Card, ErrorBanner } from '../components/ui.jsx'

export default function Dashboard() {
  const [locked, setLocked] = useState(false)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .getDashboard()
      .then((dash) => {
        if (cancelled) return
        setStats(dash.stats || null)
        setLocked(Boolean(dash.leadViewLocked))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function toggleLock() {
    setBusy(true)
    setError('')
    try {
      const next = !locked
      await api.upsertSetting({ key: 'lead_view_locked', value: next })
      setLocked(next)
    } catch (err) {
      setError(err.message || 'Failed to update lock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <ErrorBanner message={error} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Lead lock controls and platform overview.</p>
          <p className="mt-2 text-sm text-slate-500">
            Unlock token pricing is on the{' '}
            <Link to="/token-adjust" className="font-semibold text-blue hover:underline">
              Default Token Adjust
            </Link>{' '}
            tab.
          </p>
        </div>
        <Card className="p-4">
          <p className="text-sm font-semibold text-navy">Lock Lead View :</p>
          <Button
            variant={locked ? 'primary' : 'danger'}
            className="mt-2 inline-flex items-center gap-2"
            disabled={busy}
            onClick={toggleLock}
          >
            {locked ? <Unlock className="size-4" strokeWidth={2} /> : <Lock className="size-4" strokeWidth={2} />}
            {locked ? 'Click here to Unlock' : 'Click here to Lock'}
          </Button>
          <p className="mt-2 max-w-xs text-xs text-slate-500">
            Click to Lock / Unlock all outgoing leads to Service Providers.
          </p>
          <p className="mt-2 text-xs font-semibold text-blue">
            Status: {locked ? 'LOCKED' : 'UNLOCKED'} · Open leads: {stats?.leads ?? '—'}
          </p>
        </Card>
      </div>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Customers', value: stats.customers, to: '/customers' },
            { label: 'Professionals', value: stats.professionals, to: '/professionals' },
            { label: 'Requests', value: stats.requests, to: '/leads' },
            { label: 'Unlocks', value: stats.unlocks, to: '/locked-leads' },
          ].map((s) => (
            <Link key={s.label} to={s.to} className="block transition hover:-translate-y-0.5">
              <Card className="h-full p-4 hover:border-blue/40 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-navy">{s.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

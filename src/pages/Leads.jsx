import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Loading,
  PageHeader,
  StatusBadge,
  Table,
  formatDate,
} from '../components/ui.jsx'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getLeads()
      setLeads(data.leads || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function rematch(id) {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      const data = await api.rematchLead(id)
      setMessage(`Rematched lead — ${data.matchCount ?? 0} matches.`)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'service',
      label: 'Lead',
      render: (l) => (
        <div>
          <p className="font-medium">{l.service?.name || '—'}</p>
          <p className="text-xs text-slate-500">
            {l.request?.customer?.firstName} {l.request?.customer?.lastName} · {l.postcode}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'matches',
      label: 'Matches',
      render: (l) => l.matches?.length ?? 0,
    },
    {
      key: 'unlocks',
      label: 'Unlocks',
      render: (l) => l.unlocks?.length ?? 0,
    },
    { key: 'tokenCost', label: 'Cost' },
    { key: 'createdAt', label: 'Created', render: (l) => formatDate(l.createdAt) },
    {
      key: 'actions',
      label: '',
      render: (l) => (
        <Button variant="secondary" disabled={busyId === l.id} onClick={() => rematch(l.id)}>
          {busyId === l.id ? 'Rematching…' : 'Rematch'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Matched leads and unlock activity."
        actions={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />
      <ErrorBanner message={error} />
      {message && (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-ok">
          {message}
        </p>
      )}
      {loading ? <Loading /> : <Table columns={columns} rows={leads} empty="No leads found." />}
    </div>
  )
}

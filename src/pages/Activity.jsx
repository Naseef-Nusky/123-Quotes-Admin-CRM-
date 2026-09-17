import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Loading,
  PageHeader,
  Table,
  formatDate,
} from '../components/ui.jsx'

export default function Activity() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getActivity()
      setLogs(data.logs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (l) => <span className="font-medium">{l.action}</span>,
    },
    {
      key: 'user',
      label: 'User',
      render: (l) => (
        <div>
          <p>{l.user?.email || '—'}</p>
          <p className="text-xs text-slate-500">{l.user?.role || ''}</p>
        </div>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (l) =>
        l.entityType ? `${l.entityType}${l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ''}` : '—',
    },
    { key: 'ip', label: 'IP', render: (l) => l.ip || '—' },
    { key: 'createdAt', label: 'When', render: (l) => formatDate(l.createdAt) },
  ]

  return (
    <div>
      <PageHeader
        title="Activity logs"
        subtitle="Recent admin and user actions."
        actions={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />
      <ErrorBanner message={error} />
      {loading ? <Loading /> : <Table columns={columns} rows={logs} empty="No activity yet." />}
    </div>
  )
}

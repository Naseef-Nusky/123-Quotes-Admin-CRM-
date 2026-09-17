import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Loading,
  PageHeader,
  Select,
  StatusBadge,
  Table,
  formatDate,
} from '../components/ui.jsx'

const STATUSES = ['DRAFT', 'SUBMITTED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function Requests() {
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getRequests(status || undefined)
      setRequests(data.requests || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  async function changeStatus(id, next) {
    setBusyId(id)
    setError('')
    try {
      await api.updateRequestStatus(id, next)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (r) => (
        <div>
          <p className="font-medium">
            {r.customer?.firstName} {r.customer?.lastName}
          </p>
          <p className="text-xs text-slate-500">{r.postcode}</p>
        </div>
      ),
    },
    { key: 'service', label: 'Service', render: (r) => r.service?.name || '—' },
    {
      key: 'title',
      label: 'Title',
      render: (r) => r.title || r.description?.slice(0, 40) || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      label: 'Update',
      render: (r) => (
        <select
          className="rounded-md border border-slate-200 px-2 py-1.5 text-xs"
          value={r.status}
          disabled={busyId === r.id}
          onChange={(e) => changeStatus(r.id, e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Requests"
        subtitle="Customer quote requests."
        actions={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />
      <div className="mb-4 max-w-xs">
        <Select label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <Table columns={columns} rows={requests} empty="No requests found." />
      )}
    </div>
  )
}

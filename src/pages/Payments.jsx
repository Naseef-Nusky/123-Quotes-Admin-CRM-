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
  formatMoney,
} from '../components/ui.jsx'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPayments()
      setPayments(data.payments || [])
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
      key: 'user',
      label: 'User',
      render: (p) => p.user?.email || '—',
    },
    {
      key: 'package',
      label: 'Package',
      render: (p) => p.package?.name || '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (p) => formatMoney(p.amountCents, p.currency || 'GBP'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    { key: 'createdAt', label: 'Date', render: (p) => formatDate(p.createdAt) },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Recent token purchases and payment records."
        actions={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <Table columns={columns} rows={payments} empty="No payments found." />
      )}
    </div>
  )
}

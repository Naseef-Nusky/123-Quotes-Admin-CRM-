import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { DataTable } from '../components/AdminViews.jsx'
import { Button, ErrorBanner, StatusBadge, formatDate, formatMoney } from '../components/ui.jsx'

function displayName(user) {
  if (!user) return '—'
  if (user.professional?.contactName) return user.professional.contactName
  if (user.professional?.companyName) return user.professional.companyName
  if (user.customer?.firstName) {
    return `${user.customer.firstName} ${user.customer.lastName || ''}`.trim()
  }
  return user.email || '—'
}

function displayPhone(user) {
  return user?.professional?.phone || user?.customer?.phone || '—'
}

function mapApiPayment(p) {
  const tokens = p.meta?.tokens ?? p.package?.tokens
  return {
    id: p.id,
    name: displayName(p.user),
    email: p.user?.email || '—',
    phone: displayPhone(p.user),
    package: p.package?.name || (p.subscriptionId ? 'Subscription' : 'Payment'),
    tokens: tokens ?? '—',
    amount: formatMoney(p.amountCents, p.currency || 'GBP'),
    method: String(p.provider || 'online').replace(/^\w/, (c) => c.toUpperCase()),
    status: p.status,
    date: formatDate(p.createdAt),
    reference: p.providerPaymentId || p.id.slice(0, 8),
  }
}

const CONFIG = {
  online: {
    title: 'Recent Payment Online',
    apiType: 'online',
    searchKeys: ['name', 'email', 'phone', 'package', 'method', 'reference', 'status'],
    columns: [
      { key: '#', label: '#', render: (_row, idx) => idx + 1 },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Contact No' },
      { key: 'package', label: 'Package' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'date', label: 'Date' },
      { key: 'reference', label: 'Reference' },
      {
        key: 'action',
        label: 'Action',
        render: () => <Button variant="secondary">View</Button>,
      },
    ],
  },
  recent: {
    title: 'Recent Payment',
    apiType: 'all',
    searchKeys: ['name', 'email', 'phone', 'package', 'method', 'reference', 'status'],
    columns: [
      { key: '#', label: '#', render: (_row, idx) => idx + 1 },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Contact No' },
      { key: 'package', label: 'Details' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'date', label: 'Date' },
      { key: 'reference', label: 'Reference' },
      {
        key: 'action',
        label: 'Action',
        render: () => <Button variant="secondary">View</Button>,
      },
    ],
  },
  purchases: {
    title: 'Recent purchases',
    apiType: 'purchases',
    searchKeys: ['name', 'email', 'phone', 'package', 'status'],
    columns: [
      { key: '#', label: '#', render: (_row, idx) => idx + 1 },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Contact No' },
      { key: 'package', label: 'Package' },
      { key: 'tokens', label: 'Tokens' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'date', label: 'Date' },
      {
        key: 'action',
        label: 'Action',
        render: () => <Button variant="secondary">View</Button>,
      },
    ],
  },
}

export default function PaymentDetails({ variant = 'online' }) {
  const config = CONFIG[variant] || CONFIG.online
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const current = CONFIG[variant] || CONFIG.online
    setLoading(true)
    setError('')
    setRows([])

    api
      .getPayments({ type: current.apiType })
      .then((data) => {
        if (cancelled) return
        setRows((data.payments || []).map(mapApiPayment))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load payments')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [variant])

  const subtitle = useMemo(
    () => (loading ? 'Loading payment records…' : 'Live payment records from the API.'),
    [loading],
  )

  return (
    <div>
      <ErrorBanner message={error} />
      <p className="mb-2 text-sm text-slate-500">{subtitle}</p>
      <DataTable
        title={config.title}
        columns={config.columns}
        rows={rows}
        searchKeys={config.searchKeys}
      />
    </div>
  )
}

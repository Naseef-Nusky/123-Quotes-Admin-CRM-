import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { DataTable } from '../components/AdminViews.jsx'
import { Button, ErrorBanner, Modal, StatusBadge, formatDate, formatMoney } from '../components/ui.jsx'

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
    amountRaw: p.amountCents,
    currency: p.currency || 'GBP',
    method: 'Square',
    status: p.status,
    date: formatDate(p.createdAt),
    createdAt: p.createdAt,
    reference: p.providerPaymentId || p.id.slice(0, 8),
    providerPaymentId: p.providerPaymentId || '—',
    subscriptionId: p.subscriptionId || null,
    packageName: p.package?.name || null,
    userRole: p.user?.role || '—',
  }
}

export default function PaymentDetails({ variant = 'recent' }) {
  const isPurchases = variant === 'purchases'
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setRows([])
    setActive(null)

    api
      .getPayments({ type: isPurchases ? 'purchases' : 'square' })
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
  }, [isPurchases])

  const columns = useMemo(
    () => [
      { key: '#', label: '#', render: (_row, idx) => idx + 1 },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Contact No' },
      { key: 'package', label: isPurchases ? 'Package' : 'Details' },
      ...(isPurchases ? [{ key: 'tokens', label: 'Tokens' }] : []),
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
      { key: 'date', label: 'Date' },
      ...(!isPurchases ? [{ key: 'reference', label: 'Reference' }] : []),
      {
        key: 'action',
        label: 'Action',
        render: (row) => (
          <Button variant="secondary" onClick={() => setActive(row)}>
            View
          </Button>
        ),
      },
    ],
    [isPurchases],
  )

  const searchKeys = isPurchases
    ? ['name', 'email', 'phone', 'package', 'status']
    : ['name', 'email', 'phone', 'package', 'reference', 'status']

  const subtitle = loading
    ? 'Loading Square payment records…'
    : 'Square is the only payment method on this platform.'

  return (
    <div>
      <ErrorBanner message={error} />
      <p className="mb-2 text-sm text-slate-500">{subtitle}</p>
      <DataTable
        title={isPurchases ? 'Recent purchases' : 'Square Payments'}
        columns={columns}
        rows={rows}
        searchKeys={searchKeys}
      />

      <Modal open={!!active} title="Payment details" onClose={() => setActive(null)}>
        {active ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-navy">Name:</span> {active.name}
            </p>
            <p>
              <span className="font-semibold text-navy">Email:</span> {active.email}
            </p>
            <p>
              <span className="font-semibold text-navy">Phone:</span> {active.phone}
            </p>
            <p>
              <span className="font-semibold text-navy">Role:</span> {active.userRole}
            </p>
            <p>
              <span className="font-semibold text-navy">
                {isPurchases ? 'Package' : 'Details'}:
              </span>{' '}
              {active.package}
            </p>
            {active.tokens !== '—' ? (
              <p>
                <span className="font-semibold text-navy">Tokens:</span> {active.tokens}
              </p>
            ) : null}
            <p>
              <span className="font-semibold text-navy">Amount:</span> {active.amount}
            </p>
            <p>
              <span className="font-semibold text-navy">Method:</span> {active.method}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-navy">Status:</span>
              <StatusBadge status={active.status} />
            </p>
            <p>
              <span className="font-semibold text-navy">Date:</span> {active.date}
            </p>
            <p>
              <span className="font-semibold text-navy">Reference:</span> {active.reference}
            </p>
            <p>
              <span className="font-semibold text-navy">Provider ID:</span>{' '}
              {active.providerPaymentId}
            </p>
            {active.subscriptionId ? (
              <p>
                <span className="font-semibold text-navy">Subscription:</span>{' '}
                {active.subscriptionId}
              </p>
            ) : null}
            <p>
              <span className="font-semibold text-navy">Payment ID:</span> {active.id}
            </p>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setActive(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

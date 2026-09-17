const badgeStyles = {
  ACTIVE: 'bg-emerald-50 text-ok',
  PENDING: 'bg-amber-50 text-amber',
  SUSPENDED: 'bg-red-50 text-warn',
  INACTIVE: 'bg-slate-100 text-slate-600',
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-50 text-blue',
  MATCHED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-amber-50 text-amber',
  COMPLETED: 'bg-emerald-50 text-ok',
  CANCELLED: 'bg-red-50 text-warn',
  OPEN: 'bg-blue-50 text-blue',
  PARTIALLY_UNLOCKED: 'bg-amber-50 text-amber',
  CLOSED: 'bg-slate-100 text-slate-600',
  COMPLETED_PAY: 'bg-emerald-50 text-ok',
  FAILED: 'bg-red-50 text-warn',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

export function StatusBadge({ status }) {
  if (!status) return null
  const style = badgeStyles[status] || 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${style}`}>
      {String(status).replaceAll('_', ' ')}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Button({ variant = 'primary', type = 'button', className = '', children, ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50'
  const variants = {
    primary: 'bg-blue text-white hover:bg-blue-dark',
    secondary: 'border border-slate-200 bg-white text-navy hover:bg-slate-50',
    danger: 'bg-warn text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}
      <input
        className={`mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}
      <select
        className={`mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}
      <textarea
        className={`mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4">
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-xl bg-white p-6 shadow-xl ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Table({ columns, rows, empty = 'No records found.', rowKey = 'id' }) {
  if (!rows?.length) {
    return (
      <Card className="px-6 py-10 text-center text-sm text-slate-500">{empty}</Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row[rowKey] ?? idx} className="border-t border-slate-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-warn">
      {message}
    </p>
  )
}

export function Loading() {
  return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
}

export function formatMoney(cents, currency = 'GBP') {
  const amount = (Number(cents) || 0) / 100
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

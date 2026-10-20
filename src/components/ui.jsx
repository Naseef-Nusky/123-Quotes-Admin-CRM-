import { Eye, Pencil, Trash2 } from 'lucide-react'

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
  ADMIN: 'bg-blue-50 text-blue',
  SUPER_ADMIN: 'bg-navy/10 text-navy',
  CUSTOMER: 'bg-slate-100 text-slate-600',
  PROFESSIONAL: 'bg-emerald-50 text-ok',
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
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {actions}
        </div>
      )}
    </div>
  )
}

/** Labelled dropdown used for table filters. */
export function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-navy">
      {label ? <span className="whitespace-nowrap">{label}</span> : null}
      <select
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  )
}

/** Read-only label/value grid used by every View modal. */
export function DetailGrid({ items }) {
  const visible = (items || []).filter((i) => i.value !== undefined)
  if (!visible.length) return null
  return (
    <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
      {visible.map((item) => (
        <div key={item.label} className={item.wide ? 'sm:col-span-2' : ''}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </dt>
          <dd
            className={`mt-0.5 text-sm font-medium text-navy ${
              /date|created|login|joined/i.test(item.label) ? 'whitespace-nowrap' : 'break-words'
            }`}
          >
            {item.value === null || item.value === '' ? '—' : item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Icon-only action button for table Actions columns (tooltip = label). */
export function ActionIconButton({ label, variant = 'secondary', className = '', children, ...props }) {
  return (
    <Button
      size="icon"
      variant={variant}
      title={label}
      aria-label={label}
      className={className}
      {...props}
    >
      {children}
    </Button>
  )
}

export function ViewAction(props) {
  return (
    <ActionIconButton label="View" variant="ghost" {...props}>
      <Eye className="size-4" />
    </ActionIconButton>
  )
}

export function EditAction(props) {
  return (
    <ActionIconButton label="Edit" variant="secondary" {...props}>
      <Pencil className="size-4" />
    </ActionIconButton>
  )
}

export function DeleteAction(props) {
  return (
    <ActionIconButton label="Delete" variant="danger" {...props}>
      <Trash2 className="size-4" />
    </ActionIconButton>
  )
}

/** Row action buttons: always on a single line, never wrap. */
export function RowActions({ children, className = '' }) {
  return (
    <div className={`flex flex-nowrap items-center gap-1.5 whitespace-nowrap ${className}`}>
      {children}
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

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-semibold transition touch-manipulation active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'
  const sizes = {
    sm: 'min-h-8 px-2.5 py-1.5 text-xs sm:px-3 sm:text-[13px]',
    md: 'min-h-9 px-3 py-2 text-[13px] sm:px-3.5 sm:text-sm',
    icon: 'size-8 p-0 text-sm',
  }
  const variants = {
    primary: 'bg-blue text-white hover:bg-blue-dark',
    secondary: 'border border-slate-200 bg-white text-navy hover:bg-slate-50',
    danger: 'bg-warn text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button
      type={type}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant]} ${className}`}
      {...props}
    >
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
          wide ? 'max-w-4xl' : 'max-w-xl'
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
      <div className="overflow-x-hidden">
        <table className="w-full text-left text-[13px] [&_td]:[overflow-wrap:anywhere]">
          <thead className="bg-canvas text-slate-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2.5 py-2.5 font-medium whitespace-nowrap ${
                    col.key === 'action' || col.key === 'actions' ? 'text-right' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row[rowKey] ?? idx} className="border-t border-slate-100">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-2.5 py-2.5 align-middle ${
                      col.key === 'action' || col.key === 'actions'
                        ? 'whitespace-nowrap'
                        : /date|created|joined/i.test(`${col.key} ${col.label || ''}`)
                          ? 'whitespace-nowrap'
                          : ''
                    }`}
                  >
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

export function Loading({ className = '', overlay = false } = {}) {
  const ring = (
    <div className="size-8 animate-spin rounded-full border-2 border-blue border-t-transparent" />
  )

  if (overlay) {
    return (
      <div
        className={`fixed inset-0 z-[100] grid place-items-center backdrop-blur-[2px] ${className}`}
        aria-busy="true"
        aria-label="Loading"
      >
        {ring}
      </div>
    )
  }

  return (
    <div
      className={`grid min-h-[8rem] place-items-center rounded-xl backdrop-blur-[2px] ${className}`}
      aria-busy="true"
      aria-label="Loading"
    >
      {ring}
    </div>
  )
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
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

import { useMemo, useState } from 'react'
import { MapPin, Zap, Phone, Mail } from 'lucide-react'
import { Button, Card, Input, Modal, Select, Textarea } from './ui.jsx'

const LEAD_STATUSES = ['OPEN', 'MATCHED', 'PARTIALLY_UNLOCKED', 'CLOSED', 'CANCELLED']

function splitMultiValue(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function LeadAnswerField({ detail, onChange }) {
  const options = detail.options || []
  const type = detail.type || 'TEXT'

  if (type === 'DROPDOWN' && options.length) {
    const values = new Set(options.map((o) => o.value))
    const current = values.has(detail.a) ? detail.a : ''
    return (
      <Select label={detail.q} value={current} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.id || opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {detail.a && !values.has(detail.a) ? (
          <option value={detail.a}>{detail.a} (current)</option>
        ) : null}
      </Select>
    )
  }

  if (type === 'SINGLE_CHOICE' && options.length) {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy">{detail.q}</legend>
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.id || opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                detail.a === opt.value
                  ? 'border-blue bg-blue/5 text-navy'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name={`lead-q-${detail.questionId || detail.q}`}
                className="size-4 accent-blue"
                checked={detail.a === opt.value}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (type === 'MULTIPLE_CHOICE' && options.length) {
    const selected = splitMultiValue(detail.a)
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy">{detail.q}</legend>
        <div className="space-y-2">
          {options.map((opt) => {
            const checked = selected.includes(opt.value)
            return (
              <label
                key={opt.id || opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  checked ? 'border-blue bg-blue/5 text-navy' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-blue"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value]
                    onChange(next.join(', '))
                  }}
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  if (type === 'TEXT') {
    return (
      <Input label={detail.q} value={detail.a || ''} onChange={(e) => onChange(e.target.value)} />
    )
  }

  return (
    <Textarea
      label={detail.q}
      rows={2}
      value={detail.a || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function LeadSplitView({
  title = 'Leads',
  searchPlaceholder = 'Search Lead.',
  items,
  filterLocked,
  showConfirm = false,
  onDelete,
  onEdit,
  onConfirm,
  loading = false,
}) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const list = useMemo(() => {
    let rows = items || []
    if (filterLocked === true) rows = rows.filter((l) => l.locked)
    if (filterLocked === false) rows = rows.filter((l) => !l.locked)
    const term = q.trim().toLowerCase()
    if (term) {
      rows = rows.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          l.service.toLowerCase().includes(term) ||
          l.email.toLowerCase().includes(term),
      )
    }
    return rows
  }, [items, q, filterLocked])

  const [selectedId, setSelectedId] = useState(list[0]?.id)
  const selected = list.find((l) => l.id === selectedId) || list[0]

  function openEdit(lead) {
    setEditing(lead)
    setForm({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email === '—' ? '' : lead.email || '',
      phone: lead.phone === '—' ? '' : lead.phone || '',
      postcode: lead.postcodeRaw || '',
      status: lead.status || 'OPEN',
      details: (lead.details || []).map((d) => ({
        questionId: d.questionId || null,
        q: d.q || 'Question',
        a: d.a === '—' ? '' : d.a || '',
        type: d.type || 'TEXTAREA',
        options: d.options || [],
      })),
    })
    setEditError('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!onEdit || !editing) return
    setSaving(true)
    setEditError('')
    try {
      const details = form.details || []
      const answers = details
        .filter((d) => d.questionId)
        .map((d) => ({ questionId: d.questionId, value: d.a }))
      const summary = details
        .map((d) => String(d.a || '').trim())
        .filter(Boolean)
        .join(' / ')

      await onEdit(editing.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        postcode: form.postcode.trim(),
        status: form.status,
        summary,
        ...(answers.length ? { answers } : {}),
      })
      setEditing(null)
    } catch (err) {
      setEditError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  function updateDetail(index, value) {
    setForm((f) => ({
      ...f,
      details: (f.details || []).map((d, i) => (i === index ? { ...d, a: value } : d)),
    }))
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy">{title}</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-[70vh] flex-col lg:flex-row">
          <aside className="max-h-[70vh] w-full overflow-y-auto border-b border-slate-200 lg:max-h-none lg:w-[360px] lg:border-b-0 lg:border-r">
            <div className="sticky top-0 border-b border-slate-200 bg-white p-3">
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                placeholder={searchPlaceholder}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {loading ? <p className="p-4 text-sm text-slate-500">Loading…</p> : null}
            {list.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedId(lead.id)}
                className={`w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                  selected?.id === lead.id ? 'bg-blue/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-navy">{lead.name}</p>
                  <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {lead.ago}
                  </span>
                </div>
                <p className="mt-1 font-bold text-navy">{lead.service}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{lead.snippet}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-blue" strokeWidth={2} /> {lead.postcode}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Zap className="size-3.5 text-blue" strokeWidth={2} /> {lead.interest}
                  </span>
                </div>
              </button>
            ))}
            {!list.length ? <p className="p-4 text-sm text-slate-500">No leads found.</p> : null}
          </aside>

          <div className="flex-1 p-5 sm:p-7">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">{selected.name}</h2>
                    <span className="mt-2 inline-flex rounded-full bg-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {selected.ago}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {onEdit ? (
                      <Button variant="secondary" onClick={() => openEdit(selected)}>
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      onClick={() => onDelete?.(selected)}
                      disabled={!onDelete}
                    >
                      Delete
                    </Button>
                    {showConfirm ? (
                      <Button variant="primary" onClick={() => onConfirm?.(selected)}>
                        Confirm
                      </Button>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 text-lg font-bold text-navy">{selected.service}</p>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-blue" strokeWidth={2} />
                    <span>{selected.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-blue" strokeWidth={2} />
                    <span>{selected.email}</span>
                  </p>
                </div>

                <div className="mt-8">
                  <h3 className="border-b border-slate-200 pb-2 text-lg font-bold text-navy">
                    Details Provided
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm">
                    {selected.details.map((d) => (
                      <li key={d.q}>
                        <span className="text-slate-600">• {d.q}</span>{' '}
                        {d.a ? <span className="font-bold text-navy">{d.a}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-slate-500">Select a lead to view details.</p>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!editing} title="Edit lead" onClose={() => setEditing(null)} wide>
        {editing ? (
          <form className="space-y-3" onSubmit={saveEdit}>
            {editError ? <p className="text-sm text-warn">{editError}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Postcode"
              value={form.postcode}
              onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-sm font-semibold text-navy">Details / questions</p>
              <p className="text-xs text-slate-500">
                Edit each answer below. The lead summary is rebuilt from these answers.
              </p>
              {(form.details || []).map((d, index) => (
                <LeadAnswerField
                  key={d.questionId || `detail-${index}`}
                  detail={d}
                  onChange={(value) => updateDetail(index, value)}
                />
              ))}
              {!(form.details || []).length ? (
                <p className="text-xs text-slate-500">No questionnaire answers on this lead.</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

export function DataTable({
  title,
  columns,
  rows,
  searchKeys = [],
  pageSizeOptions = [10, 25, 50],
}) {
  const [q, setQ] = useState('')
  const [pageSize, setPageSize] = useState(pageSizeOptions[0])
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(term)),
    )
  }, [rows, q, searchKeys])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const slice = filtered.slice(start, start + pageSize)

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy">{title}</h1>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <label className="text-sm text-slate-600">
            Show{' '}
            <select
              className="rounded border border-slate-200 px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>{' '}
            entries
          </label>
          <label className="text-sm text-slate-600">
            Search:{' '}
            <input
              className="ml-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row, idx) => (
                <tr key={row.id || idx} className="border-t border-slate-100 hover:bg-slate-50/80">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-navy">
                      {c.render ? c.render(row, start + idx) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {!slice.length ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    No entries found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          <p>
            Showing {total ? start + 1 : 0} to {Math.min(start + pageSize, total)} of {total} entries
          </p>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
              disabled={current <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pages, 6) }).map((_, i) => {
              const n = i + 1
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`rounded border px-2.5 py-1 ${
                    current === n ? 'border-blue bg-blue text-white' : 'border-slate-200'
                  }`}
                >
                  {n}
                </button>
              )
            })}
            <button
              type="button"
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
              disabled={current >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

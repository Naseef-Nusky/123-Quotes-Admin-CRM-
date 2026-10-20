import { useEffect, useMemo, useState } from 'react'
import { Check, Coins, MapPin, Zap, Phone, Mail } from 'lucide-react'
import PhoneInput from './PhoneInput.jsx'
import PostcodeInput from './PostcodeInput.jsx'
import {
  UnlockTokenTiersForm,
  normalizeUnlockTiersForUi,
  serializeUnlockTiers,
} from './UnlockTokenTiersForm.jsx'
import {
  DEFAULT_COUNTRY_CODE,
  dialForCountry,
  formatIntlPhone,
  parseIntlPhone,
} from '../data/countryDialCodes.js'
import { ActionIconButton, Button, Card, DeleteAction, EditAction, Input, Loading, Modal, RowActions, Select, Textarea } from './ui.jsx'

const LEAD_STATUSES = ['OPEN', 'MATCHED', 'PARTIALLY_UNLOCKED', 'CLOSED', 'CANCELLED']

function splitMultiValue(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function optionMatches(opt, stored) {
  const t = String(stored ?? '').trim()
  if (!t) return false
  return (
    String(opt.id || '') === t ||
    String(opt.value ?? '').trim() === t ||
    String(opt.label ?? '').trim() === t
  )
}

function optionToken(opt) {
  if (opt?.id) return String(opt.id)
  const value = String(opt?.value ?? '').trim()
  if (value) return value
  return String(opt?.label ?? '').trim()
}

export function LeadAnswerField({ detail, onChange }) {
  const options = detail.options || []
  const type = detail.type || 'TEXT'

  if (type === 'DROPDOWN' && options.length) {
    const matched = options.find((o) => optionMatches(o, detail.a))
    const current = matched ? optionToken(matched) : ''
    return (
      <Select label={detail.q} value={current} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.id || opt.value} value={optionToken(opt)}>
            {opt.label}
          </option>
        ))}
        {detail.a && !matched ? (
          <option value={detail.a}>{detail.a} (current)</option>
        ) : null}
      </Select>
    )
  }

  if ((type === 'SINGLE_CHOICE' || type === 'SINGLE_CHECKBOX') && options.length) {
    const control = type === 'SINGLE_CHECKBOX' ? 'checkbox' : 'radio'
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy">{detail.q}</legend>
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = optionMatches(opt, detail.a)
            return (
              <label
                key={opt.id || opt.value}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                  selected
                    ? 'border-blue bg-blue/5 text-navy'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type={control}
                  name={control === 'radio' ? `lead-q-${detail.questionId || detail.q}` : undefined}
                  className="size-4 shrink-0 accent-blue"
                  checked={selected}
                  onChange={() => onChange(optionToken(opt))}
                />
                <span className="min-w-0 flex-1 break-words">{opt.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  if ((type === 'MULTIPLE_CHOICE' || type === 'MULTIPLE_RADIO') && options.length) {
    const selected = splitMultiValue(detail.a)
    const control = type === 'MULTIPLE_RADIO' ? 'radio' : 'checkbox'
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-navy">{detail.q}</legend>
        <div className="space-y-2">
          {options.map((opt) => {
            const token = optionToken(opt)
            const checked = selected.some((v) => optionMatches(opt, v))
            const applyToggle = () => {
              const next = checked
                ? selected.filter(
                    (v) =>
                      v !== token &&
                      v !== String(opt.id || '') &&
                      v !== String(opt.value ?? '') &&
                      v !== String(opt.label ?? ''),
                  )
                : [...selected.filter((v) => !optionMatches(opt, v)), token]
              onChange(next.join(', '))
            }
            return (
              <label
                key={opt.id || opt.value}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                  checked ? 'border-blue bg-blue/5 text-navy' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <input
                  type={control}
                  className="size-4 shrink-0 accent-blue"
                  checked={checked}
                  onChange={control === 'checkbox' ? applyToggle : undefined}
                  onClick={
                    control === 'radio'
                      ? (e) => {
                          e.preventDefault()
                          applyToggle()
                        }
                      : undefined
                  }
                />
                <span className="min-w-0 flex-1 break-words">{opt.label}</span>
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
  /** 'all' | 'locked' | 'unlocked' | 'recent' */
  mode = 'all',
  emptyMessage,
  showConfirm = false,
  onDelete,
  onEdit,
  onConfirm,
  unlockTiers = null,
  loading = false,
  leadViewLocked = false,
}) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [tokenLead, setTokenLead] = useState(null)
  const [tiers, setTiers] = useState([])
  const [useIndividual, setUseIndividual] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [tokenError, setTokenError] = useState('')

  const list = useMemo(() => {
    let rows = [...(items || [])]
    const resolvedMode =
      mode ||
      (filterLocked === true ? 'locked' : filterLocked === false ? 'unlocked' : 'all')

    if (resolvedMode === 'locked') {
      rows = rows.filter((l) => l.locked)
    } else if (resolvedMode === 'unlocked') {
      rows = rows.filter((l) => !l.locked)
    } else if (resolvedMode === 'recent') {
      const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30
      rows = rows.filter((l) => {
        if (l.status === 'CANCELLED') return false
        if (!l.createdAtMs) return true
        return l.createdAtMs >= cutoff
      })
    }

    const term = q.trim().toLowerCase()
    if (term) {
      rows = rows.filter((l) =>
        [l.name, l.service, l.email, l.phone, l.postcodeRaw, l.postcode, l.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      )
    }
    return rows
  }, [items, q, filterLocked, mode])

  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!list.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !list.some((l) => l.id === selectedId)) {
      setSelectedId(list[0].id)
    }
  }, [list, selectedId])

  const selected = list.find((l) => l.id === selectedId) || list[0] || null

  const defaultEmpty =
    mode === 'locked' || filterLocked === true
      ? leadViewLocked
        ? 'No locked leads found.'
        : 'No locked leads right now. Use Dashboard → Lock Lead View to hold all leads from professionals, or close a lead to see it here.'
      : mode === 'recent'
        ? 'No recent leads found.'
        : 'No leads found.'

  function openEdit(lead) {
    const parsed = parseIntlPhone(lead.phone === '—' ? '' : lead.phone || '')
    setEditing(lead)
    setForm({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email === '—' ? '' : lead.email || '',
      phone: parsed.localNumber,
      countryCode: parsed.countryCode || DEFAULT_COUNTRY_CODE,
      postcode: lead.postcodeRaw || '',
      status: lead.status || 'OPEN',
      details: (lead.details || []).map((d) => ({
        questionId: d.questionId || null,
        q: d.q || 'Question',
        a: d.a === '—' ? '' : d.a || '',
        display: d.display || '',
        type: d.type || 'TEXTAREA',
        options: d.options || [],
      })),
    })
    setEditError('')
  }

  function openTokens(lead) {
    const individual = Boolean(lead.hasCustomUnlockTiers)
    setTokenLead(lead)
    setUseIndividual(individual)
    setTiers(
      normalizeUnlockTiersForUi(
        individual
          ? lead.customUnlockTiers || lead.unlockTiers
          : unlockTiers || lead.unlockTiers,
      ),
    )
    setTokenError('')
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
        phone: form.phone
          ? formatIntlPhone(dialForCountry(form.countryCode), form.phone)
          : '',
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

  async function saveTokens(e) {
    e.preventDefault()
    if (!onEdit || !tokenLead) return
    setTokenSaving(true)
    setTokenError('')
    try {
      if (!useIndividual) {
        await onEdit(tokenLead.id, { unlockTiers: null })
      } else {
        const cleaned = serializeUnlockTiers(tiers)
        await onEdit(tokenLead.id, {
          unlockTiers: cleaned,
          tokenCost: cleaned[0]?.tokenCost || 1,
        })
      }
      setTokenLead(null)
    } catch (err) {
      setTokenError(err.message || 'Failed to update tokens for this lead')
    } finally {
      setTokenSaving(false)
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
        <div className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col lg:flex-row">
          <aside className="flex max-h-[40vh] w-full flex-col border-b border-slate-200 lg:h-full lg:max-h-none lg:w-[360px] lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-slate-200 bg-white p-3">
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                placeholder={searchPlaceholder}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? <Loading className="py-8" /> : null}
            {!loading
              ? list.map((lead) => (
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
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-blue" strokeWidth={2} /> {lead.postcode}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap className="size-3.5 text-blue" strokeWidth={2} /> {lead.tokenCost ?? 1}{' '}
                        token{(lead.tokenCost ?? 1) === 1 ? '' : 's'} next
                      </span>
                      <span className="text-slate-400">
                        {lead.unlockStatsLabel || `${lead.unlockedCount || 0} unlocks`}
                      </span>
                    </div>
                  </button>
                ))
              : null}
            {!loading && !list.length ? (
              <p className="p-4 text-sm text-slate-500">{emptyMessage || defaultEmpty}</p>
            ) : null}
            </div>
          </aside>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">{selected.name}</h2>
                    <span className="mt-2 inline-flex rounded-full bg-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {selected.ago}
                    </span>
                  </div>
                  <RowActions className="max-w-full overflow-x-auto">
                    {onEdit ? (
                      <>
                        <EditAction onClick={() => openEdit(selected)} />
                        <ActionIconButton
                          label="Tokens"
                          variant="secondary"
                          onClick={() => openTokens(selected)}
                        >
                          <Coins className="size-4" />
                        </ActionIconButton>
                      </>
                    ) : null}
                    <DeleteAction onClick={() => onDelete?.(selected)} disabled={!onDelete} />
                    {showConfirm ? (
                      <ActionIconButton
                        label="Confirm"
                        variant="primary"
                        onClick={() => onConfirm?.(selected)}
                      >
                        <Check className="size-4" />
                      </ActionIconButton>
                    ) : null}
                  </RowActions>
                </div>

                <p className="mt-4 text-lg font-bold text-navy">{selected.service}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue/10 px-2.5 py-1 font-semibold text-blue">
                    {selected.tokenCost ?? 1} token{(selected.tokenCost ?? 1) === 1 ? '' : 's'} next
                    unlock
                    <span className="ml-1 opacity-70">
                      ({selected.hasCustomUnlockTiers ? 'individual' : 'default'})
                    </span>
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    {selected.matchedCount ?? 0} matched pro
                    {(selected.matchedCount ?? 0) === 1 ? '' : 's'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    {selected.maxUnlocks > 0
                      ? `${selected.unlockedCount ?? 0}/${selected.maxUnlocks} unlocks`
                      : `${selected.unlockedCount ?? 0} unlocks`}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-blue" strokeWidth={2} />
                    <span>{selected.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-blue" strokeWidth={2} />
                    <span>{selected.email}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-blue" strokeWidth={2} />
                    <span>
                      <span className="font-semibold text-navy">
                        {selected.postcodeRaw || selected.postcode || '—'}
                      </span>
                      {selected.postcodeInfo ? (
                        <span className="block text-xs text-slate-500">
                          {[
                            selected.postcodeInfo.district,
                            selected.postcodeInfo.ward,
                            selected.postcodeInfo.country,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      ) : null}
                    </span>
                  </p>
                </div>

                <div className="mt-8">
                  <h3 className="border-b border-slate-200 pb-2 text-lg font-bold text-navy">
                    Details Provided
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm">
                    {(selected.details || []).map((d, idx) => (
                      <li key={d.questionId || `${d.q}-${idx}`}>
                        <span className="text-slate-600">• {d.q}</span>{' '}
                        {d.display || d.a ? (
                          <span className="font-bold text-navy">{d.display || d.a}</span>
                        ) : null}
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
            <label className="block text-sm font-semibold text-navy">
              Phone
              <div className="mt-1 font-normal">
                <PhoneInput
                  dialCode={form.countryCode || DEFAULT_COUNTRY_CODE}
                  onDialCodeChange={(code) => setForm((f) => ({ ...f, countryCode: code }))}
                  value={form.phone || ''}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                />
              </div>
            </label>
            <label className="block text-sm font-semibold text-navy">
              Postcode
              <div className="mt-1 font-normal">
                <PostcodeInput
                  value={form.postcode}
                  onChange={(v) => setForm((f) => ({ ...f, postcode: v }))}
                  placeholder="Search or add postcode…"
                />
              </div>
            </label>
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

      <Modal
        open={!!tokenLead}
        title={tokenLead ? `Tokens · ${tokenLead.name}` : 'Adjust tokens'}
        onClose={() => setTokenLead(null)}
        wide
      >
        {tokenLead ? (
          <form className="space-y-3" onSubmit={saveTokens}>
            {tokenError ? <p className="text-sm text-warn">{tokenError}</p> : null}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-blue"
                checked={useIndividual}
                onChange={(e) => {
                  const on = e.target.checked
                  setUseIndividual(on)
                  if (on) {
                    setTiers(
                      normalizeUnlockTiersForUi(
                        tokenLead.customUnlockTiers || unlockTiers || tokenLead.unlockTiers,
                      ),
                    )
                  }
                }}
              />
              <span>
                <span className="block text-sm font-semibold text-navy">
                  Use individual token system for this lead
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Off = common Default Token Adjust for all leads. On = custom from/to options for
                  this lead only.
                </span>
              </span>
            </label>

            {!useIndividual ? (
              <p className="rounded-lg border border-blue/20 bg-blue/5 px-3 py-2 text-sm text-slate-600">
                This lead uses the <strong>common</strong> token system from{' '}
                <strong>Default Token Adjust</strong>.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Current next unlock: {tokenLead.tokenCost ?? 1} token
                  {(tokenLead.tokenCost ?? 1) === 1 ? '' : 's'} · {tokenLead.unlockedCount ?? 0}{' '}
                  person view{(tokenLead.unlockedCount ?? 0) === 1 ? '' : 's'}
                </p>
                <UnlockTokenTiersForm tiers={tiers} onChange={setTiers} />
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setTokenLead(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={tokenSaving}>
                {tokenSaving
                  ? 'Saving…'
                  : useIndividual
                    ? 'Save individual tokens'
                    : 'Use common defaults'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

function flattenSearchText(value, depth = 0, out = []) {
  if (value == null || depth > 3) return out
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    out.push(String(value))
    return out
  }
  if (Array.isArray(value)) {
    value.slice(0, 20).forEach((v) => flattenSearchText(v, depth + 1, out))
    return out
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((v) => flattenSearchText(v, depth + 1, out))
  }
  return out
}

export function DataTable({ title, columns, rows, searchKeys = [], filters = null }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) => {
      // Explicit keys first…
      if (searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(term))) {
        return true
      }
      // …then every visible value on the row, so search always works
      // even when a page passes no (or partial) searchKeys.
      return flattenSearchText(row).join(' ').toLowerCase().includes(term)
    })
  }, [rows, q, searchKeys])

  const total = filtered.length

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy">{title}</h1>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-600">
            {total} {total === 1 ? 'entry' : 'entries'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {filters}
            <label className="text-sm text-slate-600">
              Search:{' '}
              <input
                className="ml-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
              />
            </label>
            {q ? (
              <button
                type="button"
                className="text-xs font-semibold text-blue hover:underline"
                onClick={() => setQ('')}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-x-hidden overflow-y-auto">
          <table className="w-full text-left text-[13px] [&_td]:[overflow-wrap:anywhere]">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-2.5 py-2.5 font-semibold whitespace-nowrap ${
                      c.key === 'action' || c.key === 'actions' ? 'text-right' : ''
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id || idx} className="border-t border-slate-100 hover:bg-slate-50/80">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-2.5 py-2.5 text-navy ${
                        c.key === 'action' || c.key === 'actions'
                          ? 'whitespace-nowrap'
                          : /date|created|joined/i.test(`${c.key} ${c.label || ''}`)
                            ? 'whitespace-nowrap'
                            : ''
                      }`}
                    >
                      {c.render ? c.render(row, idx) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                    No entries found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

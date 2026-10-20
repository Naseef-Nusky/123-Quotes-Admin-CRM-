import { useState } from 'react'
import { DataTable, LeadAnswerField } from '../components/AdminViews.jsx'
import PhoneInput from '../components/PhoneInput.jsx'
import PostcodeInput from '../components/PostcodeInput.jsx'
import {
  UnlockTokenTiersForm,
  normalizeUnlockTiersForUi,
  serializeUnlockTiers,
} from '../components/UnlockTokenTiersForm.jsx'
import DeleteAllButton from '../components/DeleteAllButton.jsx'
import { ActionIconButton, Button, DeleteAction, DetailGrid, EditAction, ErrorBanner, FilterSelect, Input, Loading, Modal, PageHeader, RowActions, Select, ViewAction } from '../components/ui.jsx'
import { Coins } from 'lucide-react'
import {
  DEFAULT_COUNTRY_CODE,
  dialForCountry,
  formatIntlPhone,
  parseIntlPhone,
} from '../data/countryDialCodes.js'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

const LEAD_STATUSES = ['OPEN', 'MATCHED', 'PARTIALLY_UNLOCKED', 'CLOSED', 'CANCELLED']

export default function Leads() {
  const { leads, loading, error, deleteLead, deleteAllLeads, updateLead, unlockTiers } =
    useAdminLeads()
  const [statusFilter, setStatusFilter] = useState('')
  const [contactFilter, setContactFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')

  const serviceOptions = [...new Set((leads || []).map((l) => l.service).filter(Boolean))].sort()
  const visibleLeads = (leads || []).filter((l) => {
    if (statusFilter && l.status !== statusFilter) return false
    if (serviceFilter && l.service !== serviceFilter) return false
    if (contactFilter === 'email' && !(l.email && l.email !== '—')) return false
    if (contactFilter === 'phone' && !(l.phone && l.phone !== '—')) return false
    if (
      contactFilter === 'none' &&
      ((l.email && l.email !== '—') || (l.phone && l.phone !== '—'))
    )
      return false
    return true
  })
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [tokenLead, setTokenLead] = useState(null)
  const [tiers, setTiers] = useState([])
  const [useIndividual, setUseIndividual] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [tokenError, setTokenError] = useState('')

  function openEdit(row) {
    const parsed = parseIntlPhone(row.phone === '—' ? '' : row.phone || '')
    setEditing(row)
    setForm({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email === '—' ? '' : row.email || '',
      phone: parsed.localNumber,
      countryCode: parsed.countryCode || DEFAULT_COUNTRY_CODE,
      postcode: row.postcodeRaw || '',
      status: row.status || 'OPEN',
      details: (row.details || []).map((d) => ({
        questionId: d.questionId || null,
        q: d.q || 'Question',
        a: d.a === '—' ? '' : d.a || '',
        display: d.display || '',
        type: d.type || 'TEXTAREA',
        options: d.options || [],
      })),
    })
    setFormError('')
  }

  function openTokens(row) {
    const individual = Boolean(row.hasCustomUnlockTiers)
    setTokenLead(row)
    setUseIndividual(individual)
    setTiers(
      normalizeUnlockTiersForUi(
        individual
          ? row.customUnlockTiers || row.unlockTiers
          : unlockTiers || row.unlockTiers,
      ),
    )
    setTokenError('')
  }

  function updateDetail(index, value) {
    setForm((f) => ({
      ...f,
      details: (f.details || []).map((d, i) => (i === index ? { ...d, a: value } : d)),
    }))
  }

  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const details = form.details || []
      const answers = details
        .filter((d) => d.questionId)
        .map((d) => ({ questionId: d.questionId, value: d.a }))
      const summary = details
        .map((d) => String(d.a || '').trim())
        .filter(Boolean)
        .join(' / ')

      await updateLead(editing.id, {
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
      setFormError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function saveTokens(e) {
    e.preventDefault()
    if (!tokenLead) return
    setTokenSaving(true)
    setTokenError('')
    try {
      if (!useIndividual) {
        await updateLead(tokenLead.id, { unlockTiers: null })
      } else {
        const cleaned = serializeUnlockTiers(tiers)
        await updateLead(tokenLead.id, {
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

  const columns = [
    { key: '#', label: '#', render: (_row, idx) => idx + 1 },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Contact No' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Type' },
    {
      key: 'postcodeInfo',
      label: 'Postcode',
      render: (row) => (
        <span className="font-semibold whitespace-nowrap">{row.postcodeRaw || '—'}</span>
      ),
    },
    {
      key: 'tokenCost',
      label: 'Next tokens',
      render: (row) => (
        <span>
          {row.tokenCost ?? 1}
          <span className="ml-1 text-[10px] font-semibold uppercase text-slate-400">
            {row.hasCustomUnlockTiers ? 'indiv' : 'default'}
          </span>
        </span>
      ),
    },
    {
      key: 'unlocks',
      label: 'Unlocks',
      render: (row) =>
        row.maxUnlocks > 0
          ? `${row.unlockedCount ?? 0}/${row.maxUnlocks}`
          : String(row.unlockedCount ?? 0),
    },
    {
      key: 'matched',
      label: 'Matched',
      render: (row) => row.matchedCount ?? 0,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <RowActions>
          <ViewAction onClick={() => setViewing(row)} />
          <EditAction onClick={() => openEdit(row)} />
          <ActionIconButton label="Tokens" variant="secondary" onClick={() => openTokens(row)}>
            <Coins className="size-4" />
          </ActionIconButton>
          <DeleteAction
            onClick={async () => {
              if (!window.confirm(`Delete lead for “${row.name}”?`)) return
              try {
                await deleteLead(row.id)
              } catch (err) {
                window.alert(err.message || 'Delete failed')
              }
            }}
          />
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="All Leads"
        subtitle={`${leads.filter((l) => l.email && l.email !== '—').length} leads have email/phone from the dump. Others had user_id=0 (no contact in SQL). Sorted with contacts first.`}
        actions={
          <DeleteAllButton
            label="Delete all leads"
            confirmText={`Permanently delete ALL ${leads.length} leads from the database?\n\nType DELETE to confirm.`}
            onConfirm={async () => {
              const data = await deleteAllLeads()
              window.alert(`Deleted ${data.count ?? 0} lead request(s).`)
            }}
          />
        }
      />
      <ErrorBanner message={error} />
      {loading ? <Loading className="mb-3 py-6" /> : null}
      <DataTable
        title="Leads"
        columns={columns}
        rows={visibleLeads}
        searchKeys={['name', 'email', 'phone', 'service', 'postcodeRaw', 'status', 'date']}
        filters={
          <>
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Service"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="">All services</option>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Contact"
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
            >
              <option value="">All contacts</option>
              <option value="email">With email</option>
              <option value="phone">With phone</option>
              <option value="none">No contact</option>
            </FilterSelect>
            {statusFilter || serviceFilter || contactFilter ? (
              <button
                type="button"
                className="text-xs font-semibold text-blue hover:underline"
                onClick={() => {
                  setStatusFilter('')
                  setServiceFilter('')
                  setContactFilter('')
                }}
              >
                Clear filters
              </button>
            ) : null}
          </>
        }
      />

      <Modal
        open={!!viewing}
        title={viewing ? `Lead · ${viewing.name}` : 'Lead'}
        onClose={() => setViewing(null)}
        wide
      >
        {viewing ? (
          <div className="space-y-5">
            <DetailGrid
              items={[
                { label: 'Name', value: viewing.name },
                { label: 'Service', value: viewing.service },
                { label: 'Email', value: viewing.email },
                { label: 'Contact No', value: viewing.phone },
                { label: 'Status', value: viewing.status },
                { label: 'Date', value: viewing.date },
                { label: 'Next tokens', value: viewing.tokenCost ?? 1 },
                {
                  label: 'Unlocks / matched',
                  value: `${viewing.unlockedCount ?? 0} unlocks · ${viewing.matchedCount ?? 0} matched`,
                },
              ]}
            />
            <div>
              <h3 className="mb-2 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-navy">
                Postcode (old DB postal_codes)
              </h3>
              <DetailGrid
                items={[
                  { label: 'Full postcode', value: viewing.postcodeRaw },
                  { label: 'Outcode', value: viewing.postcodeInfo?.outcode },
                  { label: 'District / Town', value: viewing.postcodeInfo?.district || viewing.city },
                  { label: 'Ward / Region', value: viewing.postcodeInfo?.ward },
                  { label: 'Country', value: viewing.postcodeInfo?.country },
                ]}
              />
              {!viewing.postcodeInfo ? (
                <p className="mt-2 text-xs text-slate-500">
                  No postal_codes match for this lead in the old DB (postcode missing or area-only).
                </p>
              ) : null}
            </div>
            <div>
              <h3 className="mb-2 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-navy">
                Details Provided
              </h3>
              <ul className="space-y-2 text-sm">
                {(viewing.details || []).map((d, idx) => (
                  <li key={d.questionId || `${d.q}-${idx}`}>
                    <span className="text-slate-600">• {d.q}</span>{' '}
                    {d.display || d.a ? (
                      <span className="font-bold text-navy">{d.display || d.a}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const row = viewing
                  setViewing(null)
                  openEdit(row)
                }}
              >
                Edit lead
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!editing} title="Edit lead" onClose={() => setEditing(null)} wide>
        {editing ? (
          <form className="space-y-3" onSubmit={saveEdit}>
            {formError ? <p className="text-sm text-warn">{formError}</p> : null}
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

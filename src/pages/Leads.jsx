import { useState } from 'react'
import { DataTable, LeadAnswerField } from '../components/AdminViews.jsx'
import PhoneInput from '../components/PhoneInput.jsx'
import {
  UnlockTokenTiersForm,
  normalizeUnlockTiersForUi,
  serializeUnlockTiers,
} from '../components/UnlockTokenTiersForm.jsx'
import { Button, ErrorBanner, Input, Modal, Select } from '../components/ui.jsx'
import {
  DEFAULT_COUNTRY_CODE,
  dialForCountry,
  formatIntlPhone,
  parseIntlPhone,
} from '../data/countryDialCodes.js'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

const LEAD_STATUSES = ['OPEN', 'MATCHED', 'PARTIALLY_UNLOCKED', 'CLOSED', 'CANCELLED']

export default function Leads() {
  const { leads, loading, error, deleteLead, updateLead, unlockTiers } = useAdminLeads()
  const [editing, setEditing] = useState(null)
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
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => openTokens(row)}>
            Tokens
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!window.confirm(`Delete lead for “${row.name}”?`)) return
              try {
                await deleteLead(row.id)
              } catch (err) {
                window.alert(err.message || 'Delete failed')
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading leads…</p> : null}
      <DataTable
        title="Leads"
        columns={columns}
        rows={leads}
        searchKeys={['name', 'email', 'phone', 'service']}
      />

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

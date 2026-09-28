import { useState } from 'react'
import { DataTable, LeadAnswerField } from '../components/AdminViews.jsx'
import PhoneInput from '../components/PhoneInput.jsx'
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
  const { leads, loading, error, deleteLead, updateLead } = useAdminLeads()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

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

  const columns = [
    { key: '#', label: '#', render: (_row, idx) => idx + 1 },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Contact No' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Type' },
    { key: 'date', label: 'Date' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openEdit(row)}>
            Edit
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
    </div>
  )
}

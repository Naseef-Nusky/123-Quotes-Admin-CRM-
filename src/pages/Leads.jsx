import { useState } from 'react'
import { DataTable } from '../components/AdminViews.jsx'
import { Button, ErrorBanner, Input, Modal, Select } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

const LEAD_STATUSES = ['OPEN', 'MATCHED', 'PARTIALLY_UNLOCKED', 'CLOSED', 'CANCELLED']

export default function Leads() {
  const { leads, loading, error, deleteLead, updateLead } = useAdminLeads()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function openEdit(row) {
    setEditing(row)
    setForm({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email === '—' ? '' : row.email || '',
      phone: row.phone === '—' ? '' : row.phone || '',
      postcode: row.postcodeRaw || '',
      status: row.status || 'OPEN',
      summary: row.summary || '',
    })
    setFormError('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await updateLead(editing.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        postcode: form.postcode.trim(),
        status: form.status,
        summary: form.summary.trim(),
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

      <Modal open={!!editing} title="Edit lead" onClose={() => setEditing(null)}>
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
            <Input
              label="Summary"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
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

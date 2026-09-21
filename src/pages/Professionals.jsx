import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { mapAdminProfessional } from '../lib/mappers.js'
import { DataTable } from '../components/AdminViews.jsx'
import {
  Button,
  ErrorBanner,
  Input,
  Modal,
  Textarea,
} from '../components/ui.jsx'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  type: '',
  company: '',
  details: '',
}

export default function Professionals() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getUsers({ role: 'PROFESSIONAL' })
      const list = (data.users || [])
        .filter((u) => u.status === 'ACTIVE' || u.status === 'SUSPENDED' || u.status === 'INACTIVE')
        .map(mapAdminProfessional)
      setRows(list)
    } catch (err) {
      setError(err.message || 'Failed to load professionals')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openEdit(pro) {
    setEditing(pro)
    setForm({
      name: pro.name || '',
      phone: pro.phone || '',
      email: pro.email || '',
      type: pro.type || '',
      company: pro.company || '',
      details: pro.details || '',
    })
    setError('')
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.')
      return
    }
    try {
      await api.updateProfessional(editing.id, {
        contactName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: form.company.trim(),
        bio: form.details.trim() || 'No Additional Details',
        type: form.type.trim(),
      })
      setEditing(null)
      setFlash('Professional updated.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Update failed')
    }
  }

  async function remove(pro) {
    if (!window.confirm(`Delete professional “${pro.name}”?`)) return
    try {
      await api.deleteProfessional(pro.id)
      setFlash('Professional deleted.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Contact No' },
      { key: 'email', label: 'Email' },
      { key: 'type', label: 'Type' },
      { key: 'company', label: 'Company' },
      {
        key: 'action',
        label: 'Action',
        render: (pro) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => openEdit(pro)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => remove(pro)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading professionals…</p> : null}
      <DataTable
        title="Professional"
        columns={columns}
        rows={rows}
        searchKeys={['name', 'email', 'phone', 'type', 'company']}
      />

      <Modal open={!!editing} title="Edit professional" onClose={() => setEditing(null)}>
        {editing ? (
          <form className="space-y-3" onSubmit={saveEdit}>
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Contact No"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Type / Category"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
            <Input
              label="Company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            />
            <Textarea
              label="Additional details"
              rows={3}
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

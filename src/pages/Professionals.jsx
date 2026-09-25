import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { mapAdminProfessional } from '../lib/mappers.js'
import { DataTable } from '../components/AdminViews.jsx'
import {
  Button,
  ErrorBanner,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
} from '../components/ui.jsx'

const STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE']

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  type: '',
  company: '',
  details: '',
  postcode: '',
  status: 'ACTIVE',
  password: '',
}

export default function Professionals() {
  const [rows, setRows] = useState([])
  const [rawUsers, setRawUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null) // add | edit | view
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, svc] = await Promise.all([
        api.getUsers({ role: 'PROFESSIONAL' }),
        api.getServices().catch(() => ({ services: [] })),
      ])
      const users = data.users || []
      setRawUsers(users)
      setRows(
        users
          .filter((u) => u.status === 'ACTIVE' || u.status === 'SUSPENDED' || u.status === 'INACTIVE')
          .map(mapAdminProfessional),
      )
      setServices(svc.services || [])
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

  function openAdd() {
    setMode('add')
    setActive(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function openEdit(pro) {
    const raw = rawUsers.find((u) => u.id === pro.id)
    setMode('edit')
    setActive(pro)
    setForm({
      name: pro.name || '',
      phone: pro.phone || '',
      email: pro.email || '',
      type: pro.type === '—' ? '' : pro.type || '',
      company: pro.company || '',
      details: pro.details || '',
      postcode: raw?.professional?.postcode || '',
      status: raw?.status || pro.status || 'ACTIVE',
      password: '',
    })
    setError('')
  }

  function openView(pro) {
    setMode('view')
    setActive(pro)
    setError('')
  }

  function closeModal() {
    setMode(null)
    setActive(null)
  }

  async function saveForm(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      setError('Name, email and company are required.')
      return
    }
    if (mode === 'add' && !form.password.trim()) {
      setError('Password is required for new businesses.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (mode === 'add') {
        await api.createProfessional({
          contactName: form.name.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          phone: form.phone.trim(),
          companyName: form.company.trim(),
          bio: form.details.trim() || null,
          type: form.type.trim(),
          postcode: form.postcode.trim() || null,
          status: form.status,
        })
        setFlash('Business created.')
      } else {
        const body = {
          contactName: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          companyName: form.company.trim(),
          bio: form.details.trim() || 'No Additional Details',
          type: form.type.trim(),
          status: form.status,
        }
        if (form.password.trim()) body.password = form.password.trim()
        await api.updateProfessional(active.id, body)
        setFlash('Business updated.')
      }
      closeModal()
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(pro) {
    if (!window.confirm(`Delete business “${pro.name}”?`)) return
    try {
      await api.deleteProfessional(pro.id)
      setFlash('Business deleted.')
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
        key: 'status',
        label: 'Status',
        render: (pro) => <StatusBadge status={pro.status} />,
      },
      {
        key: 'action',
        label: 'Action',
        render: (pro) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => openView(pro)}>
              View
            </Button>
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
    [rawUsers],
  )

  const rawActive = active ? rawUsers.find((u) => u.id === active.id) : null

  return (
    <div>
      <PageHeader
        title="Professional"
        subtitle="Add, view, edit, or delete business accounts."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 size-4" />
            Add business
          </Button>
        }
      />

      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading professionals…</p> : null}
      <DataTable
        title="Professional"
        columns={columns}
        rows={rows}
        searchKeys={['name', 'email', 'phone', 'type', 'company']}
      />

      <Modal
        open={mode === 'add' || mode === 'edit'}
        title={mode === 'add' ? 'Add business' : 'Edit business'}
        onClose={closeModal}
      >
        {mode === 'add' || mode === 'edit' ? (
          <form className="space-y-3" onSubmit={saveForm}>
            <Input
              label="Contact name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
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
              label="Postcode"
              value={form.postcode}
              onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
            />
            <Select
              label="Service type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">Select service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Textarea
              label="Additional details"
              rows={3}
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
            />
            <Input
              label={mode === 'add' ? 'Password' : 'New password (optional)'}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={mode === 'add'}
              placeholder={mode === 'edit' ? 'Leave blank to keep current' : ''}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : mode === 'add' ? 'Create business' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={mode === 'view'} title="Business details" onClose={closeModal}>
        {active ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-navy">Contact:</span> {active.name}
            </p>
            <p>
              <span className="font-semibold text-navy">Company:</span> {active.company}
            </p>
            <p>
              <span className="font-semibold text-navy">Email:</span> {active.email}
            </p>
            <p>
              <span className="font-semibold text-navy">Phone:</span> {active.phone}
            </p>
            <p>
              <span className="font-semibold text-navy">Type:</span> {active.type}
            </p>
            <p>
              <span className="font-semibold text-navy">Postcode:</span>{' '}
              {rawActive?.professional?.postcode || '—'}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-navy">Status:</span>
              <StatusBadge status={active.status} />
            </p>
            <p>
              <span className="font-semibold text-navy">Details:</span> {active.details || '—'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => openEdit(active)}>
                Edit
              </Button>
              <Button onClick={closeModal}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

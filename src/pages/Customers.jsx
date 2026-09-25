import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { DataTable } from '../components/AdminViews.jsx'
import {
  Button,
  ErrorBanner,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  formatDate,
} from '../components/ui.jsx'

const STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE']

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  postcode: '',
  status: 'ACTIVE',
  password: '',
}

function displayName(u) {
  const c = u?.customer
  if (!c) return '—'
  return `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—'
}

export default function Customers() {
  const [users, setUsers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState(null) // add | edit | view
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { role: 'CUSTOMER' }
      if (statusFilter) params.status = statusFilter
      const data = await api.getUsers(params)
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message || 'Failed to load customers')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return users
    return users.filter((u) => {
      const name = displayName(u).toLowerCase()
      return (
        u.email.toLowerCase().includes(term) ||
        name.includes(term) ||
        String(u.customer?.phone || '')
          .toLowerCase()
          .includes(term) ||
        String(u.customer?.postcode || '')
          .toLowerCase()
          .includes(term)
      )
    })
  }, [users, q])

  function openAdd() {
    setMode('add')
    setActive(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function openEdit(u) {
    setMode('edit')
    setActive(u)
    setForm({
      firstName: u.customer?.firstName || '',
      lastName: u.customer?.lastName || '',
      email: u.email || '',
      phone: u.customer?.phone || '',
      postcode: u.customer?.postcode || '',
      status: u.status || 'ACTIVE',
      password: '',
    })
    setError('')
  }

  function openView(u) {
    setMode('view')
    setActive(u)
    setError('')
  }

  function closeModal() {
    setMode(null)
    setActive(null)
  }

  async function saveForm(e) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.email.trim()) {
      setError('First name and email are required.')
      return
    }
    if (mode === 'add' && !form.password.trim()) {
      setError('Password is required for new customers.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        postcode: form.postcode.trim(),
        status: form.status,
      }
      if (form.password.trim()) body.password = form.password.trim()

      if (mode === 'add') {
        await api.createCustomer(body)
        setFlash('Customer created.')
      } else {
        await api.updateCustomer(active.id, body)
        setFlash('Customer updated.')
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

  async function remove(u) {
    if (!window.confirm(`Delete customer “${displayName(u)}” and all their requests?`)) return
    try {
      await api.deleteCustomer(u.id)
      setFlash('Customer deleted.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name', render: (u) => displayName(u) },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone', render: (u) => u.customer?.phone || '—' },
      { key: 'postcode', label: 'Postcode', render: (u) => u.customer?.postcode || '—' },
      {
        key: 'status',
        label: 'Status',
        render: (u) => <StatusBadge status={u.status} />,
      },
      {
        key: 'created',
        label: 'Joined',
        render: (u) => formatDate(u.createdAt),
      },
      {
        key: 'action',
        label: 'Action',
        render: (u) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => openView(u)}>
              View
            </Button>
            <Button variant="secondary" onClick={() => openEdit(u)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => remove(u)}>
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
      <PageHeader
        title="Customers"
        subtitle="Add, view, edit, or delete customer accounts."
        actions={
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
            />
            <Button onClick={openAdd}>
              <Plus className="mr-1.5 size-4" />
              Add customer
            </Button>
          </div>
        }
      />

      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading customers…</p> : null}

      <DataTable title="Customers" columns={columns} rows={filtered} searchKeys={[]} />

      <Modal
        open={mode === 'add' || mode === 'edit'}
        title={mode === 'add' ? 'Add customer' : 'Edit customer'}
        onClose={closeModal}
      >
        {mode === 'add' || mode === 'edit' ? (
          <form className="space-y-3" onSubmit={saveForm}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
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
              required
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
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
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
                {saving ? 'Saving…' : mode === 'add' ? 'Create customer' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={mode === 'view'} title="Customer details" onClose={closeModal}>
        {active ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-navy">Name:</span> {displayName(active)}
            </p>
            <p>
              <span className="font-semibold text-navy">Email:</span> {active.email}
            </p>
            <p>
              <span className="font-semibold text-navy">Phone:</span> {active.customer?.phone || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Postcode:</span>{' '}
              {active.customer?.postcode || '—'}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-navy">Status:</span>
              <StatusBadge status={active.status} />
            </p>
            <p>
              <span className="font-semibold text-navy">Joined:</span> {formatDate(active.createdAt)}
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

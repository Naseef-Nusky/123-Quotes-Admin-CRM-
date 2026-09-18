import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Button,
  ErrorBanner,
  Input,
  Loading,
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
  password: '',
  status: 'ACTIVE',
  role: 'ADMIN',
}

function displayName(u) {
  if (u?.customer?.firstName) {
    return `${u.customer.firstName} ${u.customer.lastName || ''}`.trim()
  }
  return '—'
}

export default function SystemUsers() {
  const { user: me } = useAuth()
  const isSuper = me?.role === 'SUPER_ADMIN'
  const [users, setUsers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = { roles: 'ADMIN,SUPER_ADMIN' }
      if (statusFilter) params.status = statusFilter
      const data = await api.getUsers(params)
      let list = data.users || []
      if (roleFilter) list = list.filter((u) => u.role === roleFilter)
      setUsers(list)
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter, roleFilter])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return users
    return users.filter((u) => {
      const name = displayName(u).toLowerCase()
      return (
        u.email.toLowerCase().includes(term) ||
        name.includes(term) ||
        String(u.role || '')
          .toLowerCase()
          .includes(term)
      )
    })
  }, [users, q])

  function canManage(u) {
    if (!u) return true
    if (u.role === 'SUPER_ADMIN') return false
    return true
  }

  function canDelete(u) {
    if (!u) return false
    if (u.role === 'SUPER_ADMIN') return false
    if (me?.id === u.id) return false
    return true
  }

  function canChangeStatus(u) {
    if (!u || u.role === 'SUPER_ADMIN') return false
    return true
  }

  function openCreate() {
    if (!isSuper) {
      setError('Only a super admin can add system users.')
      return
    }
    setEditing(null)
    setForm({ ...emptyForm })
    setError('')
    setModalOpen(true)
  }

  function openEdit(u) {
    if (u.role === 'SUPER_ADMIN') {
      setError('Super admin details cannot be edited.')
      return
    }
    setEditing(u)
    setForm({
      firstName: u.customer?.firstName || '',
      lastName: u.customer?.lastName || '',
      email: u.email || '',
      password: '',
      status: u.status || 'ACTIVE',
      role: u.role || 'ADMIN',
    })
    setError('')
    setModalOpen(true)
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!editing && !isSuper) {
        throw new Error('Only a super admin can add system users')
      }
      const role = isSuper ? form.role : 'ADMIN'
      if (editing) {
        if (editing.role === 'SUPER_ADMIN') {
          throw new Error('Super admin details cannot be edited')
        }
        const body = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          role,
          status: form.status,
        }
        if (form.password.trim()) body.password = form.password
        await api.updateSystemUser(editing.id, body)
        setFlash('System user updated.')
      } else {
        if (!form.password.trim()) throw new Error('Password is required for new users')
        await api.createSystemUser({
          email: form.email,
          password: form.password,
          firstName: form.firstName || 'Admin',
          lastName: form.lastName || 'User',
          status: form.status,
          role,
        })
        setFlash(role === 'SUPER_ADMIN' ? 'Super admin created.' : 'System user created.')
      }
      setModalOpen(false)
      await load()
      setTimeout(() => setFlash(''), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u) {
    if (u.role === 'SUPER_ADMIN') {
      setError('Super admin accounts cannot be removed.')
      return
    }
    if (me?.id === u.id) {
      setError('You cannot delete your own account.')
      return
    }
    if (!canManage(u)) {
      setError('Super admin accounts cannot be managed this way.')
      return
    }
    if (!window.confirm(`Delete system user ${u.email}? This cannot be undone.`)) return
    setError('')
    try {
      await api.deleteSystemUser(u.id)
      setFlash('System user deleted.')
      await load()
      setTimeout(() => setFlash(''), 2500)
    } catch (err) {
      setError(err.message)
    }
  }

  async function changeStatus(u, next) {
    if (u.role === 'SUPER_ADMIN') {
      setError('Super admin status cannot be changed.')
      return
    }
    if (!canChangeStatus(u)) {
      setError('Super admin status cannot be changed.')
      return
    }
    setError('')
    try {
      await api.updateUserStatus(u.id, next)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="System Users"
        subtitle="Manage admins and super admins for the control panel."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={load}>
              Refresh
            </Button>
            {isSuper ? <Button onClick={openCreate}>Add system user</Button> : null}
          </div>
        }
      />

      {flash ? <p className="mb-4 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="block text-sm font-semibold text-navy">
          Search
          <input
            className="mt-1 w-full min-w-[220px] rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
            placeholder="Name, email, role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-navy">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-navy">{displayName(u)}</td>
                    <td className="px-4 py-3 text-navy">{u.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'SUPER_ADMIN' ? (
                        <StatusBadge status={u.status} />
                      ) : (
                        <select
                          className="rounded-md border border-slate-200 px-2 py-1.5 text-xs disabled:opacity-50"
                          value={u.status}
                          disabled={!canChangeStatus(u)}
                          onChange={(e) => changeStatus(u, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(u)}
                          disabled={u.role === 'SUPER_ADMIN'}
                          title={
                            u.role === 'SUPER_ADMIN'
                              ? 'Super admin details cannot be edited'
                              : undefined
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(u)}
                          disabled={!canDelete(u)}
                          title={
                            u.role === 'SUPER_ADMIN'
                              ? 'Super admin accounts cannot be removed'
                              : undefined
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No system users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit system user' : 'Add system user'}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-3" onSubmit={handleSave}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              required
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
          />
          <Input
            label={editing ? 'New password (optional)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            required={!editing}
            minLength={editing ? undefined : 6}
            placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'}
          />
          {isSuper ? (
            <Select label="Role" value={form.role} onChange={(e) => setField('role', e.target.value)}>
              <option value="ADMIN">Admin</option>
              {!editing ? <option value="SUPER_ADMIN">Super Admin</option> : null}
            </Select>
          ) : null}
          <Select label="Status" value={form.status} onChange={(e) => setField('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

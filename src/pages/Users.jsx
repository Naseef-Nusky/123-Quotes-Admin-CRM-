import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Loading,
  PageHeader,
  Select,
  StatusBadge,
  Table,
  formatDate,
} from '../components/ui.jsx'

const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']

export default function Users() {
  const [users, setUsers] = useState([])
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (role) params.role = role
      if (status) params.status = status
      const data = await api.getUsers(params)
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [role, status])

  async function changeStatus(id, next) {
    setBusyId(id)
    setError('')
    try {
      await api.updateUserStatus(id, next)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'email',
      label: 'User',
      render: (u) => (
        <div>
          <p className="font-medium">{u.email}</p>
          <p className="text-xs text-slate-500">
            {u.customer
              ? `${u.customer.firstName} ${u.customer.lastName}`
              : u.professional?.companyName || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (u) => formatDate(u.createdAt),
    },
    {
      key: 'actions',
      label: 'Update status',
      render: (u) => (
        <select
          className="rounded-md border border-slate-200 px-2 py-1.5 text-xs"
          value={u.status}
          disabled={busyId === u.id}
          onChange={(e) => changeStatus(u.id, e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Customers, professionals, and admins."
        actions={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <ErrorBanner message={error} />
      {loading ? <Loading /> : <Table columns={columns} rows={users} empty="No users found." />}
    </div>
  )
}

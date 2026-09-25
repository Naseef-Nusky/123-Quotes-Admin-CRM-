import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { mapPendingRegistration } from '../lib/mappers.js'
import {
  Button,
  Card,
  ErrorBanner,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui.jsx'

const emptyForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  type: '',
  postcode: '',
  details: '',
  password: '',
  status: 'PENDING',
}

export default function BusinessRegistration() {
  const [regs, setRegs] = useState([])
  const [rawUsers, setRawUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [mode, setMode] = useState(null) // add | edit | view
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, svc] = await Promise.all([
        api.getUsers({ role: 'PROFESSIONAL', status: 'PENDING' }),
        api.getServices().catch(() => ({ services: [] })),
      ])
      const users = data.users || []
      setRawUsers(users)
      setRegs(users.map(mapPendingRegistration))
      setServices(svc.services || [])
    } catch (err) {
      setError(err.message || 'Failed to load registrations')
      setRegs([])
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

  function openView(row) {
    setMode('view')
    setActive(rawUsers.find((u) => u.id === row.id) || row)
    setError('')
  }

  function openEdit(row) {
    const raw = rawUsers.find((u) => u.id === row.id)
    setMode('edit')
    setActive(raw || row)
    setForm({
      name: raw?.professional?.contactName || row.name || '',
      company: raw?.professional?.companyName || row.name || '',
      email: raw?.email || row.email || '',
      phone: raw?.professional?.phone || row.contact || '',
      type: raw?.professional?.services?.[0]?.service?.name || '',
      postcode: raw?.professional?.postcode || '',
      details: raw?.professional?.bio || '',
      password: '',
      status: raw?.status || 'PENDING',
    })
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
      setError('Password is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (mode === 'add') {
        await api.createProfessional({
          contactName: form.name.trim(),
          companyName: form.company.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          phone: form.phone.trim(),
          type: form.type.trim(),
          postcode: form.postcode.trim() || null,
          bio: form.details.trim() || null,
          status: form.status || 'PENDING',
        })
        setFlash('Business added.')
      } else {
        const body = {
          contactName: form.name.trim(),
          companyName: form.company.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          type: form.type.trim(),
          bio: form.details.trim() || null,
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

  async function approve(id) {
    try {
      await api.updateUserStatus(id, 'ACTIVE')
      setFlash('Business approved.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Approve failed')
    }
  }

  async function decline(id) {
    try {
      await api.updateUserStatus(id, 'INACTIVE')
      setFlash('Business declined.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Decline failed')
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete business “${row.name}”?`)) return
    try {
      await api.deleteProfessional(row.id)
      setFlash('Business deleted.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const viewPro = active?.professional || null

  return (
    <div>
      <PageHeader
        title="Business Registration"
        subtitle="Add businesses, or view / edit / delete pending signups."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 size-4" />
            Add business
          </Button>
        }
      />
      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading…</p> : null}
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3">{r.contact}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => openView(r)}>
                      View
                    </Button>
                    <Button variant="secondary" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button variant="primary" onClick={() => approve(r.id)}>
                      Approve
                    </Button>
                    <Button variant="danger" onClick={() => decline(r.id)}>
                      Decline
                    </Button>
                    <Button variant="danger" onClick={() => remove(r)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!regs.length && !loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No pending registrations.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

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
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
            <Textarea
              label="Details"
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
              <span className="font-semibold text-navy">Company:</span>{' '}
              {viewPro?.companyName || active.name || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Contact:</span>{' '}
              {viewPro?.contactName || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Email:</span> {active.email || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Phone:</span> {viewPro?.phone || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Postcode:</span> {viewPro?.postcode || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Service:</span>{' '}
              {viewPro?.services?.[0]?.service?.name || '—'}
            </p>
            <p>
              <span className="font-semibold text-navy">Details:</span> {viewPro?.bio || '—'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => openEdit({ id: active.id, name: viewPro?.companyName, email: active.email, contact: viewPro?.phone })}
              >
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import { api } from '../api/client.js'
import { mapAdminProfessional } from '../lib/mappers.js'
import {
  Button,
  Card,
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

export default function RecentPros() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
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
        .filter((u) => u.status !== 'PENDING')
        .map(mapAdminProfessional)
      setRows(list)
      setSelectedId((prev) => prev || list[0]?.id || null)
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

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term) ||
        p.company.toLowerCase().includes(term),
    )
  }, [q, rows])

  useEffect(() => {
    if (!list.length) {
      setSelectedId(null)
      return
    }
    if (!list.some((p) => p.id === selectedId)) {
      setSelectedId(list[0].id)
    }
  }, [list, selectedId])

  const selected = list.find((p) => p.id === selectedId) || null

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

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy">Recent Pro.</h1>
      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading…</p> : null}
      <Card className="overflow-hidden p-0">
        <div className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col lg:flex-row">
          <aside className="flex max-h-[40vh] w-full flex-col border-b border-slate-200 lg:max-h-none lg:h-full lg:w-[360px] lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-slate-200 bg-white p-3">
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                placeholder="Search Pro."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {list.map((pro) => (
                <button
                  key={pro.id}
                  type="button"
                  onClick={() => setSelectedId(pro.id)}
                  className={`w-full border-b border-slate-100 px-4 py-4 text-left hover:bg-slate-50 ${
                    selected?.id === pro.id ? 'bg-blue/5' : ''
                  }`}
                >
                  <p className="font-bold text-navy">{pro.type}</p>
                  <p className="mt-1 text-sm text-navy">{pro.name}</p>
                  <p className="text-xs text-slate-500">{pro.phone}</p>
                  <p className="text-xs text-slate-500">{pro.email}</p>
                </button>
              ))}
              {!list.length ? (
                <p className="p-4 text-sm text-slate-500">No professionals found.</p>
              ) : null}
            </div>
          </aside>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex size-16 items-center justify-center rounded-full bg-blue text-white">
                      <Building2 className="size-8" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-navy">{selected.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">{selected.email}</p>
                      <p className="text-sm text-slate-600">{selected.phone}</p>
                      <p className="mt-2 text-sm font-semibold text-blue">{selected.company}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {selected.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(selected)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(selected)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Additional details
                  </p>
                  <p className="mt-2 text-sm text-navy">{selected.details}</p>
                </div>
              </>
            ) : (
              <p className="text-slate-500">Select a professional.</p>
            )}
          </div>
        </div>
      </Card>

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

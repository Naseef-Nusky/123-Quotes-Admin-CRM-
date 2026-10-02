import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import {
  Button,
  ErrorBanner,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui.jsx'

const emptyForm = {
  name: '',
  description: '',
  icon: '',
  sortOrder: '0',
  isActive: 'true',
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [mode, setMode] = useState(null) // add | edit
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.manageCategories()
      setCategories(data.categories || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return categories
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.slug?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term),
    )
  }, [categories, q])

  function openAdd() {
    setMode('add')
    setActive(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function openEdit(cat) {
    setMode('edit')
    setActive(cat)
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      icon: cat.icon || '',
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive === false ? 'false' : 'true',
    })
    setError('')
  }

  function closeModal() {
    setMode(null)
    setActive(null)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Category name is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive !== 'false',
      }

      if (mode === 'add') {
        await api.createCategory(body)
        setFlash('Category created.')
      } else {
        await api.updateCategory(active.id, body)
        setFlash('Category updated.')
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

  async function remove(cat) {
    if (
      !window.confirm(
        `Delete category “${cat.name}”? Its services will be hidden from the public site.`,
      )
    ) {
      return
    }
    try {
      await api.deleteCategory(cat.id)
      setFlash('Category deleted.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage parent categories that group services on the public site."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 size-4" />
            Add category
          </Button>
        }
      />

      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error && !mode ? error : ''} />

      <div className="mb-4">
        <input
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          placeholder="Search categories…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? <Loading className="mb-3 py-6" /> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{c.name}</p>
                  {c.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{c.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.slug}</td>
                <td className="px-4 py-3">{c.sortOrder ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      c.isActive === false
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {c.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(c)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No categories yet. Add one to group your services.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={mode === 'add' || mode === 'edit'}
        title={mode === 'add' ? 'Add category' : 'Edit category'}
        onClose={closeModal}
      >
        {mode ? (
          <form className="space-y-3" onSubmit={save}>
            {error ? <p className="text-sm text-warn">{error}</p> : null}
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="e.g. Home Services"
            />
            <Textarea
              label="Description (optional)"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Input
              label="Icon (optional)"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="Icon name or URL"
            />
            <Input
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
            <Select
              label="Status"
              value={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : mode === 'add' ? 'Create category' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

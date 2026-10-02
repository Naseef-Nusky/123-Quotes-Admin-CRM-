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
  tokens: '100',
  pricePounds: '25.00',
  currency: 'GBP',
  sortOrder: '0',
  isActive: 'true',
}

function formatMoney(cents, currency = 'GBP') {
  const amount = Number(cents || 0) / 100
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(amount)
  } catch {
    return `£${amount.toFixed(2)}`
  }
}

export default function TokenPackages() {
  const [packages, setPackages] = useState([])
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
      const data = await api.getPackages()
      setPackages(data.packages || [])
    } catch (err) {
      setError(err.message || 'Failed to load packages')
      setPackages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return packages
    return packages.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        String(p.tokens).includes(term),
    )
  }, [packages, q])

  function openAdd() {
    setMode('add')
    setActive(null)
    setForm({
      ...emptyForm,
      sortOrder: String((packages[packages.length - 1]?.sortOrder ?? 0) + 1),
    })
    setError('')
  }

  function openEdit(pkg) {
    setMode('edit')
    setActive(pkg)
    setForm({
      name: pkg.name || '',
      description: pkg.description || '',
      tokens: String(pkg.tokens ?? ''),
      pricePounds: ((Number(pkg.priceCents) || 0) / 100).toFixed(2),
      currency: pkg.currency || 'GBP',
      sortOrder: String(pkg.sortOrder ?? 0),
      isActive: pkg.isActive === false ? 'false' : 'true',
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
      setError('Package name is required.')
      return
    }
    const tokens = Number(form.tokens)
    const pricePounds = Number(form.pricePounds)
    if (!Number.isFinite(tokens) || tokens <= 0) {
      setError('Points must be a positive number.')
      return
    }
    if (!Number.isFinite(pricePounds) || pricePounds < 0) {
      setError('Price must be a valid amount.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        tokens: Math.round(tokens),
        priceCents: Math.round(pricePounds * 100),
        currency: (form.currency || 'GBP').trim().toUpperCase(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive !== 'false',
      }

      if (mode === 'add') {
        await api.createPackage(body)
        setFlash('Package created.')
      } else {
        await api.updatePackage(active.id, body)
        setFlash('Package updated.')
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

  async function toggleActive(pkg) {
    try {
      await api.updatePackage(pkg.id, {
        name: pkg.name,
        description: pkg.description,
        tokens: pkg.tokens,
        priceCents: pkg.priceCents,
        currency: pkg.currency || 'GBP',
        sortOrder: pkg.sortOrder ?? 0,
        isActive: !pkg.isActive,
      })
      setFlash(pkg.isActive ? 'Package deactivated.' : 'Package activated.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Update failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Token packages"
        subtitle="Edit point packs shown when professionals recharge to reach out to leads."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 size-4" />
            Add package
          </Button>
        }
      />

      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error && !mode ? error : ''} />

      <div className="mb-4">
        <input
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          placeholder="Search packages…"
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
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pkg) => (
              <tr key={pkg.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{pkg.name}</p>
                  {pkg.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{pkg.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-semibold text-navy">{pkg.tokens}</td>
                <td className="px-4 py-3 text-slate-700">
                  {formatMoney(pkg.priceCents, pkg.currency)}
                </td>
                <td className="px-4 py-3">{pkg.sortOrder ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      pkg.isActive === false
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {pkg.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(pkg)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => toggleActive(pkg)}>
                      {pkg.isActive === false ? 'Activate' : 'Deactivate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No token packages yet. Add packs for professionals to purchase.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(mode)}
        onClose={closeModal}
        title={mode === 'add' ? 'Add package' : 'Edit package'}
      >
        <form className="space-y-4" onSubmit={save}>
          <ErrorBanner message={mode ? error : ''} />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. 100 Points"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Shown on pricing / buy tokens pages"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Points"
              type="number"
              min="1"
              step="1"
              value={form.tokens}
              onChange={(e) => setForm((f) => ({ ...f, tokens: e.target.value }))}
              required
            />
            <Input
              label="Price (£)"
              type="number"
              min="0"
              step="0.01"
              value={form.pricePounds}
              onChange={(e) => setForm((f) => ({ ...f, pricePounds: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
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
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : mode === 'add' ? 'Create package' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

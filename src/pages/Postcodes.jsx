import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { clearPostcodeCache } from '../components/PostcodeInput.jsx'
import {
  Button,
  ErrorBanner,
  Input,
  Loading,
  Modal,
  PageHeader,
} from '../components/ui.jsx'

const emptyForm = {
  outcode: '',
  town: '',
  region: '',
  ukRegion: '',
  country: '',
  latitude: '',
  longitude: '',
}

const PAGE_SIZE = 100

export default function Postcodes() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [mode, setMode] = useState(null) // add | edit
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: PAGE_SIZE, skip }
      if (search) params.q = search
      const data = await api.managePostcodes(params)
      setRows(data.results || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load postcodes')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [search, skip])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => {
      setSkip(0)
      setSearch(q.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  function openAdd() {
    setMode('add')
    setActive(null)
    setForm({ ...emptyForm })
    setError('')
  }

  function openEdit(row) {
    setMode('edit')
    setActive(row)
    setForm({
      outcode: row.outcode || '',
      town: row.town || '',
      region: row.region || '',
      ukRegion: row.ukRegion || '',
      country: row.country || '',
      latitude: row.latitude != null ? String(row.latitude) : '',
      longitude: row.longitude != null ? String(row.longitude) : '',
    })
    setError('')
  }

  function closeModal() {
    setMode(null)
    setActive(null)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.outcode.trim()) {
      setError('Outcode is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const body = {
        outcode: form.outcode.trim(),
        town: form.town.trim() || null,
        region: form.region.trim() || null,
        ukRegion: form.ukRegion.trim() || null,
        country: form.country.trim() || null,
        latitude: form.latitude.trim() === '' ? null : form.latitude.trim(),
        longitude: form.longitude.trim() === '' ? null : form.longitude.trim(),
      }

      if (mode === 'add') {
        await api.createPostcode(body)
        setFlash('Postcode created.')
      } else {
        await api.updatePostcode(active.id, body)
        setFlash('Postcode updated.')
      }
      clearPostcodeCache()
      closeModal()
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete outcode “${row.outcode}”? This removes it from autocomplete.`)) {
      return
    }
    try {
      await api.deletePostcode(row.id)
      clearPostcodeCache()
      setFlash('Postcode deleted.')
      setTimeout(() => setFlash(''), 2200)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const pageStart = total === 0 ? 0 : skip + 1
  const pageEnd = Math.min(skip + PAGE_SIZE, total)
  const canPrev = skip > 0
  const canNext = skip + PAGE_SIZE < total

  return (
    <div>
      <PageHeader
        title="Postcodes"
        subtitle="Manage UK outcodes used for autocomplete and area matching."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 size-4" />
            Add postcode
          </Button>
        }
      />

      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error && !mode ? error : ''} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          placeholder="Search outcode, town, or region…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          {total ? `${pageStart}–${pageEnd} of ${total}` : '0 results'}
        </p>
      </div>

      {loading ? <Loading className="mb-3 py-6" /> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Outcode</th>
              <th className="px-4 py-3">Town</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-navy">{row.outcode}</td>
                <td className="px-4 py-3 text-slate-700">{row.town || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {[row.region, row.ukRegion].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">{row.country || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(row)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No postcodes found. Add an outcode or import the UK list.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE ? (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={!canPrev || loading}
            onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={!canNext || loading}
            onClick={() => setSkip((s) => s + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <Modal
        open={mode === 'add' || mode === 'edit'}
        title={mode === 'add' ? 'Add postcode' : 'Edit postcode'}
        onClose={closeModal}
      >
        {mode ? (
          <form className="space-y-3" onSubmit={save}>
            {error ? <p className="text-sm text-warn">{error}</p> : null}
            <Input
              label="Outcode"
              value={form.outcode}
              onChange={(e) => setForm((f) => ({ ...f, outcode: e.target.value.toUpperCase() }))}
              required
              placeholder="e.g. SW1A, BN2"
            />
            <Input
              label="Town (optional)"
              value={form.town}
              onChange={(e) => setForm((f) => ({ ...f, town: e.target.value }))}
              placeholder="e.g. Brighton"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Region (optional)"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
              <Input
                label="UK region (optional)"
                value={form.ukRegion}
                onChange={(e) => setForm((f) => ({ ...f, ukRegion: e.target.value }))}
              />
            </div>
            <Input
              label="Country (optional)"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="e.g. England"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Latitude (optional)"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              />
              <Input
                label="Longitude (optional)"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : mode === 'add' ? 'Create postcode' : 'Save changes'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

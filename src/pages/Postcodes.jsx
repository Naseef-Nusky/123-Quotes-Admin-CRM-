import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import DeleteAllButton from '../components/DeleteAllButton.jsx'
import { clearPostcodeCache } from '../lib/postcodeCache.js'
import {
  Button,
  DeleteAction,
  DetailGrid,
  EditAction,
  ErrorBanner,
  Input,
  Loading,
  Modal,
  PageHeader,
  RowActions,
  ViewAction,
} from '../components/ui.jsx'

const emptyForm = {
  outcode: '',
  town: '',
  region: '',
  country: '',
}

export default function Postcodes() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [mode, setMode] = useState(null) // add | edit
  const [viewing, setViewing] = useState(null)
  const [active, setActive] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { limit: 'all' }
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
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => {
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
      country: row.country || '',
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
        country: form.country.trim() || null,
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

  return (
    <div>
      <PageHeader
        title="Postcodes"
        subtitle="Manage UK outcodes used for autocomplete and area matching."
        actions={
          <div className="flex flex-nowrap gap-2">
            <Button onClick={openAdd}>
              <Plus className="mr-1.5 size-4" />
              Add postcode
            </Button>
            <DeleteAllButton
              label="Delete all postcodes"
              confirmText="Permanently delete ALL postcodes from the database?\n\nType DELETE to confirm."
              onConfirm={async () => {
                const data = await api.deleteAllPostcodes()
                clearPostcodeCache()
                setFlash(`Deleted ${data.count ?? 0} postcode(s).`)
                await load()
              }}
            />
          </div>
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
        <p className="text-xs text-slate-500">{total ? `${total} results` : '0 results'}</p>
      </div>

      {loading ? <Loading className="mb-3 py-6" /> : null}

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Outcode</th>
              <th className="px-4 py-3">Town</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Country</th>
              <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.25)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-navy">{row.outcode}</td>
                <td className="px-4 py-3 text-slate-700">{row.town || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{row.region || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{row.country || '—'}</td>
                <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.25)]">
                  <RowActions>
                    <ViewAction onClick={() => setViewing(row)} />
                    <EditAction onClick={() => openEdit(row)} />
                    <DeleteAction onClick={() => remove(row)} />
                  </RowActions>
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

      <Modal
        open={!!viewing}
        title={viewing ? `Postcode · ${viewing.outcode}` : 'Postcode'}
        onClose={() => setViewing(null)}
      >
        {viewing ? (
          <div className="space-y-4">
            <DetailGrid
              items={[
                { label: 'Outcode', value: viewing.outcode },
                { label: 'District / Town', value: viewing.town },
                { label: 'Ward / Region', value: viewing.region },
                { label: 'Country', value: viewing.country },
              ]}
            />
            <p className="text-xs text-slate-500">
              From old DB <code>postal_codes</code>: district → Town, ward → Region, Country →
              Country.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setViewing(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  const row = viewing
                  setViewing(null)
                  openEdit(row)
                }}
              >
                Edit postcode
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

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
            <Input
              label="Region (optional)"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            />
            <Input
              label="Country (optional)"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="e.g. England"
            />
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

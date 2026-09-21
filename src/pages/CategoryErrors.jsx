import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Button, Card, ErrorBanner, PageHeader } from '../components/ui.jsx'

const SETTING_KEY = 'category_errors'

export default function CategoryErrors() {
  const [errors, setErrors] = useState([])
  const [changeMap, setChangeMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const persist = useCallback(async (next) => {
    await api.upsertSetting({ key: SETTING_KEY, value: next })
    setErrors(next)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getSettings()
      const row = (data.settings || []).find((s) => s.key === SETTING_KEY)
      const value = Array.isArray(row?.value) ? row.value : []
      setErrors(value)
    } catch (err) {
      setError(err.message || 'Failed to load category errors')
      setErrors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function changeCategory(id) {
    const nextCat = changeMap[id]
    if (!nextCat?.trim()) return
    try {
      const next = errors.map((r) => (r.id === id ? { ...r, category: nextCat.trim() } : r))
      await persist(next)
      setChangeMap((m) => ({ ...m, [id]: '' }))
    } catch (err) {
      setError(err.message || 'Update failed')
    }
  }

  async function deleteError(id) {
    try {
      await persist(errors.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Category Errors"
        subtitle="Fix incorrect categories submitted with leads."
      />
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading…</p> : null}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rec. Date</th>
                <th className="px-4 py-3">Change to</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-navy">{row.category}</td>
                  <td className="px-4 py-3">{row.user}</td>
                  <td className="px-4 py-3">{row.contact}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.recDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue"
                        placeholder="Category"
                        value={changeMap[row.id] || ''}
                        onChange={(e) => setChangeMap((m) => ({ ...m, [row.id]: e.target.value }))}
                      />
                      <Button
                        className="!bg-ok hover:!bg-emerald-700"
                        onClick={() => changeCategory(row.id)}
                      >
                        Change
                      </Button>
                      <Button variant="danger" onClick={() => deleteError(row.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!errors.length && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No category errors.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

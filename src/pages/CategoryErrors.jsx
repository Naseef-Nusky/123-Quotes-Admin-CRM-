import { useState } from 'react'
import { DUMMY_CATEGORY_ERRORS } from '../data/dummy.js'
import { Button, Card, PageHeader } from '../components/ui.jsx'

export default function CategoryErrors() {
  const [errors, setErrors] = useState(DUMMY_CATEGORY_ERRORS)
  const [changeMap, setChangeMap] = useState({})

  function changeCategory(id) {
    const next = changeMap[id]
    if (!next?.trim()) return
    setErrors((rows) => rows.map((r) => (r.id === id ? { ...r, category: next.trim() } : r)))
    setChangeMap((m) => ({ ...m, [id]: '' }))
  }

  function deleteError(id) {
    setErrors((rows) => rows.filter((r) => r.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Category Errors"
        subtitle="Fix incorrect categories submitted with leads."
      />
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
              {!errors.length ? (
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

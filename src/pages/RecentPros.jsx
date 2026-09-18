import { useMemo, useState } from 'react'
import { DUMMY_ADMIN_PROS } from '../data/dummy.js'
import { Button, Card } from '../components/ui.jsx'

export default function RecentPros() {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return DUMMY_ADMIN_PROS
    return DUMMY_ADMIN_PROS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term) ||
        p.company.toLowerCase().includes(term),
    )
  }, [q])
  const [selectedId, setSelectedId] = useState(list[0]?.id)
  const selected = list.find((p) => p.id === selectedId) || list[0]

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy">Recent Pro.</h1>
      <Card className="overflow-hidden p-0">
        <div className="flex min-h-[70vh] flex-col lg:flex-row">
          <aside className="max-h-[70vh] w-full overflow-y-auto border-b border-slate-200 lg:max-h-none lg:w-[360px] lg:border-b-0 lg:border-r">
            <div className="sticky top-0 border-b border-slate-200 bg-white p-3">
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                placeholder="Search Pro."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
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
          </aside>

          <div className="flex-1 p-6">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex size-16 items-center justify-center rounded-full bg-blue text-white">
                      <svg viewBox="0 0 24 24" className="size-8" fill="currentColor">
                        <path d="M4 20V9l4-2v13H4zm6 0V6l4-2v16h-4zm6 0V8l4 2v10h-4z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-navy">{selected.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">{selected.email}</p>
                      <p className="text-sm text-slate-600">{selected.phone}</p>
                      <p className="mt-2 text-sm font-semibold text-blue">{selected.company}</p>
                    </div>
                  </div>
                  <Button variant="danger">Delete</Button>
                </div>
                <p className="mt-10 text-center text-sm text-slate-500">{selected.details}</p>
              </>
            ) : (
              <p className="text-slate-500">Select a professional.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

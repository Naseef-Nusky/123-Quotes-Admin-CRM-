import { useState } from 'react'
import { DUMMY_PRO_MGMT_SETTINGS } from '../data/dummy.js'
import { Button, Card } from '../components/ui.jsx'

export default function ProMgmt() {
  const [settings, setSettings] = useState(DUMMY_PRO_MGMT_SETTINGS)
  const [saved, setSaved] = useState('')

  function update(key, value) {
    setSettings((rows) => rows.map((r) => (r.key === key ? { ...r, value } : r)))
  }

  function saveAll() {
    setSaved('Settings saved (demo).')
    setTimeout(() => setSaved(''), 2500)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy">Pro.Mgmt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platform options modernized into grouped cards (logo theme).
          </p>
        </div>
        <Button onClick={saveAll}>Save all changes</Button>
      </div>

      {saved ? <p className="mb-4 text-sm font-semibold text-ok">{saved}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <Card key={item.key} className="p-5">
            <p className="text-sm font-bold text-navy">{item.label}</p>
            {item.type === 'yesno' ? (
              <div className="mt-3 flex gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name={item.key}
                    checked={item.value === 'yes'}
                    onChange={() => update(item.key, 'yes')}
                    className="accent-blue"
                  />
                  Yes
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name={item.key}
                    checked={item.value === 'no'}
                    onChange={() => update(item.key, 'no')}
                    className="accent-blue"
                  />
                  No
                </label>
              </div>
            ) : (
              <input
                className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
                value={item.value}
                onChange={(e) => update(item.key, e.target.value)}
              />
            )}
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setSaved(`${item.label} updated.`)
                  setTimeout(() => setSaved(''), 2000)
                }}
              >
                Update
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

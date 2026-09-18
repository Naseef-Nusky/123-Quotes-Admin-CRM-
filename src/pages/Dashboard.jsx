import { useState } from 'react'
import { DUMMY_ADMIN_LEADS } from '../data/dummy.js'
import { Button, Card } from '../components/ui.jsx'

export default function Dashboard() {
  const [locked, setLocked] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Lead lock controls and platform overview.</p>
        </div>
        <Card className="p-4">
          <p className="text-sm font-semibold text-navy">Lock Lead View :</p>
          <Button
            variant={locked ? 'primary' : 'danger'}
            className="mt-2"
            onClick={() => setLocked((v) => !v)}
          >
            {locked ? 'Click here to Unlock' : 'Click here to Lock'}
          </Button>
          <p className="mt-2 max-w-xs text-xs text-slate-500">
            Click to Lock / Unlock all outgoing leads to Service Providers.
          </p>
          <p className="mt-2 text-xs font-semibold text-blue">
            Status: {locked ? 'LOCKED' : 'UNLOCKED'} · Open leads:{' '}
            {DUMMY_ADMIN_LEADS.filter((l) => !l.locked).length}
          </p>
        </Card>
      </div>
    </div>
  )
}

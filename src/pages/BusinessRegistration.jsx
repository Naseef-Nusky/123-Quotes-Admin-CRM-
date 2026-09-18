import { useState } from 'react'
import { DUMMY_BUSINESS_REGISTRATIONS } from '../data/dummy.js'
import { Button, Card, PageHeader } from '../components/ui.jsx'

export default function BusinessRegistration() {
  const [regs, setRegs] = useState(DUMMY_BUSINESS_REGISTRATIONS)

  function approve(id) {
    setRegs((rows) => rows.filter((r) => r.id !== id))
  }

  function decline(id) {
    setRegs((rows) => rows.filter((r) => r.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Business Registration"
        subtitle="Approve or decline pending professional signups."
      />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3">{r.contact}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => approve(r.id)}>
                      Approve
                    </Button>
                    <Button variant="danger" onClick={() => decline(r.id)}>
                      Decline
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!regs.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No pending registrations.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

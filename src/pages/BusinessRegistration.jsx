import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { mapPendingRegistration } from '../lib/mappers.js'
import { Button, Card, ErrorBanner, PageHeader } from '../components/ui.jsx'

export default function BusinessRegistration() {
  const [regs, setRegs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getUsers({ role: 'PROFESSIONAL', status: 'PENDING' })
      setRegs((data.users || []).map(mapPendingRegistration))
    } catch (err) {
      setError(err.message || 'Failed to load registrations')
      setRegs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function approve(id) {
    try {
      await api.updateUserStatus(id, 'ACTIVE')
      setRegs((rows) => rows.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message || 'Approve failed')
    }
  }

  async function decline(id) {
    try {
      await api.updateUserStatus(id, 'INACTIVE')
      setRegs((rows) => rows.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message || 'Decline failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Business Registration"
        subtitle="Approve or decline pending professional signups."
      />
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading…</p> : null}
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
            {!regs.length && !loading ? (
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

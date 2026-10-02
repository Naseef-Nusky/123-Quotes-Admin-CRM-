import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '../api/client.js'
import { mapBusinessApplication } from '../lib/mappers.js'
import BusinessAddWizard from '../components/BusinessAddWizard.jsx'
import { Button, Card, ErrorBanner, Loading, Modal, PageHeader } from '../components/ui.jsx'

export default function BusinessRegistration() {
  const [regs, setRegs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [mode, setMode] = useState(null) // add | view
  const [active, setActive] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getBusinessApplications({ status: 'PENDING' })
      setRegs((data.applications || []).map(mapBusinessApplication))
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

  function openAdd() {
    setMode('add')
    setActive(null)
    setError('')
  }

  function openView(row) {
    setMode('view')
    setActive(row)
    setError('')
  }

  function closeModal() {
    setMode(null)
    setActive(null)
  }

  async function onCreated() {
    setFlash('Business added.')
    setTimeout(() => setFlash(''), 2200)
    await load()
  }

  async function approve(id) {
    try {
      await api.approveBusinessApplication(id)
      setFlash('Business application approved.')
      setTimeout(() => setFlash(''), 2200)
      closeModal()
      await load()
    } catch (err) {
      setError(err.message || 'Approve failed')
    }
  }

  async function decline(id) {
    try {
      await api.declineBusinessApplication(id)
      setFlash('Business application declined.')
      setTimeout(() => setFlash(''), 2200)
      closeModal()
      await load()
    } catch (err) {
      setError(err.message || 'Decline failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Business Registration"
        subtitle="Review every business application. Additional signups for existing emails appear here for approval too."
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1.5 size-4" />
            Add business
          </Button>
        }
      />
      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <Loading className="mb-3 py-6" /> : null}
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3">{r.contact}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.service}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.isAdditional
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue/10 text-blue'
                    }`}
                  >
                    {r.isAdditional ? 'Additional' : 'New'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => openView(r)}>
                      View
                    </Button>
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
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No pending applications.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <BusinessAddWizard
        open={mode === 'add'}
        onClose={closeModal}
        onCreated={onCreated}
        defaultStatus="PENDING"
        title="Add business"
      />

      <Modal open={mode === 'view'} title="Application details" onClose={closeModal}>
        {active ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-navy">Type:</span>{' '}
              {active.isAdditional ? 'Additional signup (existing email)' : 'New business'}
            </p>
            <p>
              <span className="font-semibold text-navy">Company:</span> {active.name}
            </p>
            <p>
              <span className="font-semibold text-navy">Contact:</span> {active.contactName}
            </p>
            <p>
              <span className="font-semibold text-navy">Email:</span> {active.email}
            </p>
            <p>
              <span className="font-semibold text-navy">Phone:</span> {active.contact}
            </p>
            <p>
              <span className="font-semibold text-navy">Website:</span> {active.website}
            </p>
            <p>
              <span className="font-semibold text-navy">Service:</span> {active.service}
            </p>
            <p>
              <span className="font-semibold text-navy">Coverage:</span> {active.coverage}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" onClick={() => decline(active.id)}>
                Decline
              </Button>
              <Button variant="primary" onClick={() => approve(active.id)}>
                Approve
              </Button>
              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

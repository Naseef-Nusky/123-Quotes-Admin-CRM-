import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { mapBusinessApplication } from '../lib/mappers.js'
import BusinessAddWizard from '../components/BusinessAddWizard.jsx'
import DeleteAllButton from '../components/DeleteAllButton.jsx'
import { ActionIconButton, Button, Card, ErrorBanner, Loading, Modal, PageHeader, RowActions, ViewAction } from '../components/ui.jsx'
import { Check, Plus, X } from 'lucide-react'

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
          <div className="flex flex-nowrap gap-2">
            <Button onClick={openAdd}>
              <Plus className="mr-1.5 size-4" />
              Add business
            </Button>
            <DeleteAllButton
              label="Delete all applications"
              confirmText="Permanently delete ALL business applications from the database?\n\nType DELETE to confirm."
              onConfirm={async () => {
                const data = await api.deleteAllBusinessApplications()
                setFlash(`Deleted ${data.count ?? 0} application(s).`)
                await load()
              }}
            />
          </div>
        }
      />
      {flash ? <p className="mb-3 text-sm font-semibold text-ok">{flash}</p> : null}
      <ErrorBanner message={error} />
      {loading ? <Loading className="mb-3 py-6" /> : null}
      <Card className="overflow-hidden p-0">
        <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Type</th>
              <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.25)]">Actions</th>
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
                <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.25)]">
                  <RowActions>
                    <ViewAction onClick={() => openView(r)} />
                    <ActionIconButton label="Approve" variant="primary" onClick={() => approve(r.id)}>
                      <Check className="size-4" />
                    </ActionIconButton>
                    <ActionIconButton label="Decline" variant="danger" onClick={() => decline(r.id)}>
                      <X className="size-4" />
                    </ActionIconButton>
                  </RowActions>
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
        </div>
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

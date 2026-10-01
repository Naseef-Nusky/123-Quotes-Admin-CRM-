import { LeadSplitView } from '../components/AdminViews.jsx'
import { ErrorBanner } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

export default function LockedLeads() {
  const { leads, loading, error, deleteLead, updateLead, setLeadLock, leadViewLocked, unlockTiers } =
    useAdminLeads()

  return (
    <div>
      <ErrorBanner message={error} />
      {!loading && !leadViewLocked ? (
        <p className="mb-3 rounded-lg border border-blue/20 bg-blue/5 px-3 py-2 text-sm text-slate-600">
          Lead view is currently <strong className="text-navy">UNLOCKED</strong> for professionals.
          This tab lists closed/cancelled leads. Use Dashboard → Lock Lead View to hold all outgoing
          leads, then confirm unlock here.
        </p>
      ) : null}
      {leadViewLocked ? (
        <p className="mb-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-slate-700">
          Lead view is <strong>LOCKED</strong>. Professionals cannot receive new lead details until
          you unlock. Click <strong>Confirm</strong> to unlock all leads.
        </p>
      ) : null}
      <LeadSplitView
        title="Locked Leads"
        items={leads}
        mode="locked"
        leadViewLocked={leadViewLocked}
        showConfirm={leadViewLocked}
        loading={loading}
        unlockTiers={unlockTiers}
        onEdit={updateLead}
        onDelete={async (lead) => {
          if (!window.confirm(`Delete lead for “${lead.name}”?`)) return
          try {
            await deleteLead(lead.id)
          } catch (err) {
            window.alert(err.message || 'Delete failed')
          }
        }}
        onConfirm={async () => {
          try {
            await setLeadLock(false)
          } catch (err) {
            window.alert(err.message || 'Unlock failed')
          }
        }}
      />
    </div>
  )
}

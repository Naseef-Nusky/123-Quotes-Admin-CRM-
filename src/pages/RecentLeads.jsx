import { LeadSplitView } from '../components/AdminViews.jsx'
import { ErrorBanner } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

export default function RecentLeads() {
  const { leads, loading, error, deleteLead, updateLead, leadViewLocked, unlockTiers } =
    useAdminLeads()

  return (
    <div>
      <ErrorBanner message={error} />
      <LeadSplitView
        title="Recent Leads"
        items={leads}
        mode="recent"
        leadViewLocked={leadViewLocked}
        loading={loading}
        emptyMessage="No recent leads in the last 30 days."
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
      />
    </div>
  )
}

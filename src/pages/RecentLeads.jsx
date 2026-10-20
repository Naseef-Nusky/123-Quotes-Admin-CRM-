import { LeadSplitView } from '../components/AdminViews.jsx'
import DeleteAllButton from '../components/DeleteAllButton.jsx'
import { ErrorBanner, PageHeader } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

export default function RecentLeads() {
  const { leads, loading, error, deleteLead, deleteAllLeads, updateLead, leadViewLocked, unlockTiers } =
    useAdminLeads()

  return (
    <div>
      <PageHeader
        title="Recent Leads"
        subtitle="Delete all permanently removes every lead from the database."
        actions={
          <DeleteAllButton
            label="Delete all leads"
            confirmText="Permanently delete ALL leads from the database?\n\nType DELETE to confirm."
            onConfirm={async () => {
              const data = await deleteAllLeads()
              window.alert(`Deleted ${data.count ?? 0} lead request(s).`)
            }}
          />
        }
      />
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

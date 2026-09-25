import { LeadSplitView } from '../components/AdminViews.jsx'
import { ErrorBanner } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

export default function RecentLeads() {
  const { leads, loading, error, deleteLead, updateLead } = useAdminLeads()

  return (
    <div>
      <ErrorBanner message={error} />
      <LeadSplitView
        title="Recent Leads"
        items={leads}
        loading={loading}
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

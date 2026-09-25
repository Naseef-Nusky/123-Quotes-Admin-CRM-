import { LeadSplitView } from '../components/AdminViews.jsx'
import { ErrorBanner } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

export default function LockedLeads() {
  const { leads, loading, error, deleteLead, updateLead, setLeadLock } = useAdminLeads()

  return (
    <div>
      <ErrorBanner message={error} />
      <LeadSplitView
        title="Locked Leads"
        items={leads}
        filterLocked
        showConfirm
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

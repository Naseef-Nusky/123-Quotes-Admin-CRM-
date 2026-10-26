import { useEffect } from 'react'
import { LeadSplitView } from '../components/AdminViews.jsx'
import DeleteAllButton from '../components/DeleteAllButton.jsx'
import { Button, ErrorBanner, PageHeader, RefreshButton } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'
import { useNotifications } from '../context/NotificationContext.jsx'

export default function RecentLeads() {
  const {
    leads,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    usingFallback,
    error,
    deleteLead,
    deleteAllLeads,
    updateLead,
    loadLeadDetails,
    leadViewLocked,
    unlockTiers,
    reload,
  } = useAdminLeads({ recentDays: 30, limit: 100, fallbackLatest: 15 })

  // Viewing this tab clears its sidebar number badge.
  const { markKindRead, unreadByKind } = useNotifications()
  useEffect(() => {
    if (unreadByKind.new_lead > 0) markKindRead('new_lead')
  }, [unreadByKind, markKindRead])

  return (
    <div>
      <PageHeader
        title="Recent Leads"
        subtitle={
          usingFallback
            ? 'No leads in the last 30 days — showing the last 15 leads.'
            : 'Leads from the last 30 days. Delete all permanently removes every lead from the database.'
        }
        actions={
          <>
            <RefreshButton onClick={reload} loading={loading} />
            <DeleteAllButton
              label="Delete all leads"
              confirmText="Permanently delete ALL leads from the database?\n\nType DELETE to confirm."
              onConfirm={async () => {
                const data = await deleteAllLeads()
                window.alert(`Deleted ${data.count ?? 0} lead request(s).`)
              }}
            />
          </>
        }
      />
      <ErrorBanner message={error} />
      <LeadSplitView
        title="Recent Leads"
        items={leads}
        mode="recent"
        leadViewLocked={leadViewLocked}
        loading={loading}
        emptyMessage="No leads found."
        unlockTiers={unlockTiers}
        onEdit={updateLead}
        onLoadDetails={loadLeadDetails}
        onDelete={async (lead) => {
          if (!window.confirm(`Delete lead for “${lead.name}”?`)) return
          try {
            await deleteLead(lead.id)
          } catch (err) {
            window.alert(err.message || 'Delete failed')
          }
        }}
      />
      {hasMore ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Loading…' : 'Load more leads'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

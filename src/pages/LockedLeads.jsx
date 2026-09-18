import { DUMMY_ADMIN_LEADS } from '../data/dummy.js'
import { LeadSplitView } from '../components/AdminViews.jsx'

export default function LockedLeads() {
  return (
    <LeadSplitView
      title="Locked Leads"
      items={DUMMY_ADMIN_LEADS}
      filterLocked
      showConfirm
    />
  )
}

import { DUMMY_ADMIN_LEADS } from '../data/dummy.js'
import { LeadSplitView } from '../components/AdminViews.jsx'

export default function RecentLeads() {
  return <LeadSplitView title="Recent Leads" items={DUMMY_ADMIN_LEADS} />
}

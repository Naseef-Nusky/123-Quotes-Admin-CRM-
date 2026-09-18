import { DUMMY_ADMIN_PROS } from '../data/dummy.js'
import { DataTable } from '../components/AdminViews.jsx'
import { Button } from '../components/ui.jsx'

export default function Professionals() {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Contact No' },
    { key: 'email', label: 'Email' },
    { key: 'type', label: 'Type' },
    { key: 'company', label: 'Company' },
    {
      key: 'action',
      label: 'Action',
      render: () => <Button variant="danger">Delete</Button>,
    },
  ]

  return (
    <DataTable
      title="Professional"
      columns={columns}
      rows={DUMMY_ADMIN_PROS}
      searchKeys={['name', 'email', 'phone', 'type', 'company']}
    />
  )
}

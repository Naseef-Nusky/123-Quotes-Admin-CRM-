import { DUMMY_ADMIN_LEADS } from '../data/dummy.js'
import { DataTable } from '../components/AdminViews.jsx'
import { Button } from '../components/ui.jsx'

export default function Leads() {
  const columns = [
    { key: '#', label: '#', render: (_row, idx) => idx + 1 },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Contact No' },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Type' },
    { key: 'date', label: 'Date' },
    {
      key: 'action',
      label: 'Action',
      render: () => <Button variant="danger">Delete User</Button>,
    },
  ]

  return (
    <DataTable
      title="Leads"
      columns={columns}
      rows={DUMMY_ADMIN_LEADS}
      searchKeys={['name', 'email', 'phone', 'service']}
    />
  )
}

import { DataTable } from '../components/AdminViews.jsx'
import { Button, ErrorBanner } from '../components/ui.jsx'
import { useAdminLeads } from '../hooks/useAdminLeads.js'

export default function Leads() {
  const { leads, loading, error, deleteLead } = useAdminLeads()

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
      render: (row) => (
        <Button
          variant="danger"
          onClick={async () => {
            if (!window.confirm(`Delete lead for “${row.name}”?`)) return
            try {
              await deleteLead(row.id)
            } catch (err) {
              window.alert(err.message || 'Delete failed')
            }
          }}
        >
          Delete User
        </Button>
      ),
    },
  ]

  return (
    <div>
      <ErrorBanner message={error} />
      {loading ? <p className="mb-3 text-sm text-slate-500">Loading leads…</p> : null}
      <DataTable
        title="Leads"
        columns={columns}
        rows={leads}
        searchKeys={['name', 'email', 'phone', 'service']}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .dashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [])

  const cards = [
    { label: 'Total Quotes', value: stats?.totalQuotes ?? '—', to: '/quotes' },
    { label: 'Published', value: stats?.publishedQuotes ?? '—', to: '/quotes' },
    { label: 'Leads', value: stats?.totalLeads ?? '—', to: '/leads' },
    { label: 'New Leads', value: stats?.newLeads ?? '—', to: '/leads' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted">Overview of your quotes library and CRM leads.</p>

      {error && <p className="mt-4 text-sm text-warn">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl border border-line/20 bg-white p-5 shadow-sm transition hover:border-accent/40"
          >
            <p className="text-sm font-medium text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-navy">{card.value}</p>
          </Link>
        ))}
      </div>

      {stats?.recentLeads?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Recent leads</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-line/20 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.map((lead) => (
                  <tr key={lead._id} className="border-t border-line/15">
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3">{lead.email}</td>
                    <td className="px-4 py-3 capitalize">{lead.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

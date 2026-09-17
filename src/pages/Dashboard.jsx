import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import {
  Card,
  ErrorBanner,
  Loading,
  PageHeader,
  StatusBadge,
  formatDate,
  formatMoney,
} from '../components/ui.jsx'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats
  const cards = [
    { label: 'Customers', value: stats?.customers, to: '/users' },
    { label: 'Professionals', value: stats?.professionals, to: '/users' },
    { label: 'Requests', value: stats?.requests, to: '/requests' },
    { label: 'Leads', value: stats?.leads, to: '/leads' },
    { label: 'Unlocks', value: stats?.unlocks, to: '/leads' },
    { label: 'Revenue', value: stats ? formatMoney(stats.revenueCents) : null, to: '/payments' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview and recent activity." />
      <ErrorBanner message={error} />
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue/40"
              >
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-navy">{card.value ?? '—'}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="font-semibold">Recent requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Customer</th>
                      <th className="px-4 py-2 font-medium">Service</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentRequests || []).map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="px-4 py-2">
                          {r.customer?.firstName} {r.customer?.lastName}
                        </td>
                        <td className="px-4 py-2">{r.service?.name || '—'}</td>
                        <td className="px-4 py-2">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-slate-500">
                          {formatDate(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {!data?.recentRequests?.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No recent requests
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="font-semibold">Recent leads</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Service</th>
                      <th className="px-4 py-2 font-medium">Postcode</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.recentLeads || []).map((lead) => (
                      <tr key={lead.id} className="border-t border-slate-100">
                        <td className="px-4 py-2">{lead.service?.name || '—'}</td>
                        <td className="px-4 py-2">{lead.postcode}</td>
                        <td className="px-4 py-2">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-slate-500">
                          {formatDate(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {!data?.recentLeads?.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          No recent leads
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

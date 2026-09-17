import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const statuses = ['new', 'contacted', 'qualified', 'closed']

export default function LeadsAdmin() {
  const [leads, setLeads] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await api.getLeads()
      setLeads(data.leads || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    try {
      await api.updateLead(id, { status })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this lead?')) return
    try {
      await api.deleteLead(id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Leads</h1>
      <p className="mt-1 text-muted">Contact requests from the public website.</p>
      {error && <p className="mt-3 text-sm text-warn">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-xl border border-line/20 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-muted">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-t border-line/15 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-muted">{lead.email}</p>
                    {lead.company && <p className="text-muted">{lead.company}</p>}
                    {lead.phone && <p className="text-muted">{lead.phone}</p>}
                  </td>
                  <td className="max-w-sm px-4 py-3 text-navy/80">{lead.message}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-line/25 px-2 py-1.5 capitalize"
                      value={lead.status}
                      onChange={(e) => updateStatus(lead._id, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-warn hover:underline" onClick={() => remove(lead._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted">
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

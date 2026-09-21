import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { mapAdminLead } from '../lib/mappers.js'

export function useAdminLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leadViewLocked, setLeadViewLocked] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [leadsRes, settingsRes] = await Promise.all([
        api.getLeads(),
        api.getSettings().catch(() => ({ settings: [] })),
      ])
      const lockedSetting = (settingsRes.settings || []).find((s) => s.key === 'lead_view_locked')
      const locked = Boolean(lockedSetting?.value)
      setLeadViewLocked(locked)
      setLeads((leadsRes.leads || []).map((l) => mapAdminLead(l, locked)))
    } catch (err) {
      setError(err.message || 'Failed to load leads')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function deleteLead(id) {
    await api.deleteLead(id)
    setLeads((rows) => rows.filter((r) => r.id !== id))
  }

  async function setLeadLock(next) {
    await api.upsertSetting({ key: 'lead_view_locked', value: next })
    setLeadViewLocked(next)
    setLeads((rows) => rows.map((r) => ({ ...r, locked: next || r.status === 'CLOSED' || r.status === 'CANCELLED' })))
  }

  return { leads, loading, error, reload, deleteLead, leadViewLocked, setLeadLock }
}

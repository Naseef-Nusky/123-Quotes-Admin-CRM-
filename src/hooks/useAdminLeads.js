import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { mapAdminLead } from '../lib/mappers.js'

export function useAdminLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leadViewLocked, setLeadViewLocked] = useState(false)
  const [maxUnlocksPerLead, setMaxUnlocksPerLead] = useState(0)
  const [unlockTiers, setUnlockTiers] = useState([{ afterViews: 0, tokenCost: 1 }])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [leadsRes, settingsRes] = await Promise.all([
        api.getLeads(),
        api.getSettings().catch(() => ({ settings: [] })),
      ])
      const settings = settingsRes.settings || []
      const lockedSetting = settings.find((s) => s.key === 'lead_view_locked')
      const maxSetting = settings.find((s) => s.key === 'max_unlocks_per_lead')
      const tierSetting = settings.find((s) => s.key === 'unlock_token_tiers')
      const locked = Boolean(lockedSetting?.value)
      const maxN = Number(maxSetting?.value)
      const maxUnlocks = Number.isFinite(maxN) && maxN > 0 ? Math.floor(maxN) : 0
      const tiers = tierSetting?.value ?? [{ afterViews: 0, tokenCost: 1 }]
      setLeadViewLocked(locked)
      setMaxUnlocksPerLead(maxUnlocks)
      setUnlockTiers(Array.isArray(tiers) ? tiers : [{ afterViews: 0, tokenCost: 1 }])
      setLeads((leadsRes.leads || []).map((l) => mapAdminLead(l, locked, maxUnlocks, tiers)))
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

  async function updateLead(id, body) {
    const data = await api.updateLead(id, body)
    const mapped = mapAdminLead(data.lead, leadViewLocked, maxUnlocksPerLead, unlockTiers)
    setLeads((rows) => rows.map((r) => (r.id === id ? mapped : r)))
    return mapped
  }

  async function setLeadLock(next) {
    await api.upsertSetting({ key: 'lead_view_locked', value: next })
    setLeadViewLocked(next)
    setLeads((rows) =>
      rows.map((r) => ({
        ...r,
        locked: next || r.status === 'CLOSED' || r.status === 'CANCELLED',
      })),
    )
  }

  return {
    leads,
    loading,
    error,
    reload,
    deleteLead,
    updateLead,
    leadViewLocked,
    setLeadLock,
    maxUnlocksPerLead,
    unlockTiers,
  }
}

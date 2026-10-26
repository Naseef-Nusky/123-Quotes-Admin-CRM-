import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { mapAdminLead } from '../lib/mappers.js'

/**
 * @param {{ recentDays?: number, limit?: number, fallbackLatest?: number }} [options]
 * If recentDays returns no rows and fallbackLatest is set, load that many newest leads instead.
 */
export function useAdminLeads(options = {}) {
  const recentDays = options.recentDays
  const pageSize = options.limit || 150
  const fallbackLatest = options.fallbackLatest
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [leadViewLocked, setLeadViewLocked] = useState(false)
  const [maxUnlocksPerLead, setMaxUnlocksPerLead] = useState(0)
  const [unlockTiers, setUnlockTiers] = useState([{ afterViews: 0, tokenCost: 1 }])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  const mapWithSettings = useCallback(
    (list, locked, maxUnlocks, tiers) =>
      (list || []).map((l) => mapAdminLead(l, locked, maxUnlocks, tiers)),
    [],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    setUsingFallback(false)
    try {
      const [leadsRes, settingsRes] = await Promise.all([
        api.getLeads({
          limit: pageSize,
          offset: 0,
          ...(recentDays ? { recentDays } : {}),
        }),
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

      let listRes = leadsRes
      if (
        recentDays &&
        fallbackLatest &&
        !(leadsRes.leads || []).length
      ) {
        listRes = await api.getLeads({ limit: fallbackLatest, offset: 0 })
        setUsingFallback(true)
      }

      const mapped = mapWithSettings(listRes.leads, locked, maxUnlocks, tiers).map((row) => ({
        ...row,
        detailsLoaded: false,
      }))
      mapped.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
      setLeads(mapped)
      setTotal(listRes.total ?? mapped.length)
      // Fallback is a fixed "last N" snapshot — no load-more.
      setHasMore(Boolean(listRes.hasMore) && !(recentDays && !(leadsRes.leads || []).length && fallbackLatest))
    } catch (err) {
      setError(err.message || 'Failed to load leads')
      setLeads([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [pageSize, recentDays, fallbackLatest, mapWithSettings])

  useEffect(() => {
    reload()
  }, [reload])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const leadsRes = await api.getLeads({
        limit: pageSize,
        offset: leads.length,
        ...(recentDays ? { recentDays } : {}),
      })
      const mapped = mapWithSettings(
        leadsRes.leads,
        leadViewLocked,
        maxUnlocksPerLead,
        unlockTiers,
      )
      setLeads((prev) => {
        const seen = new Set(prev.map((l) => l.id))
        const next = [...prev]
        for (const row of mapped) {
          if (!seen.has(row.id)) next.push({ ...row, detailsLoaded: false })
        }
        next.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
        return next
      })
      setTotal(leadsRes.total ?? 0)
      setHasMore(Boolean(leadsRes.hasMore))
    } catch {
      /* keep loaded rows */
    } finally {
      setLoadingMore(false)
    }
  }

  async function deleteLead(id) {
    await api.deleteLead(id)
    setLeads((rows) => rows.filter((r) => r.id !== id))
    setTotal((t) => Math.max(0, t - 1))
  }

  async function deleteAllLeads() {
    const data = await api.deleteAllLeads()
    setLeads([])
    setTotal(0)
    setHasMore(false)
    return data
  }

  async function updateLead(id, body) {
    const data = await api.updateLead(id, body)
    const mapped = mapAdminLead(data.lead, leadViewLocked, maxUnlocksPerLead, unlockTiers)
    mapped.detailsLoaded = true
    setLeads((rows) => rows.map((r) => (r.id === id ? mapped : r)))
    return mapped
  }

  /** Fetch Q&A + attachments for one lead (list endpoint omits them for speed). */
  const loadLeadDetails = useCallback(
    async (id) => {
      const data = await api.getLead(id)
      const mapped = mapAdminLead(data.lead, leadViewLocked, maxUnlocksPerLead, unlockTiers)
      mapped.detailsLoaded = true
      setLeads((rows) =>
        rows.map((r) => (r.id === id ? { ...r, ...mapped, detailsLoaded: true } : r)),
      )
      return mapped
    },
    [leadViewLocked, maxUnlocksPerLead, unlockTiers],
  )

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
    loadingMore,
    error,
    total,
    hasMore,
    usingFallback,
    loadMore,
    reload,
    deleteLead,
    deleteAllLeads,
    updateLead,
    loadLeadDetails,
    leadViewLocked,
    setLeadLock,
    maxUnlocksPerLead,
    unlockTiers,
  }
}

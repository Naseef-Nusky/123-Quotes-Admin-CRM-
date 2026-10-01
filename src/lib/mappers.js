/** Map API entities to Admin CRM row shapes */

export function timeAgo(date) {
  if (!date) return '—'
  const sec = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000))
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} Minute(s) ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} Hour(s) ago`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days} Day(s) ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} Month(s) ago`
  return `${Math.floor(months / 12)} Year(s) ago`
}

export function formatDateTime(date) {
  if (!date) return '—'
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function maskPostcode(pc) {
  if (!pc) return '—'
  const clean = String(pc).replace(/\s+/g, '')
  if (clean.length <= 3) return `${clean}****`
  return `${clean.slice(0, 3)}****`
}

function normalizeUnlockTiers(raw, fallbackCost = 1) {
  let list = raw
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      list = null
    }
  }
  const fresh = Math.max(1, Math.floor(Number(fallbackCost) || 1))
  if (!Array.isArray(list) || !list.length) {
    return [{ fromViews: 0, toViews: null, tokenCost: fresh, afterViews: 0 }]
  }

  if (list.some((t) => t.afterViews != null && t.fromViews == null)) {
    const points = list
      .map((t) => ({
        afterViews: Math.max(0, Math.floor(Number(t.afterViews) || 0)),
        tokenCost: Math.max(1, Math.floor(Number(t.tokenCost) || 1)),
      }))
      .sort((a, b) => a.afterViews - b.afterViews)
    const byView = new Map()
    for (const t of points) byView.set(t.afterViews, t)
    const sorted = [...byView.values()].sort((a, b) => a.afterViews - b.afterViews)
    if (!sorted.some((t) => t.afterViews === 0)) sorted.unshift({ afterViews: 0, tokenCost: fresh })
    return sorted.map((t, i) => {
      const next = sorted[i + 1]
      return {
        fromViews: t.afterViews,
        toViews: next ? next.afterViews - 1 : null,
        tokenCost: t.tokenCost,
        afterViews: t.afterViews,
      }
    })
  }

  const tiers = list
    .map((t) => {
      const fromViews = Math.max(0, Math.floor(Number(t.fromViews ?? t.afterViews) || 0))
      let toViews = t.toViews
      if (toViews === '' || toViews == null) toViews = null
      else toViews = Math.max(fromViews, Math.floor(Number(toViews) || 0))
      return {
        fromViews,
        toViews,
        tokenCost: Math.max(1, Math.floor(Number(t.tokenCost) || 1)),
        afterViews: fromViews,
      }
    })
    .sort((a, b) => a.fromViews - b.fromViews)

  if (!tiers.some((t) => t.fromViews === 0)) {
    tiers.unshift({ fromViews: 0, toViews: null, tokenCost: fresh, afterViews: 0 })
  }
  const byFrom = new Map()
  for (const t of tiers) byFrom.set(t.fromViews, t)
  return [...byFrom.values()].sort((a, b) => a.fromViews - b.fromViews)
}

export function costFromUnlockTiers(unlockedCount, tiers, fallbackCost = 1) {
  const count = Math.max(0, Math.floor(Number(unlockedCount) || 0))
  const list = normalizeUnlockTiers(tiers, fallbackCost)
  let matched = list[0].tokenCost
  const hasInclusive = list.some(
    (t) => count >= t.fromViews && (t.toViews == null || count <= t.toViews),
  )
  if (hasInclusive) {
    for (const tier of list) {
      if (count >= tier.fromViews && (tier.toViews == null || count <= tier.toViews)) {
        matched = tier.tokenCost
      }
    }
  } else {
    for (const tier of list) {
      if (count >= tier.fromViews) matched = tier.tokenCost
    }
  }
  return matched
}

export function mapAdminLead(lead, leadViewLocked = false, maxUnlocksPerLead = 0, unlockTiers = null) {
  const customer = lead.request?.customer
  const user = customer?.user
  const firstName = customer?.firstName || ''
  const lastName = customer?.lastName || ''
  const name = customer
    ? `${firstName} ${lastName}`.trim() || 'Lead'
    : 'Lead'
  const answers = lead.request?.answers || []
  const details = answers.map((a) => ({
    questionId: a.questionId || a.question?.id,
    answerId: a.id,
    q: a.question?.label || 'Question',
    a: a.value || '',
    type: a.question?.type || 'TEXT',
    options: (a.question?.options || []).map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value,
    })),
  }))
  const snippet =
    lead.summary ||
    details
      .map((d) => d.a)
      .filter(Boolean)
      .join(' / ') ||
    '—'

  const locked =
    leadViewLocked || lead.status === 'CLOSED' || lead.status === 'CANCELLED'

  const matchedCount = lead.matches?.length ?? lead.matchedCount ?? 0
  const unlockedCount = lead.unlocks?.length ?? lead.unlockedCount ?? 0
  const baseTokenCost = lead.tokenCost ?? lead.service?.tokenCost ?? 1
  let rawCustom = lead.unlockTiers
  if (typeof rawCustom === 'string') {
    try {
      rawCustom = JSON.parse(rawCustom)
    } catch {
      rawCustom = null
    }
  }
  const leadCustomTiers =
    Array.isArray(rawCustom) && rawCustom.length ? rawCustom : null
  const tiers = normalizeUnlockTiers(leadCustomTiers || unlockTiers, baseTokenCost)
  const tokenCost = costFromUnlockTiers(unlockedCount, tiers, baseTokenCost)
  const maxUnlocks = Number(maxUnlocksPerLead) > 0 ? Number(maxUnlocksPerLead) : 0

  return {
    id: lead.id,
    name,
    firstName,
    lastName,
    ago: timeAgo(lead.createdAt),
    createdAtMs: lead.createdAt ? new Date(lead.createdAt).getTime() : 0,
    service: lead.service?.name || '—',
    snippet,
    postcode: maskPostcode(lead.postcode),
    postcodeRaw: lead.postcode || customer?.postcode || '',
    interest: matchedCount,
    matchedCount,
    unlockedCount,
    maxUnlocks,
    tokenCost,
    baseTokenCost,
    unlockTiers: tiers,
    customUnlockTiers: leadCustomTiers,
    hasCustomUnlockTiers: Boolean(leadCustomTiers),
    unlockStatsLabel:
      maxUnlocks > 0
        ? `${unlockedCount}/${maxUnlocks} unlocks · ${matchedCount} matched`
        : `${unlockedCount} unlocks · ${matchedCount} matched`,
    phone: customer?.phone || '—',
    email: user?.email || '—',
    locked,
    date: formatDateTime(lead.createdAt),
    status: lead.status,
    summary: lead.summary || '',
    details: details.length
      ? details
      : [{ questionId: null, answerId: null, q: 'Summary', a: lead.summary || '', type: 'TEXTAREA', options: [] }],
  }
}

export function mapAdminProfessional(user) {
  const pro = user.professional
  const type =
    pro?.services?.[0]?.service?.name ||
    pro?.services?.[0]?.service?.slug ||
    '—'
  return {
    id: user.id,
    profileId: pro?.id,
    name: pro?.contactName || '—',
    phone: pro?.phone || '—',
    email: user.email || '—',
    type,
    company: pro?.companyName || '—',
    details: pro?.bio || 'No Additional Details',
    status: user.status,
    createdAt: user.createdAt,
  }
}

export function mapPendingRegistration(user) {
  const pro = user.professional
  return {
    id: user.id,
    name: pro?.companyName || pro?.contactName || '—',
    contact: pro?.phone || '—',
    email: user.email || '—',
  }
}

export function mapBusinessApplication(app) {
  return {
    id: app.id,
    name: app.companyName || app.contactName || '—',
    contactName: app.contactName || '—',
    contact: app.phone || '—',
    email: app.email || '—',
    service: app.service?.name || app.serviceName || '—',
    coverage: app.nationwide
      ? 'Nationwide'
      : app.postcode
        ? `${app.radiusMiles || 50} mi from ${app.postcode}`
        : '—',
    isAdditional: Boolean(app.isAdditional),
    website: app.website || '—',
    status: app.status,
    createdAt: app.createdAt,
    raw: app,
  }
}

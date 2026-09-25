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

export function mapAdminLead(lead, leadViewLocked = false) {
  const customer = lead.request?.customer
  const user = customer?.user
  const firstName = customer?.firstName || ''
  const lastName = customer?.lastName || ''
  const name = customer
    ? `${firstName} ${lastName}`.trim() || 'Lead'
    : 'Lead'
  const answers = lead.request?.answers || []
  const details = answers.map((a) => ({
    q: a.question?.label || 'Question',
    a: a.value || '',
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

  return {
    id: lead.id,
    name,
    firstName,
    lastName,
    ago: timeAgo(lead.createdAt),
    service: lead.service?.name || '—',
    snippet,
    postcode: maskPostcode(lead.postcode),
    postcodeRaw: lead.postcode || customer?.postcode || '',
    interest: lead.matches?.length || lead.matchedCount || lead.tokenCost || 0,
    phone: customer?.phone || '—',
    email: user?.email || '—',
    locked,
    date: formatDateTime(lead.createdAt),
    status: lead.status,
    summary: lead.summary || '',
    details: details.length ? details : [{ q: 'Summary', a: lead.summary || '—' }],
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

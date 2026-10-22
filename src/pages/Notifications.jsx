import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff } from 'lucide-react'
import { Button, PageHeader } from '../components/ui.jsx'
import {
  KIND_LABELS,
  KIND_TO_TAB,
  useNotifications,
} from '../context/NotificationContext.jsx'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Notifications() {
  const navigate = useNavigate()
  const { items, unreadCount, markAllRead, markOneRead } = useNotifications()
  // Notifications that were unread when this page was opened stay highlighted
  // for this visit, even though viewing the page marks them read (badges update).
  const [freshIds, setFreshIds] = useState(() => new Set())
  const markedRef = useRef(false)

  useEffect(() => {
    if (markedRef.current || !items.length) return
    markedRef.current = true
    setFreshIds(new Set(items.filter((n) => !n.isRead).map((n) => n.id)))
    markAllRead()
  }, [items, markAllRead])

  async function onClickItem(n) {
    await markOneRead(n.id)
    const tab = KIND_TO_TAB[n.meta?.kind]
    if (tab) navigate(tab)
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="New leads and business registrations appear here. Opening this page marks them as read and updates the tab numbers."
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" onClick={markAllRead}>
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {!items.length ? (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <BellOff className="size-8 text-slate-300" strokeWidth={1.6} />
            <p className="text-sm font-medium text-navy">No notifications yet</p>
            <p className="text-xs text-slate-500">
              New leads and business registrations will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const fresh = freshIds.has(n.id)
              const kind = n.meta?.kind
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onClickItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                      fresh ? 'bg-blue/5' : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        fresh ? 'bg-warn' : 'bg-slate-200'
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-navy">{n.title}</span>
                        {kind && KIND_LABELS[kind] ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {KIND_LABELS[kind]}
                          </span>
                        ) : null}
                        {fresh ? (
                          <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warn">
                            New
                          </span>
                        ) : null}
                      </span>
                      {n.body ? (
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-600">
                          {n.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

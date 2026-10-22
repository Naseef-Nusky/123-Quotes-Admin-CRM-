import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { KIND_TO_TAB, useNotifications } from '../context/NotificationContext.jsx'

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

export default function NotificationBell() {
  const navigate = useNavigate()
  const { items, unreadCount, markOneRead, markAllRead, refresh } = useNotifications()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function openPanel() {
    if (!open) refresh()
    setOpen((v) => !v)
  }

  async function onClickItem(n) {
    await markOneRead(n.id)
    setOpen(false)
    const tab = KIND_TO_TAB[n.meta?.kind]
    if (tab) navigate(tab)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={openPanel}
        className="relative inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-navy transition hover:border-blue hover:text-blue"
        aria-label="Notifications"
      >
        <Bell className="size-5" strokeWidth={1.9} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-warn px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-navy">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-blue hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!items.length ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : null}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onClickItem(n)}
                className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  n.isRead ? 'bg-white' : 'bg-blue/5'
                }`}
              >
                <span className="text-sm font-semibold text-navy">{n.title}</span>
                <span className="line-clamp-2 text-xs text-slate-600">{n.body}</span>
                <span className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/notifications')
            }}
            className="block w-full px-4 py-2.5 text-center text-xs font-semibold text-blue transition hover:bg-slate-50"
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  )
}

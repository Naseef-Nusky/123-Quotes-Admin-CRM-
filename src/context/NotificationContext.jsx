import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api/client.js'

const NotificationContext = createContext(null)

/** Which CRM tab a notification kind belongs to. */
export const KIND_TO_TAB = {
  business_registration: '/business-registration',
  new_lead: '/recent-leads',
}

export const KIND_LABELS = {
  business_registration: 'Business Registration',
  new_lead: 'New Lead',
}

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadByKind, setUnreadByKind] = useState({})
  const location = useLocation()

  const refresh = useCallback(async () => {
    try {
      const data = await api.getNotifications({ limit: 30 })
      setItems(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      setUnreadByKind(data.unreadByKind || {})
    } catch {
      /* keep previous */
    }
  }, [])

  // Refresh on mount, on every route change, and poll for new arrivals.
  useEffect(() => {
    refresh()
  }, [refresh, location.pathname])

  useEffect(() => {
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [refresh])

  const markOneRead = useCallback(
    async (id) => {
      const target = items.find((n) => n.id === id)
      if (!target || target.isRead) return
      const kind = target.meta?.kind
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
      if (kind) {
        setUnreadByKind((prev) => {
          if (!prev[kind]) return prev
          const next = { ...prev }
          next[kind] -= 1
          if (next[kind] <= 0) delete next[kind]
          return next
        })
      }
      try {
        await api.markNotificationRead(id)
      } catch {
        /* ignore */
      }
      refresh()
    },
    [items, refresh],
  )

  const markKindRead = useCallback(
    async (kind) => {
      if (!kind || !unreadByKind[kind]) return
      const cleared = unreadByKind[kind]
      setItems((prev) =>
        prev.map((n) => (n.meta?.kind === kind ? { ...n, isRead: true } : n)),
      )
      setUnreadByKind((prev) => {
        const next = { ...prev }
        delete next[kind]
        return next
      })
      setUnreadCount((c) => Math.max(0, c - cleared))
      try {
        await api.markNotificationsReadByKind(kind)
      } catch {
        /* ignore */
      }
      refresh()
    },
    [unreadByKind, refresh],
  )

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadByKind({})
    setUnreadCount(0)
    try {
      await api.markAllNotificationsRead()
    } catch {
      /* ignore */
    }
    refresh()
  }, [refresh])

  return (
    <NotificationContext.Provider
      value={{
        items,
        unreadCount,
        unreadByKind,
        refresh,
        markOneRead,
        markKindRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

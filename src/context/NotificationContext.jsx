import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  const lastFullPath = useRef('')

  const applyCounts = useCallback((data) => {
    setUnreadCount(data.unreadCount || 0)
    setUnreadByKind(data.unreadByKind || {})
  }, [])

  /** Full list — only when the notifications page needs rows. */
  const refresh = useCallback(async () => {
    try {
      const data = await api.getNotifications({ limit: 30 })
      setItems(data.notifications || [])
      applyCounts(data)
    } catch {
      /* keep previous */
    }
  }, [applyCounts])

  /** Badge polling — counts only (much cheaper on remote DB). */
  const refreshCounts = useCallback(async () => {
    try {
      const data = await api.getNotifications({ lite: 1 })
      applyCounts(data)
    } catch {
      /* keep previous */
    }
  }, [applyCounts])

  // Mount: load counts quickly. Full list only on /notifications.
  useEffect(() => {
    refreshCounts()
  }, [refreshCounts])

  useEffect(() => {
    if (location.pathname === '/notifications') {
      if (lastFullPath.current !== location.pathname) {
        lastFullPath.current = location.pathname
        refresh()
      }
    } else {
      lastFullPath.current = ''
    }
  }, [location.pathname, refresh])

  // Poll badges only (not full list) — every 60s
  useEffect(() => {
    const id = setInterval(refreshCounts, 60000)
    return () => clearInterval(id)
  }, [refreshCounts])

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
    },
    [items],
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
    },
    [unreadByKind],
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
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        items,
        unreadCount,
        unreadByKind,
        refresh,
        refreshCounts,
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

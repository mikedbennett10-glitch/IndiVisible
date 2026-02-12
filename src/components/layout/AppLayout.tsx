import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { SearchBar } from '@/components/search/SearchBar'
import { useNotifications } from '@/hooks/useNotifications'
import { useReminderChecker } from '@/hooks/useReminderChecker'

export function AppLayout() {
  const [showNotifications, setShowNotifications] = useState(false)
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  // Poll for fired reminders and create notifications
  useReminderChecker()

  return (
    <div className="flex flex-col min-h-dvh bg-warm-50 dark:bg-warm-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-warm-800/90 backdrop-blur-lg border-b border-warm-100 dark:border-warm-700">
        <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-400 tracking-tight">IndiVisible</span>
          <div className="flex items-center gap-1">
            <SearchBar />
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setShowNotifications(true)}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />

      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          loading={loading}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onClearAll={clearAll}
        />
      )}
    </div>
  )
}

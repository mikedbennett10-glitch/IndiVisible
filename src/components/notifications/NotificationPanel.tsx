import { useNavigate } from 'react-router-dom'
import { X, CheckCheck, Trash2, Bell, Clock, UserPlus, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/Button'
import type { Notification } from '@/types'
import clsx from 'clsx'

interface NotificationPanelProps {
  notifications: Notification[]
  loading: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

const typeIcons: Record<string, typeof Bell> = {
  reminder: Clock,
  task_assigned: UserPlus,
  task_completed: CheckCircle2,
}

export function NotificationPanel({
  notifications,
  loading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationPanelProps) {
  const navigate = useNavigate()
  const hasUnread = notifications.some((n) => !n.read)

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) onMarkAsRead(notification.id)
    if (notification.task_id) {
      navigate(`/tasks/${notification.task_id}`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md mt-2 mx-4 bg-white rounded-xl shadow-xl border border-warm-100 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
          <h2 className="text-sm font-bold text-warm-900">Notifications</h2>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 rounded text-warm-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={16} />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-1.5 rounded text-warm-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell size={32} className="text-warm-200 mb-3" />
              <p className="text-sm font-medium text-warm-500">No notifications</p>
              <p className="text-xs text-warm-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] ?? Bell
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 border-b border-warm-50 cursor-pointer transition-colors',
                      notification.read
                        ? 'bg-white hover:bg-warm-50'
                        : 'bg-primary-50/50 hover:bg-primary-50'
                    )}
                  >
                    <div
                      className={clsx(
                        'shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center',
                        notification.read ? 'bg-warm-100 text-warm-400' : 'bg-primary-100 text-primary-600'
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={clsx(
                            'text-sm truncate',
                            notification.read ? 'text-warm-600' : 'text-warm-900 font-medium'
                          )}
                        >
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(notification.id)
                          }}
                          className="shrink-0 p-0.5 rounded text-warm-300 hover:text-danger-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      {notification.body && (
                        <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{notification.body}</p>
                      )}
                      <p className="text-[10px] text-warm-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="shrink-0 mt-2 w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-warm-100 bg-warm-50/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onMarkAllAsRead()
                onClose()
              }}
            >
              Mark all as read
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

import { Bell } from 'lucide-react'
import clsx from 'clsx'

interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell size={20} strokeWidth={1.8} />
      {unreadCount > 0 && (
        <span
          className={clsx(
            'absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold px-1',
            unreadCount > 9 && 'min-w-[20px]'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

import { NavLink } from 'react-router-dom'
import { Home, ListTodo, MessageCircle, Calendar, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/lists', icon: ListTodo, label: 'Lists' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-warm-800/90 backdrop-blur-lg border-t border-warm-100 dark:border-warm-700 pb-safe z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 min-w-[3rem] py-1 px-2 rounded-lg transition-colors relative',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300'
              )
            }
          >
            <item.icon size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

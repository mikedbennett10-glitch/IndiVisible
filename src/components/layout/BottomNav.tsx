import { NavLink } from 'react-router-dom'
import { Home, ListTodo, MessageCircle, Calendar, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/lists', icon: ListTodo, label: 'Lists' },
  { to: '/chat', icon: MessageCircle, label: 'Chat', badge: 'Soon' },
  { to: '/calendar', icon: Calendar, label: 'Calendar', badge: 'Soon' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-warm-100 pb-safe z-40">
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
                  ? 'text-primary-600'
                  : 'text-warm-400 hover:text-warm-600'
              )
            }
          >
            <div className="relative">
              <item.icon size={22} strokeWidth={1.8} />
              {'badge' in item && item.badge && (
                <span className="absolute -top-1.5 -right-3 text-[9px] font-semibold bg-primary-100 text-primary-600 px-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

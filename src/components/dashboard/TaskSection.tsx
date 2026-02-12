import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface TaskSectionProps {
  title: string
  count: number
  accent?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function TaskSection({ title, count, accent, defaultOpen = true, children }: TaskSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (count === 0) return null

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-1 py-1.5 text-left"
      >
        <ChevronDown
          size={16}
          className={clsx(
            'text-warm-400 transition-transform',
            !open && '-rotate-90'
          )}
        />
        <h3
          className="text-sm font-semibold flex-1"
          style={{ color: accent }}
        >
          {title}
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={accent ? { backgroundColor: accent + '20', color: accent } : undefined}
        >
          {count}
        </span>
      </button>
      {open && <div className="mt-1.5 space-y-1.5">{children}</div>}
    </div>
  )
}

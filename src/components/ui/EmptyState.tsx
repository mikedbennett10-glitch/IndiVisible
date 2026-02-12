import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-warm-100 flex items-center justify-center mb-4 text-warm-400">
        {icon ?? <Inbox size={24} />}
      </div>
      <h3 className="text-base font-medium text-warm-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-warm-400 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}

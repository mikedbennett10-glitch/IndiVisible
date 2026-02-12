import { useNavigate } from 'react-router-dom'
import { Check, Clock } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import type { Task, Profile } from '@/types'
import clsx from 'clsx'

interface TaskCardProps {
  task: Task
  members: Profile[]
  onToggleComplete?: (id: string) => void
  compact?: boolean
}

const priorityVariant = {
  none: undefined,
  low: 'muted' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
  critical: 'danger' as const,
}

export function TaskCard({ task, members, onToggleComplete, compact }: TaskCardProps) {
  const navigate = useNavigate()
  const assignee = members.find((m) => m.id === task.assigned_to)
  const isCompleted = task.status === 'completed'
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && !isCompleted
  const isDueToday = task.due_date && isToday(new Date(task.due_date + 'T00:00:00'))

  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg bg-white border border-warm-100 hover:border-warm-200 transition-colors cursor-pointer group',
        isCompleted && 'opacity-60'
      )}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleComplete?.(task.id)
        }}
        className={clsx(
          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          isCompleted
            ? 'border-success-500 bg-success-500 text-white'
            : 'border-warm-300 hover:border-primary-400'
        )}
      >
        {isCompleted && <Check size={12} />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-medium truncate',
            isCompleted ? 'line-through text-warm-400' : 'text-warm-800'
          )}
        >
          {task.title}
        </p>

        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            {task.due_date && (
              <span
                className={clsx(
                  'inline-flex items-center gap-1 text-xs',
                  isOverdue ? 'text-danger-500 font-medium' : isDueToday ? 'text-warning-400 font-medium' : 'text-warm-400'
                )}
              >
                <Clock size={11} />
                {isOverdue
                  ? 'Overdue'
                  : isDueToday
                    ? 'Today'
                    : format(new Date(task.due_date + 'T00:00:00'), 'MMM d')}
              </span>
            )}
            {task.priority !== 'none' && (
              <Badge variant={priorityVariant[task.priority]}>
                {task.priority}
              </Badge>
            )}
          </div>
        )}
      </div>

      {assignee && (
        <Avatar
          name={assignee.display_name}
          color={assignee.avatar_color}
          size="sm"
        />
      )}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { Check, Clock, GripVertical, Trash2 } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import type { Task, Profile } from '@/types'
import clsx from 'clsx'

interface TaskRowProps {
  task: Task
  members: Profile[]
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  showDragHandle?: boolean
  dragHandleProps?: Record<string, unknown>
}

const priorityVariant = {
  none: undefined,
  low: 'muted' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
  critical: 'danger' as const,
}

export function TaskRow({
  task,
  members,
  onToggleComplete,
  onDelete,
  showDragHandle,
  dragHandleProps,
}: TaskRowProps) {
  const navigate = useNavigate()
  const assignee = members.find((m) => m.id === task.assigned_to)
  const isCompleted = task.status === 'completed'
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && !isCompleted
  const isDueToday = task.due_date && isToday(new Date(task.due_date + 'T00:00:00'))

  return (
    <div
      className={clsx(
        'flex items-center gap-2 p-3 rounded-lg bg-white border border-warm-100 group transition-colors',
        isCompleted && 'opacity-60'
      )}
    >
      {showDragHandle && (
        <button
          className="touch-none shrink-0 p-0.5 text-warm-300 hover:text-warm-500 cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical size={16} />
        </button>
      )}

      <button
        onClick={() => onToggleComplete(task.id)}
        className={clsx(
          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          isCompleted
            ? 'border-success-500 bg-success-500 text-white'
            : 'border-warm-300 hover:border-primary-400'
        )}
      >
        {isCompleted && <Check size={12} />}
      </button>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <p
          className={clsx(
            'text-sm font-medium truncate',
            isCompleted ? 'line-through text-warm-400' : 'text-warm-800'
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.due_date && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 text-[11px]',
                isOverdue ? 'text-danger-500 font-medium' : isDueToday ? 'text-warning-400 font-medium' : 'text-warm-400'
              )}
            >
              <Clock size={10} />
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
          {task.shared_responsibility && (
            <Badge variant="primary">shared</Badge>
          )}
        </div>
      </div>

      {assignee && (
        <Avatar
          name={assignee.display_name}
          color={assignee.avatar_color}
          size="sm"
        />
      )}

      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 p-1.5 rounded text-warm-300 opacity-0 group-hover:opacity-100 hover:text-danger-500 hover:bg-danger-50 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

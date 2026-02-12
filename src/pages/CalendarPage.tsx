import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCalendarTasks } from '@/hooks/useCalendarTasks'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Check,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns'
import clsx from 'clsx'
import type { Task } from '@/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const priorityColor: Record<string, string> = {
  critical: 'bg-danger-500',
  high: 'bg-danger-400',
  medium: 'bg-warning-400',
  low: 'bg-primary-400',
  none: 'bg-warm-300',
}

export function CalendarPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { members } = useHouseholdMembers()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const { tasksByDate, loading } = useCalendarTasks(year, month)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const selectedTasks = selectedDateStr ? (tasksByDate.get(selectedDateStr) ?? []) : []

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-warm-900">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          {!isToday(currentDate) && (
            <button
              onClick={goToToday}
              className="text-[11px] text-primary-600 font-medium hover:text-primary-700"
            >
              Go to today
            </button>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-primary-400" />
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-warm-400 uppercase py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-warm-100 rounded-lg overflow-hidden">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate.get(dateStr) ?? []
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const selected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(day)}
              className={clsx(
                'relative flex flex-col items-center py-2 min-h-[52px] transition-colors',
                inMonth ? 'bg-white' : 'bg-warm-50/50',
                selected && 'bg-primary-50 ring-2 ring-primary-400 ring-inset',
                !selected && inMonth && 'hover:bg-warm-50'
              )}
            >
              <span
                className={clsx(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  today && !selected && 'bg-primary-500 text-white',
                  today && selected && 'bg-primary-600 text-white',
                  !today && inMonth && 'text-warm-800',
                  !today && !inMonth && 'text-warm-300'
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Task dots */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <span
                      key={task.id}
                      className={clsx(
                        'w-1.5 h-1.5 rounded-full',
                        task.status === 'completed' ? 'bg-success-400' : priorityColor[task.priority]
                      )}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[8px] text-warm-400 font-medium leading-none">
                      +{dayTasks.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day tasks */}
      {selectedDate && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-warm-700 mb-2">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-warm-400 py-4 text-center">No tasks on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <TaskCalendarCard
                  key={task.id}
                  task={task}
                  members={members}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskCalendarCard({
  task,
  members,
  onClick,
}: {
  task: Task
  members: { id: string; display_name: string; avatar_color: string }[]
  onClick: () => void
}) {
  const assignee = members.find((m) => m.id === task.assigned_to)
  const isCompleted = task.status === 'completed'

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 p-3 rounded-lg bg-white border border-warm-100 cursor-pointer hover:border-primary-200 transition-colors',
        isCompleted && 'opacity-60'
      )}
    >
      <div
        className={clsx(
          'shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
          isCompleted ? 'bg-success-500 text-white' : 'border-2 border-warm-300'
        )}
      >
        {isCompleted && <Check size={12} />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-medium truncate',
            isCompleted ? 'line-through text-warm-400' : 'text-warm-800'
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.due_time && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-warm-400">
              <Clock size={10} />
              {task.due_time.slice(0, 5)}
            </span>
          )}
          {task.priority !== 'none' && (
            <Badge
              variant={
                task.priority === 'critical' || task.priority === 'high'
                  ? 'danger'
                  : task.priority === 'medium'
                    ? 'warning'
                    : 'muted'
              }
            >
              {task.priority}
            </Badge>
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
    </div>
  )
}

import { useState } from 'react'
import { useReminders } from '@/hooks/useReminders'
import { useToast } from '@/hooks/useToast'
import { Bell, Plus, X, Clock, Loader2 } from 'lucide-react'
import { format, addHours, addDays, formatDistanceToNow, isPast } from 'date-fns'
import clsx from 'clsx'

interface ReminderSectionProps {
  taskId: string
  dueDate: string | null
  dueTime: string | null
}

const QUICK_OPTIONS = [
  { label: '1 hour before', getTime: (due: Date) => addHours(due, -1) },
  { label: '3 hours before', getTime: (due: Date) => addHours(due, -3) },
  { label: '1 day before', getTime: (due: Date) => addDays(due, -1) },
  { label: '2 days before', getTime: (due: Date) => addDays(due, -2) },
]

export function ReminderSection({ taskId, dueDate, dueTime }: ReminderSectionProps) {
  const { reminders, loading, addReminder, deleteReminder } = useReminders(taskId)
  const toast = useToast()
  const [showPicker, setShowPicker] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('09:00')
  const [adding, setAdding] = useState(false)

  const dueDateTime = dueDate
    ? new Date(`${dueDate}T${dueTime ?? '09:00'}`)
    : null

  async function handleQuickAdd(getTime: (due: Date) => Date) {
    if (!dueDateTime) {
      toast.error('Set a due date first to use relative reminders')
      return
    }
    const remindAt = getTime(dueDateTime)
    if (isPast(remindAt)) {
      toast.error('Reminder time is in the past')
      return
    }
    setAdding(true)
    const result = await addReminder(remindAt.toISOString())
    if (result.error) toast.error(result.error)
    else toast.success('Reminder set')
    setAdding(false)
  }

  async function handleCustomAdd() {
    if (!customDate) return
    const remindAt = new Date(`${customDate}T${customTime}`)
    if (isPast(remindAt)) {
      toast.error('Reminder time is in the past')
      return
    }
    setAdding(true)
    const result = await addReminder(remindAt.toISOString())
    if (result.error) toast.error(result.error)
    else {
      toast.success('Reminder set')
      setShowPicker(false)
      setCustomDate('')
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    const result = await deleteReminder(id)
    if (result.error) toast.error(result.error)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-warm-500">
          <Bell size={12} />
          Reminders
        </label>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-medium"
        >
          <Plus size={10} />
          Add
        </button>
      </div>

      {/* Existing reminders */}
      {loading ? (
        <Loader2 size={14} className="animate-spin text-warm-300" />
      ) : reminders.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {reminders.map((reminder) => {
            const reminderDate = new Date(reminder.remind_at)
            const past = isPast(reminderDate)
            return (
              <div
                key={reminder.id}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                  past ? 'bg-warm-100 text-warm-400' : 'bg-primary-50 text-primary-700',
                  reminder.sent && 'opacity-60'
                )}
              >
                <Clock size={12} />
                <span className="flex-1">
                  {format(reminderDate, 'MMM d, h:mm a')}
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({past ? 'past' : formatDistanceToNow(reminderDate, { addSuffix: true })})
                  </span>
                </span>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="p-0.5 rounded hover:bg-white/50 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Add reminder panel */}
      {showPicker && (
        <div className="bg-warm-50 rounded-lg p-3 space-y-3">
          {/* Quick options (relative to due date) */}
          {dueDateTime && (
            <div>
              <p className="text-[11px] font-medium text-warm-500 mb-1.5">Quick options</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleQuickAdd(opt.getTime)}
                    disabled={adding}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-warm-600 hover:bg-primary-50 hover:text-primary-700 border border-warm-200 transition-colors disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom date/time */}
          <div>
            <p className="text-[11px] font-medium text-warm-500 mb-1.5">Custom time</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded border border-warm-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="w-24 px-2 py-1.5 rounded border border-warm-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <button
                onClick={handleCustomAdd}
                disabled={!customDate || adding}
                className="px-3 py-1.5 rounded bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {adding ? <Loader2 size={12} className="animate-spin" /> : 'Set'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

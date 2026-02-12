import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTask } from '@/hooks/useTask'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ActivityTimeline } from '@/components/tasks/ActivityTimeline'
import {
  ArrowLeft, Trash2, Check, RotateCcw, Loader2,
  MapPin, Repeat,
} from 'lucide-react'
import clsx from 'clsx'
import type { TaskPriority, TaskUrgency, TaskStatus } from '@/types'

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: '#8c8178' },
  { value: 'low', label: 'Low', color: '#4a8ab5' },
  { value: 'medium', label: 'Medium', color: '#d4a03a' },
  { value: 'high', label: 'High', color: '#c47a5a' },
  { value: 'critical', label: 'Critical', color: '#c44d4d' },
]

const urgencyOptions: { value: TaskUrgency; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: '#8c8178' },
  { value: 'low', label: 'Low', color: '#4a8ab5' },
  { value: 'medium', label: 'Medium', color: '#d4a03a' },
  { value: 'high', label: 'High', color: '#c47a5a' },
  { value: 'urgent', label: 'Urgent', color: '#c44d4d' },
]

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Done' },
]

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { task, loading, updateTask, toggleComplete, deleteTask } = useTask(taskId)
  const { members } = useHouseholdMembers()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-400" size={28} />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto text-center">
        <p className="text-warm-500">Task not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-600 text-sm font-medium">
          Go back
        </button>
      </div>
    )
  }

  const isCompleted = task.status === 'completed'

  async function handleFieldChange(field: string, value: unknown) {
    setSaving(true)
    const result = await updateTask({ [field]: value })
    if (result.error) toast.error(result.error)
    setSaving(false)
  }

  async function handleToggle() {
    const result = await toggleComplete()
    if (result.error) toast.error(result.error)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteTask()
    if (result.error) {
      toast.error(result.error)
      setDeleting(false)
    } else {
      toast.success('Task deleted')
      navigate(-1)
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-warm-900 flex-1 truncate">Task Details</h1>
        {saving && <Loader2 size={16} className="animate-spin text-warm-400" />}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-1.5 rounded-lg text-warm-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Complete / Reopen */}
      <Button
        variant={isCompleted ? 'secondary' : 'primary'}
        className="w-full mb-6"
        onClick={handleToggle}
      >
        {isCompleted ? <RotateCcw size={16} /> : <Check size={16} />}
        {isCompleted ? 'Reopen Task' : 'Mark Complete'}
      </Button>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-1">Title</label>
          <input
            type="text"
            value={task.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="w-full text-lg font-semibold text-warm-900 bg-transparent border-b border-warm-200 focus:border-primary-400 focus:outline-none pb-1 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-1">Description</label>
          <textarea
            value={task.description ?? ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="w-full text-sm text-warm-800 bg-warm-50 rounded-lg border border-warm-200 focus:border-primary-400 focus:outline-none p-3 resize-none transition-colors"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-2">Status</label>
          <div className="flex gap-1 bg-warm-100 rounded-lg p-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFieldChange('status', opt.value)}
                className={clsx(
                  'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                  task.status === opt.value
                    ? 'bg-white text-warm-900 shadow-sm'
                    : 'text-warm-500 hover:text-warm-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-2">Priority</label>
          <div className="flex flex-wrap gap-1.5">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFieldChange('priority', opt.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  task.priority === opt.value
                    ? 'text-white shadow-sm'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                )}
                style={
                  task.priority === opt.value
                    ? { backgroundColor: opt.color }
                    : undefined
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-2">Urgency</label>
          <div className="flex flex-wrap gap-1.5">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFieldChange('urgency', opt.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  task.urgency === opt.value
                    ? 'text-white shadow-sm'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                )}
                style={
                  task.urgency === opt.value
                    ? { backgroundColor: opt.color }
                    : undefined
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date / Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-warm-500 mb-1">Due Date</label>
            <input
              type="date"
              value={task.due_date ?? ''}
              onChange={(e) => handleFieldChange('due_date', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-warm-500 mb-1">Due Time</label>
            <input
              type="time"
              value={task.due_time ?? ''}
              onChange={(e) => handleFieldChange('due_time', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-xs font-medium text-warm-500 mb-1">Assigned To</label>
          <select
            value={task.assigned_to ?? ''}
            onChange={(e) => handleFieldChange('assigned_to', e.target.value || null)}
            className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Shared Responsibility */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-warm-800">Shared Responsibility</p>
            <p className="text-xs text-warm-400">Both of you own this task</p>
          </div>
          <button
            onClick={() => handleFieldChange('shared_responsibility', !task.shared_responsibility)}
            className={clsx(
              'w-11 h-6 rounded-full transition-colors relative',
              task.shared_responsibility ? 'bg-primary-500' : 'bg-warm-200'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                task.shared_responsibility ? 'translate-x-5.5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* Placeholder fields */}
        <div className="space-y-3 pt-2 border-t border-warm-100">
          <div className="flex items-center gap-2 text-warm-300">
            <Repeat size={16} />
            <span className="text-sm">Recurrence</span>
            <Badge variant="muted">Coming Soon</Badge>
          </div>
          <div className="flex items-center gap-2 text-warm-300">
            <MapPin size={16} />
            <span className="text-sm">Location Reminder</span>
            <Badge variant="muted">Coming Soon</Badge>
          </div>
        </div>

        {/* Activity */}
        <div className="pt-4 border-t border-warm-100">
          <ActivityTimeline taskId={task.id} />
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Delete "${task.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

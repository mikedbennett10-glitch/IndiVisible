import { useState } from 'react'
import { useSubtasks } from '@/hooks/useSubtasks'
import { Check, Plus, X, ListChecks, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface SubtaskListProps {
  taskId: string
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const {
    subtasks,
    loading,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    completedCount,
    totalCount,
  } = useSubtasks(taskId)

  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    if (!newTitle.trim()) return
    setAdding(true)
    await addSubtask(newTitle.trim())
    setNewTitle('')
    setAdding(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1.5 text-xs font-medium text-warm-500">
          <ListChecks size={12} />
          Checklist
          {totalCount > 0 && (
            <span className="text-[10px] text-warm-400">
              ({completedCount}/{totalCount})
            </span>
          )}
        </label>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 bg-warm-100 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-success-400 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {loading ? (
        <Loader2 size={14} className="animate-spin text-warm-300" />
      ) : (
        <>
          {/* Subtask items */}
          <div className="space-y-1 mb-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 group px-1 py-1 rounded hover:bg-warm-50 transition-colors"
              >
                <button
                  onClick={() => toggleSubtask(subtask.id)}
                  className={clsx(
                    'shrink-0 w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors',
                    subtask.completed
                      ? 'border-success-500 bg-success-500 text-white'
                      : 'border-warm-300 hover:border-primary-400'
                  )}
                >
                  {subtask.completed && <Check size={10} />}
                </button>
                <span
                  className={clsx(
                    'flex-1 text-sm min-w-0 truncate',
                    subtask.completed ? 'line-through text-warm-400' : 'text-warm-800'
                  )}
                >
                  {subtask.title}
                </span>
                <button
                  onClick={() => deleteSubtask(subtask.id)}
                  className="shrink-0 p-0.5 rounded text-warm-300 opacity-0 group-hover:opacity-100 hover:text-danger-500 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add subtask */}
          <div className="flex items-center gap-2">
            <div className="shrink-0 w-4.5 h-4.5 flex items-center justify-center text-warm-300">
              <Plus size={12} />
            </div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add item..."
              disabled={adding}
              className="flex-1 text-sm text-warm-800 bg-transparent border-none outline-none placeholder-warm-300"
            />
            {adding && <Loader2 size={12} className="animate-spin text-warm-300" />}
          </div>
        </>
      )}
    </div>
  )
}

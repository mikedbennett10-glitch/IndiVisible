import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskSearch } from '@/hooks/useTaskSearch'
import { Search, X, Loader2, Clock, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import clsx from 'clsx'

export function SearchBar() {
  const navigate = useNavigate()
  const { results, loading, query, search, clear } = useTaskSearch()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function handleInputChange(value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      search(value)
    }, 300)
  }

  function handleClose() {
    setOpen(false)
    setInputValue('')
    clear()
  }

  function handleResultClick(taskId: string) {
    handleClose()
    navigate(`/tasks/${taskId}`)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        aria-label="Search tasks"
      >
        <Search size={20} strokeWidth={1.8} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={handleClose} />

      {/* Search panel */}
      <div className="relative w-full max-w-md mx-auto mt-2 px-4">
        <div className="bg-white rounded-xl shadow-xl border border-warm-100 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-warm-100">
            <Search size={16} className="shrink-0 text-warm-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 text-sm text-warm-900 bg-transparent outline-none placeholder-warm-400"
            />
            {loading && <Loader2 size={14} className="animate-spin text-warm-400" />}
            <button
              onClick={handleClose}
              className="shrink-0 p-1 rounded text-warm-400 hover:text-warm-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query && results.length === 0 && !loading ? (
              <div className="py-8 text-center">
                <p className="text-sm text-warm-400">No tasks found for "{query}"</p>
              </div>
            ) : (
              results.map((result) => {
                const isCompleted = result.task.status === 'completed'
                return (
                  <button
                    key={result.task.id}
                    onClick={() => handleResultClick(result.task.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-warm-50 hover:bg-warm-50 transition-colors"
                  >
                    <div
                      className={clsx(
                        'shrink-0 w-4 h-4 rounded-full flex items-center justify-center',
                        isCompleted
                          ? 'bg-success-500 text-white'
                          : 'border-2 border-warm-300'
                      )}
                    >
                      {isCompleted && <Check size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          'text-sm font-medium truncate',
                          isCompleted ? 'line-through text-warm-400' : 'text-warm-800'
                        )}
                      >
                        {result.task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-warm-400">{result.listName}</span>
                        {result.task.due_date && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-warm-400">
                            <Clock size={8} />
                            {result.task.due_date}
                          </span>
                        )}
                        {result.task.priority !== 'none' && (
                          <Badge
                            variant={
                              result.task.priority === 'critical' || result.task.priority === 'high'
                                ? 'danger'
                                : result.task.priority === 'medium'
                                  ? 'warning'
                                  : 'muted'
                            }
                          >
                            {result.task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

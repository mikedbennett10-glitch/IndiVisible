import { useState, useRef, type FormEvent } from 'react'
import { Plus, Loader2 } from 'lucide-react'

interface QuickAddTaskProps {
  onAdd: (title: string) => Promise<{ error: string | null }>
}

export function QuickAddTask({ onAdd }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || submitting) return

    setSubmitting(true)
    const result = await onAdd(title.trim())
    if (!result.error) {
      setTitle('')
    }
    setSubmitting(false)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-warm-200 border-dashed">
      <div className="w-5 h-5 rounded-full border-2 border-warm-200 flex items-center justify-center shrink-0">
        {submitting ? (
          <Loader2 size={10} className="animate-spin text-warm-400" />
        ) : (
          <Plus size={10} className="text-warm-300" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="flex-1 text-base bg-transparent text-warm-900 placeholder:text-warm-400 focus:outline-none"
      />
    </form>
  )
}

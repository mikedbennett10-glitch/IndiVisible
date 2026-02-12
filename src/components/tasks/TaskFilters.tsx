import clsx from 'clsx'
import type { TaskFilter, TaskSort } from '@/hooks/useTasks'
import { SortAsc } from 'lucide-react'

interface TaskFiltersProps {
  filter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
  sort: TaskSort
  onSortChange: (sort: TaskSort) => void
}

const filters: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'theirs', label: "Partner's" },
  { value: 'shared', label: 'Shared' },
  { value: 'unassigned', label: 'Unassigned' },
]

const sorts: { value: TaskSort; label: string }[] = [
  { value: 'sort_order', label: 'Manual' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created_at', label: 'Newest' },
]

export function TaskFilters({ filter, onFilterChange, sort, onSortChange }: TaskFiltersProps) {
  return (
    <div className="space-y-2">
      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              filter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <SortAsc size={14} className="text-warm-400" />
        {sorts.map((s) => (
          <button
            key={s.value}
            onClick={() => onSortChange(s.value)}
            className={clsx(
              'px-2 py-1 rounded text-[11px] font-medium transition-colors',
              sort === s.value
                ? 'bg-warm-200 text-warm-800'
                : 'text-warm-400 hover:text-warm-600'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useList } from '@/hooks/useList'
import { useTasks, type TaskFilter, type TaskSort } from '@/hooks/useTasks'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { useToast } from '@/hooks/useToast'
import { TaskRow } from '@/components/tasks/TaskRow'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ICON_MAP } from '@/components/ui/IconPicker'
import { ArrowLeft, Loader2, ClipboardList } from 'lucide-react'
import type { Task, Profile } from '@/types'

function SortableTaskRow(props: {
  task: Task
  members: Profile[]
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  showDragHandle: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskRow
        task={props.task}
        members={props.members}
        onToggleComplete={props.onToggleComplete}
        onDelete={props.onDelete}
        showDragHandle={props.showDragHandle}
        dragHandleProps={listeners}
      />
    </div>
  )
}

export function TaskListPage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { list, loading: listLoading } = useList(listId)
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [sort, setSort] = useState<TaskSort>('sort_order')

  const { tasks, allTasks, loading: tasksLoading, createTask, toggleComplete, deleteTask, reorderTasks } =
    useTasks({ listId: listId ?? '', filter, sort })

  const { members } = useHouseholdMembers()

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const incompleteTasks = tasks.filter((t) => t.status !== 'completed')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const [showCompleted, setShowCompleted] = useState(false)

  const loading = listLoading || tasksLoading

  async function handleQuickAdd(title: string) {
    const result = await createTask({ title })
    if (result.error) {
      toast.error(result.error)
      return { error: result.error }
    }
    return { error: null }
  }

  async function handleToggle(id: string) {
    const result = await toggleComplete(id)
    if (result.error) toast.error(result.error)
  }

  async function handleConfirmDelete() {
    if (!deletingTaskId) return
    setDeleting(true)
    const result = await deleteTask(deletingTaskId)
    if (result.error) toast.error(result.error)
    setDeleting(false)
    setDeletingTaskId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = allTasks.findIndex((t) => t.id === active.id)
    const newIndex = allTasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(allTasks, oldIndex, newIndex)
    reorderTasks(newOrder.map((t) => t.id))
  }

  const Icon = list ? (ICON_MAP[list.icon] ?? ICON_MAP['list']!) : null

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/lists')}
          className="p-1.5 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        {list && Icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: list.color + '18', color: list.color }}
          >
            <Icon size={16} />
          </div>
        )}
        <h1 className="text-lg font-bold text-warm-900 truncate">
          {list?.name ?? 'Loading...'}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-400" size={28} />
        </div>
      ) : (
        <>
          {/* Quick Add */}
          <div className="mb-4">
            <QuickAddTask onAdd={handleQuickAdd} />
          </div>

          {/* Filters */}
          <div className="mb-4">
            <TaskFilters
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
            />
          </div>

          {/* Task List */}
          {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={24} />}
              title="No tasks here yet"
              description="Use the input above to add your first task."
            />
          ) : (
            <>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={incompleteTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {incompleteTasks.map((task) => (
                      <SortableTaskRow
                        key={task.id}
                        task={task}
                        members={members}
                        onToggleComplete={handleToggle}
                        onDelete={setDeletingTaskId}
                        showDragHandle={sort === 'sort_order'}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-xs font-medium text-warm-400 hover:text-warm-600 mb-2"
                  >
                    {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
                  </button>
                  {showCompleted && (
                    <div className="space-y-1.5">
                      {completedTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          members={members}
                          onToggleComplete={handleToggle}
                          onDelete={setDeletingTaskId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

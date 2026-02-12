import { useEffect, useState } from 'react'
import { useLists } from '@/hooks/useLists'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ListCard } from '@/components/lists/ListCard'
import { ListFormModal } from '@/components/lists/ListFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/hooks/useToast'
import { Plus, ListTodo, Loader2 } from 'lucide-react'
import type { List } from '@/types'

export function ListsPage() {
  const { profile } = useAuth()
  const { lists, loading, createList, updateList, deleteList } = useLists()
  const toast = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [deletingList, setDeletingList] = useState<List | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Task counts per list
  const [taskCounts, setTaskCounts] = useState<Record<string, { incomplete: number; total: number }>>({})

  useEffect(() => {
    async function fetchCounts() {
      if (!profile?.household_id) return
      const { data } = await supabase
        .from('tasks')
        .select('list_id, status')

      if (data) {
        const counts: Record<string, { incomplete: number; total: number }> = {}
        for (const task of data) {
          if (!counts[task.list_id]) counts[task.list_id] = { incomplete: 0, total: 0 }
          counts[task.list_id]!.total++
          if (task.status !== 'completed') counts[task.list_id]!.incomplete++
        }
        setTaskCounts(counts)
      }
    }
    fetchCounts()
  }, [lists, profile?.household_id])

  async function handleCreate(data: { name: string; icon: string; color: string }) {
    const result = await createList(data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${data.name}" created`)
    }
  }

  async function handleEdit(data: { name: string; icon: string; color: string }) {
    if (!editingList) return
    const result = await updateList(editingList.id, data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('List updated')
    }
    setEditingList(null)
  }

  async function handleDelete() {
    if (!deletingList) return
    setDeleting(true)
    const result = await deleteList(deletingList.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`"${deletingList.name}" deleted`)
    }
    setDeleting(false)
    setDeletingList(null)
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-warm-900">Lists</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-400" size={28} />
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={24} />}
          title="No lists yet"
          description="Create your first shared list to start organizing tasks together."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Create First List
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              taskCount={taskCounts[list.id] ?? { incomplete: 0, total: 0 }}
              onEdit={setEditingList}
              onDelete={setDeletingList}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all z-30"
      >
        <Plus size={24} />
      </button>

      {/* Create Modal */}
      <ListFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Modal */}
      {editingList && (
        <ListFormModal
          open={!!editingList}
          onClose={() => setEditingList(null)}
          onSubmit={handleEdit}
          list={editingList}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingList}
        onClose={() => setDeletingList(null)}
        onConfirm={handleDelete}
        title="Delete List"
        message={`Are you sure you want to delete "${deletingList?.name}"? All tasks in this list will also be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

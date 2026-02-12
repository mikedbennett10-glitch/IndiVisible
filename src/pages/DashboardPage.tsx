import { useAuth } from '@/hooks/useAuth'
import { useDashboardTasks } from '@/hooks/useDashboardTasks'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { TaskSection } from '@/components/dashboard/TaskSection'
import { TaskCard } from '@/components/dashboard/TaskCard'
import { WorkloadBalance } from '@/components/dashboard/WorkloadBalance'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader2, ListTodo, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { members } = useHouseholdMembers()
  const navigate = useNavigate()
  const {
    overdueTasks,
    criticalTasks,
    todayTasks,
    upcomingTasks,
    recentlyCompleted,
    workloadBalance,
    loading,
    refetch,
  } = useDashboardTasks()

  const handleToggle = async (taskId: string) => {
    if (!profile) return
    await supabase.from('tasks').update({
      status: 'completed',
      completed_by: profile.id,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId)
    refetch()
  }

  const hasTasks =
    overdueTasks.length > 0 ||
    criticalTasks.length > 0 ||
    todayTasks.length > 0 ||
    upcomingTasks.length > 0 ||
    recentlyCompleted.length > 0

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-warm-900">
            {getGreeting()}, {profile?.display_name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm text-warm-400 mt-0.5">Here&apos;s what needs attention</p>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-lg text-warm-400 hover:text-warm-600 hover:bg-warm-100 transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-400" size={28} />
        </div>
      ) : !hasTasks ? (
        <EmptyState
          icon={<ListTodo size={24} />}
          title="No tasks yet"
          description="Create your first list and start adding tasks to get organized."
          action={
            <button
              onClick={() => navigate('/lists')}
              className="mt-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Go to Lists
            </button>
          }
        />
      ) : (
        <>
          {/* Critical / High Priority */}
          <TaskSection title="Needs Attention" count={criticalTasks.length} accent="#c44d4d">
            {criticalTasks.map((task) => (
              <TaskCard key={task.id} task={task} members={members} onToggleComplete={handleToggle} />
            ))}
          </TaskSection>

          {/* Overdue */}
          <TaskSection title="Overdue" count={overdueTasks.length} accent="#c44d4d">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} members={members} onToggleComplete={handleToggle} />
            ))}
          </TaskSection>

          {/* Today */}
          <TaskSection title="Today" count={todayTasks.length} accent="#a67434">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} members={members} onToggleComplete={handleToggle} />
            ))}
          </TaskSection>

          {/* Workload Balance */}
          {workloadBalance.length > 0 && (
            <Card className="mb-4">
              <h3 className="text-sm font-semibold text-warm-700 mb-3">Workload Balance</h3>
              <WorkloadBalance workload={workloadBalance} members={members} />
            </Card>
          )}

          {/* Upcoming */}
          <TaskSection title="Upcoming This Week" count={upcomingTasks.length} accent="#6b8f6b">
            {upcomingTasks.map((task) => (
              <TaskCard key={task.id} task={task} members={members} onToggleComplete={handleToggle} />
            ))}
          </TaskSection>

          {/* Recently Completed */}
          <TaskSection title="Recently Completed" count={recentlyCompleted.length} defaultOpen={false}>
            {recentlyCompleted.map((task) => (
              <TaskCard key={task.id} task={task} members={members} compact />
            ))}
          </TaskSection>
        </>
      )}
    </div>
  )
}

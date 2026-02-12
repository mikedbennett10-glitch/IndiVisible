import { useActivityLog } from '@/hooks/useActivityLog'
import { Avatar } from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityAction } from '@/types'

const actionLabels: Record<ActivityAction, string> = {
  task_created: 'created this task',
  task_updated: 'updated this task',
  task_completed: 'completed this task',
  task_uncompleted: 'reopened this task',
  task_deleted: 'deleted a task',
  task_assigned: 'assigned this task',
  task_unassigned: 'unassigned this task',
  list_created: 'created a list',
  list_updated: 'updated a list',
  list_deleted: 'deleted a list',
  member_joined: 'joined the household',
  member_left: 'left the household',
}

export function ActivityTimeline({ taskId }: { taskId: string }) {
  const { activities, loading } = useActivityLog({ taskId, limit: 15 })

  if (loading) return null
  if (activities.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-warm-700">Activity</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-2.5">
            <Avatar
              name={activity.profiles?.display_name ?? 'User'}
              color={activity.profiles?.avatar_color ?? '#8c8178'}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-warm-600">
                <span className="font-medium">{activity.profiles?.display_name ?? 'Someone'}</span>{' '}
                {actionLabels[activity.action]}
              </p>
              <p className="text-[11px] text-warm-400 mt-0.5">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

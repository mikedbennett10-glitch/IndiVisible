import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/types'

interface WorkloadBalanceProps {
  workload: { userId: string; count: number }[]
  members: Profile[]
}

export function WorkloadBalance({ workload, members }: WorkloadBalanceProps) {
  const total = workload.reduce((sum, w) => sum + w.count, 0)
  if (total === 0) return null

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const memberWork = workload.find((w) => w.userId === member.id)
        const count = memberWork?.count ?? 0
        const percentage = total > 0 ? (count / total) * 100 : 0

        return (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar name={member.display_name} color={member.avatar_color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-warm-700 truncate">
                  {member.display_name}
                </span>
                <span className="text-xs text-warm-500 ml-2">
                  {count} task{count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: member.avatar_color,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

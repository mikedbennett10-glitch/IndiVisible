import type { Database } from './database.types'

// Row types (what you get from SELECT)
export type Household = Database['public']['Tables']['households']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Subtask = Database['public']['Tables']['subtasks']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']

// Insert types
export type HouseholdInsert = Database['public']['Tables']['households']['Insert']
export type ListInsert = Database['public']['Tables']['lists']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']
export type ActivityLogInsert = Database['public']['Tables']['activity_log']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ListUpdate = Database['public']['Tables']['lists']['Update']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Enums
export type TaskPriority = Database['public']['Enums']['task_priority']
export type TaskUrgency = Database['public']['Enums']['task_urgency']
export type TaskStatus = Database['public']['Enums']['task_status']
export type ReminderType = Database['public']['Enums']['reminder_type']
export type ActivityAction = Database['public']['Enums']['activity_action']

// Re-export
export type { Database } from './database.types'
export type { Json } from './database.types'

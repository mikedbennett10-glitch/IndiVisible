export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_color: string
          household_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string
          avatar_color?: string
          household_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_color?: string
          household_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          id: string
          household_id: string
          name: string
          icon: string
          color: string
          sort_order: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          icon?: string
          color?: string
          sort_order?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          icon?: string
          color?: string
          sort_order?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          urgency: Database["public"]["Enums"]["task_urgency"]
          status: Database["public"]["Enums"]["task_status"]
          due_date: string | null
          due_time: string | null
          assigned_to: string | null
          shared_responsibility: boolean
          recurrence_rule: string | null
          sort_order: number
          location_name: string | null
          location_lat: number | null
          location_lng: number | null
          location_radius_m: number | null
          created_by: string
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          urgency?: Database["public"]["Enums"]["task_urgency"]
          status?: Database["public"]["Enums"]["task_status"]
          due_date?: string | null
          due_time?: string | null
          assigned_to?: string | null
          shared_responsibility?: boolean
          recurrence_rule?: string | null
          sort_order?: number
          location_name?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_radius_m?: number | null
          created_by: string
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          urgency?: Database["public"]["Enums"]["task_urgency"]
          status?: Database["public"]["Enums"]["task_status"]
          due_date?: string | null
          due_time?: string | null
          assigned_to?: string | null
          shared_responsibility?: boolean
          recurrence_rule?: string | null
          sort_order?: number
          location_name?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_radius_m?: number | null
          created_by?: string
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          id: string
          task_id: string
          user_id: string
          remind_at: string
          type: Database["public"]["Enums"]["reminder_type"]
          sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          remind_at: string
          type?: Database["public"]["Enums"]["reminder_type"]
          sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          remind_at?: string
          type?: Database["public"]["Enums"]["reminder_type"]
          sent?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          id: string
          household_id: string
          task_id: string | null
          list_id: string | null
          user_id: string
          action: Database["public"]["Enums"]["activity_action"]
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          task_id?: string | null
          list_id?: string | null
          user_id: string
          action: Database["public"]["Enums"]["activity_action"]
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          task_id?: string | null
          list_id?: string | null
          user_id?: string
          action?: Database["public"]["Enums"]["activity_action"]
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_household_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      task_priority: "none" | "low" | "medium" | "high" | "critical"
      task_urgency: "none" | "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed"
      reminder_type: "push" | "email" | "in_app"
      activity_action:
        | "task_created"
        | "task_updated"
        | "task_completed"
        | "task_uncompleted"
        | "task_deleted"
        | "task_assigned"
        | "task_unassigned"
        | "list_created"
        | "list_updated"
        | "list_deleted"
        | "member_joined"
        | "member_left"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      user_preferences: {
        Row: { id: string; theme: string; timezone: string; email_notifications: boolean; accent_color: string; strict_mode: boolean; ai_insights: boolean; sidebar_collapsed: boolean; dashboard_layout: string; language: string; pomodoro_duration: number; short_break_duration: number; long_break_duration: number; work_start_time: string; work_end_time: string; auto_reflow: boolean; created_at: string; updated_at: string }
        Insert: { id: string; theme?: string; timezone?: string; email_notifications?: boolean; accent_color?: string; strict_mode?: boolean; ai_insights?: boolean; sidebar_collapsed?: boolean; dashboard_layout?: string; language?: string; pomodoro_duration?: number; short_break_duration?: number; long_break_duration?: number; work_start_time?: string; work_end_time?: string; auto_reflow?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; theme?: string; timezone?: string; email_notifications?: boolean; accent_color?: string; strict_mode?: boolean; ai_insights?: boolean; sidebar_collapsed?: boolean; dashboard_layout?: string; language?: string; pomodoro_duration?: number; short_break_duration?: number; long_break_duration?: number; work_start_time?: string; work_end_time?: string; auto_reflow?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      categories: {
        Row: { id: string; user_id: string; name: string; color: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; color?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      tags: {
        Row: { id: string; user_id: string; name: string; color: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; color?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      projects: {
        Row: { id: string; user_id: string; category_id: string | null; name: string; description: string | null; color: string; status: 'active' | 'archived' | 'completed'; due_date: string | null; created_at: string; updated_at: string; deleted_at: string | null }
        Insert: { id?: string; user_id: string; category_id?: string | null; name: string; description?: string | null; color?: string; status?: 'active' | 'archived' | 'completed'; due_date?: string | null; created_at?: string; updated_at?: string; deleted_at?: string | null }
        Update: { id?: string; user_id?: string; category_id?: string | null; name?: string; description?: string | null; color?: string; status?: 'active' | 'archived' | 'completed'; due_date?: string | null; created_at?: string; updated_at?: string; deleted_at?: string | null }
        Relationships: []
      }
      tasks: {
        Row: { id: string; user_id: string; project_id: string | null; title: string; description: string | null; priority: 'low' | 'medium' | 'high' | 'urgent'; status: 'todo' | 'in_progress' | 'done'; due_date: string | null; is_schedule_for_today: boolean; is_urgent: boolean; is_important: boolean; estimated_time_minutes: number | null; actual_time_minutes: number; recurrence_rule: string | null; created_at: string; updated_at: string; deleted_at: string | null }
        Insert: { id?: string; user_id: string; project_id?: string | null; title: string; description?: string | null; priority?: 'low' | 'medium' | 'high' | 'urgent'; status?: 'todo' | 'in_progress' | 'done'; due_date?: string | null; is_schedule_for_today?: boolean; is_urgent?: boolean; is_important?: boolean; estimated_time_minutes?: number | null; actual_time_minutes?: number; recurrence_rule?: string | null; created_at?: string; updated_at?: string; deleted_at?: string | null }
        Update: { id?: string; user_id?: string; project_id?: string | null; title?: string; description?: string | null; priority?: 'low' | 'medium' | 'high' | 'urgent'; status?: 'todo' | 'in_progress' | 'done'; due_date?: string | null; is_schedule_for_today?: boolean; is_urgent?: boolean; is_important?: boolean; estimated_time_minutes?: number | null; actual_time_minutes?: number; recurrence_rule?: string | null; created_at?: string; updated_at?: string; deleted_at?: string | null }
        Relationships: []
      }
      task_tags: {
        Row: { task_id: string; tag_id: string }
        Insert: { task_id: string; tag_id: string }
        Update: { task_id?: string; tag_id?: string }
        Relationships: []
      }
      subtasks: {
        Row: { id: string; user_id: string; task_id: string; title: string; is_completed: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; task_id: string; title: string; is_completed?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; task_id?: string; title?: string; is_completed?: boolean; created_at?: string; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      habits: {
        Row: { id: string; user_id: string; name: string; frequency: 'daily' | 'weekly' | 'weekdays'; color: string; streak: number; recurrence_rule: string | null; created_at: string; updated_at: string; deleted_at: string | null }
        Insert: { id?: string; user_id: string; name: string; frequency?: 'daily' | 'weekly' | 'weekdays'; color?: string; streak?: number; recurrence_rule?: string | null; created_at?: string; updated_at?: string; deleted_at?: string | null }
        Update: { id?: string; user_id?: string; name?: string; frequency?: 'daily' | 'weekly' | 'weekdays'; color?: string; streak?: number; recurrence_rule?: string | null; created_at?: string; updated_at?: string; deleted_at?: string | null }
        Relationships: []
      }
      habit_completions: {
        Row: { id: string; user_id: string; habit_id: string; completed_date: string; created_at: string }
        Insert: { id?: string; user_id: string; habit_id: string; completed_date?: string; created_at?: string }
        Update: { id?: string; user_id?: string; habit_id?: string; completed_date?: string; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          }
        ]
      }
      timetable_slots: {
        Row: { id: string; user_id: string; day_of_week: number; start_time: string; end_time: string; label: string; color: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; day_of_week: number; start_time: string; end_time: string; label: string; color?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; day_of_week?: number; start_time?: string; end_time?: string; label?: string; color?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      calendar_events: {
        Row: { id: string; user_id: string; title: string; start_time: string; end_time: string; is_all_day: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; start_time: string; end_time: string; is_all_day?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; start_time?: string; end_time?: string; is_all_day?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; title: string; message: string; type: 'system' | 'reminder' | 'achievement' | 'kyro'; is_read: boolean; created_at: string }
        Insert: { id?: string; user_id: string; title: string; message: string; type?: 'system' | 'reminder' | 'achievement' | 'kyro'; is_read?: boolean; created_at?: string }
        Update: { id?: string; user_id?: string; title?: string; message?: string; type?: 'system' | 'reminder' | 'achievement' | 'kyro'; is_read?: boolean; created_at?: string }
        Relationships: []
      }
      analytics: {
        Row: { id: string; user_id: string; date: string; tasks_completed: number; habits_completed: number; focus_time_minutes: number; productivity_score: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; date?: string; tasks_completed?: number; habits_completed?: number; focus_time_minutes?: number; productivity_score?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; date?: string; tasks_completed?: number; habits_completed?: number; focus_time_minutes?: number; productivity_score?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
      focus_sessions: {
        Row: { id: string; user_id: string; task_id: string | null; duration_minutes: number; type: 'pomodoro' | 'deep_work'; created_at: string }
        Insert: { id?: string; user_id: string; task_id?: string | null; duration_minutes: number; type: 'pomodoro' | 'deep_work'; created_at?: string }
        Update: { id?: string; user_id?: string; task_id?: string | null; duration_minutes?: number; type?: 'pomodoro' | 'deep_work'; created_at?: string }
        Relationships: []
      }
      goals: {
        Row: { id: string; user_id: string; title: string; type: 'daily' | 'weekly' | 'monthly'; status: 'active' | 'completed' | 'failed'; period_start: string; period_end: string; created_at: string }
        Insert: { id?: string; user_id: string; title: string; type: 'daily' | 'weekly' | 'monthly'; status?: 'active' | 'completed' | 'failed'; period_start: string; period_end: string; created_at?: string }
        Update: { id?: string; user_id?: string; title?: string; type?: 'daily' | 'weekly' | 'monthly'; status?: 'active' | 'completed' | 'failed'; period_start?: string; period_end?: string; created_at?: string }
        Relationships: []
      }
      timeline_blocks: {
        Row: { id: string; user_id: string; type: string; block_type: string; ref_id: string | null; title: string; start_time: string; end_time: string; is_fixed: boolean; score: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; type: string; block_type: string; ref_id?: string | null; title: string; start_time: string; end_time: string; is_fixed: boolean; score?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; type?: string; block_type?: string; ref_id?: string | null; title?: string; start_time?: string; end_time?: string; is_fixed?: boolean; score?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

-- Nexora PostgreSQL Database Schema (v2.0.0 - Production Idempotent Migration)
-- Run this entire script safely in the Supabase SQL Editor (idempotent for new & existing databases)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PROFILES & PREFERENCES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'system',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  accent_color TEXT NOT NULL DEFAULT '#6366F1',
  strict_mode BOOLEAN NOT NULL DEFAULT false,
  ai_insights BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to create profile and preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TAXONOMY (Categories & Tags)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- PRODUCTIVITY CORE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  is_schedule_for_today BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE TABLE IF NOT EXISTS public.task_tags (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- HABITS & SCHEDULE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'weekdays', 'custom')),
  color TEXT NOT NULL DEFAULT '#10B981',
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, completed_date)
);

CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- FOUNDATIONS: NOTIFICATIONS, ANALYTICS & CLOUD SYNC SNAPSHOT
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'reminder', 'achievement', 'kyro')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  habits_completed INTEGER NOT NULL DEFAULT 0,
  focus_time_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Unified Cloud Sync Snapshot Table (used by src/lib/supabaseSync.ts)
CREATE TABLE IF NOT EXISTS public.user_app_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- TRIGGERS (updated_at)
-- ==========================================

DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_prefs ON public.user_preferences;
CREATE TRIGGER handle_updated_at_user_prefs BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_categories ON public.categories;
CREATE TRIGGER handle_updated_at_categories BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_tags ON public.tags;
CREATE TRIGGER handle_updated_at_tags BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_projects ON public.projects;
CREATE TRIGGER handle_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_tasks ON public.tasks;
CREATE TRIGGER handle_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_subtasks ON public.subtasks;
CREATE TRIGGER handle_updated_at_subtasks BEFORE UPDATE ON public.subtasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_habits ON public.habits;
CREATE TRIGGER handle_updated_at_habits BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_timetable ON public.timetable_slots;
CREATE TRIGGER handle_updated_at_timetable BEFORE UPDATE ON public.timetable_slots FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_calendar ON public.calendar_events;
CREATE TRIGGER handle_updated_at_calendar BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_analytics ON public.analytics;
CREATE TRIGGER handle_updated_at_analytics BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_user_app_data ON public.user_app_data;
CREATE TRIGGER handle_updated_at_user_app_data BEFORE UPDATE ON public.user_app_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_timetable_user_id ON public.timetable_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_analytics_user_id_date ON public.analytics(user_id, date);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own profile" ON public.profiles;
CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "View own prefs" ON public.user_preferences;
CREATE POLICY "View own prefs" ON public.user_preferences FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Update own prefs" ON public.user_preferences;
CREATE POLICY "Update own prefs" ON public.user_preferences FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Manage own categories" ON public.categories;
CREATE POLICY "Manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own tags" ON public.tags;
CREATE POLICY "Manage own tags" ON public.tags FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own projects" ON public.projects;
CREATE POLICY "Manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own tasks" ON public.tasks;
CREATE POLICY "Manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own task_tags" ON public.task_tags;
CREATE POLICY "Manage own task_tags" ON public.task_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Manage own subtasks" ON public.subtasks;
CREATE POLICY "Manage own subtasks" ON public.subtasks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own habits" ON public.habits;
CREATE POLICY "Manage own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own habit completions" ON public.habit_completions;
CREATE POLICY "Manage own habit completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own timetable slots" ON public.timetable_slots;
CREATE POLICY "Manage own timetable slots" ON public.timetable_slots FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own calendar events" ON public.calendar_events;
CREATE POLICY "Manage own calendar events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own notifications" ON public.notifications;
CREATE POLICY "Manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own analytics" ON public.analytics;
CREATE POLICY "Manage own analytics" ON public.analytics FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own app data" ON public.user_app_data;
CREATE POLICY "Manage own app data" ON public.user_app_data FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- PHASE 3–6 UPGRADE: MULTI-CURRENCY WALLETS, TRANSACTIONS, HYDRATION & REMINDERS
-- ==========================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_time TEXT,
  ADD COLUMN IF NOT EXISTS reminder_time TEXT,
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS enable_reminder BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.habits
  DROP CONSTRAINT IF EXISTS habits_frequency_check;
ALTER TABLE public.habits
  ADD CONSTRAINT habits_frequency_check CHECK (frequency IN ('daily', 'weekly', 'weekdays', 'custom'));
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS selected_days INTEGER[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_time_range BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_time TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS reminder_time TEXT,
  ADD COLUMN IF NOT EXISTS enable_reminder BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash',
  currency TEXT NOT NULL DEFAULT 'INR',
  opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#10B981',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  category TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  to_wallet_id TEXT,
  to_currency TEXT,
  converted_amount NUMERIC(14, 2),
  exchange_rate NUMERIC(14, 6),
  title TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hydration_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2500,
  goal_mode TEXT NOT NULL DEFAULT 'custom',
  baseline_weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 72,
  active_calories_burned INTEGER NOT NULL DEFAULT 420,
  ambient_temperature_c NUMERIC(5, 2) NOT NULL DEFAULT 23,
  caffeine_cups INTEGER NOT NULL DEFAULT 1,
  reminder_config JSONB NOT NULL DEFAULT '{"enabled": true, "startTime": "09:00", "endTime": "21:00", "intervalMinutes": 120, "activeDays": [0,1,2,3,4,5,6], "quietHoursStart": "22:30", "quietHoursEnd": "06:30", "stopWhenGoalReached": true}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  beverage_type TEXT NOT NULL DEFAULT 'water',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE TABLE IF NOT EXISTS public.committed_bills (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  due_date TIMESTAMPTZ NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'Bills',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'General',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kyro_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL DEFAULT 'boy',
  costume TEXT NOT NULL DEFAULT 'casual',
  shader_theme TEXT NOT NULL DEFAULT 'obsidian',
  voice_enabled BOOLEAN NOT NULL DEFAULT true,
  sfx_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committed_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyro_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own wallets" ON public.wallets;
CREATE POLICY "Manage own wallets" ON public.wallets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own finance transactions" ON public.finance_transactions;
CREATE POLICY "Manage own finance transactions" ON public.finance_transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own hydration settings" ON public.hydration_settings;
CREATE POLICY "Manage own hydration settings" ON public.hydration_settings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own hydration logs" ON public.hydration_logs;
CREATE POLICY "Manage own hydration logs" ON public.hydration_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own committed bills" ON public.committed_bills;
CREATE POLICY "Manage own committed bills" ON public.committed_bills FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own legacy expenses" ON public.expenses;
CREATE POLICY "Manage own legacy expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage own kyro preferences" ON public.kyro_preferences;
CREATE POLICY "Manage own kyro preferences" ON public.kyro_preferences FOR ALL USING (auth.uid() = user_id);


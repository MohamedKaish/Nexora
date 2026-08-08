-- Nexora V2 Schema Preparation

-- Timeline Blocks for Unified View
CREATE TABLE IF NOT EXISTS timeline_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('task', 'habit', 'calendar', 'kyro')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  color TEXT,
  reference_id UUID, -- References task_id, habit_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Telemetry
CREATE TABLE IF NOT EXISTS analytics_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Habit Logs (granular tracking)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status TEXT CHECK (status IN ('completed', 'skipped', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Add new columns to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS actual_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

-- Add new columns to habits
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

-- Add new columns to analytics
ALTER TABLE analytics
ADD COLUMN IF NOT EXISTS productivity_score INTEGER DEFAULT 0;

-- Create focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pomodoro', 'deep_work')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for focus_sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own focus_sessions."
    ON focus_sessions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own focus_sessions."
    ON focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own focus_sessions."
    ON focus_sessions FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own focus_sessions."
    ON focus_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own goals."
    ON goals FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals."
    ON goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals."
    ON goals FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals."
    ON goals FOR DELETE
    USING (auth.uid() = user_id);

-- Idempotent RLS Enforcement for Sprint 1.1

DO $$
DECLARE
    tbl text;
BEGIN
    -- Tables with 'user_id' column
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'tasks', 'projects', 'habits', 'habit_logs', 'timeline_blocks', 
            'analytics', 'notifications', 'user_preferences', 'focus_sessions', 
            'goals', 'subtasks', 'categories', 'tags',
            'timetable_slots', 'calendar_events'
        ])
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Create Policy if not exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = tbl || '_user_isolation'
        ) THEN
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (auth.uid() = user_id);', tbl || '_user_isolation', tbl);
        END IF;
    END LOOP;

    -- Special case for task_tags (no user_id, joins on tasks)
    EXECUTE 'ALTER TABLE IF EXISTS task_tags ENABLE ROW LEVEL SECURITY;';
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'task_tags' AND policyname = 'task_tags_user_isolation'
    ) THEN
        EXECUTE 'CREATE POLICY task_tags_user_isolation ON task_tags FOR ALL USING (
            EXISTS (
                SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
            )
        );';
    END IF;

END $$;

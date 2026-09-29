-- Hardening RLS Policies to explicitly separate SELECT, INSERT, UPDATE, DELETE 
-- and to use WITH CHECK on mutations to prevent user_id spoofing.

DO $$
DECLARE
    tbl text;
BEGIN
    -- Tables with 'user_id' column
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'tasks', 'projects', 'habits', 'habit_completions', 'timeline_blocks', 
            'analytics', 'notifications', 'focus_sessions', 
            'goals', 'subtasks', 'categories', 'tags',
            'timetable_slots', 'calendar_events'
        ])
    LOOP
        -- Enable RLS (just to be sure)
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Drop the old overly broad ALL policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', tbl || '_user_isolation', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own data in %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert own data in %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update own data in %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete own data in %I" ON %I;', tbl, tbl);
        
        -- Re-create explicit policies
        EXECUTE format('CREATE POLICY "select_own_%I" ON %I FOR SELECT USING (auth.uid() = user_id);', tbl, tbl);
        EXECUTE format('CREATE POLICY "insert_own_%I" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id);', tbl, tbl);
        EXECUTE format('CREATE POLICY "update_own_%I" ON %I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);', tbl, tbl);
        EXECUTE format('CREATE POLICY "delete_own_%I" ON %I FOR DELETE USING (auth.uid() = user_id);', tbl, tbl);

    END LOOP;

    -- Special case for task_tags (no user_id, joins on tasks)
    EXECUTE 'DROP POLICY IF EXISTS task_tags_user_isolation ON task_tags;';
    
    EXECUTE 'CREATE POLICY "select_own_task_tags" ON task_tags FOR SELECT USING (
        EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
    );';
    EXECUTE 'CREATE POLICY "insert_own_task_tags" ON task_tags FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
    );';
    EXECUTE 'CREATE POLICY "update_own_task_tags" ON task_tags FOR UPDATE USING (
        EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
    );';
    EXECUTE 'CREATE POLICY "delete_own_task_tags" ON task_tags FOR DELETE USING (
        EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
    );';

    -- Special case for user_preferences (uses id instead of user_id)
    EXECUTE 'ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;';
    EXECUTE 'DROP POLICY IF EXISTS user_preferences_user_isolation ON user_preferences;';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own data in user_preferences" ON user_preferences;';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own data in user_preferences" ON user_preferences;';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own data in user_preferences" ON user_preferences;';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own data in user_preferences" ON user_preferences;';
    
    EXECUTE 'CREATE POLICY "select_own_user_preferences" ON user_preferences FOR SELECT USING (auth.uid() = id);';
    EXECUTE 'CREATE POLICY "insert_own_user_preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = id);';
    EXECUTE 'CREATE POLICY "update_own_user_preferences" ON user_preferences FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);';
    EXECUTE 'CREATE POLICY "delete_own_user_preferences" ON user_preferences FOR DELETE USING (auth.uid() = id);';

END $$;

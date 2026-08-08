-- Fix RLS policies for user_preferences
-- The user_preferences table uses 'id' instead of 'user_id' for the user identifier.

DROP POLICY IF EXISTS "Users can view own data in user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own data in user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own data in user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own data in user_preferences" ON user_preferences;

CREATE POLICY "Users can view own data in user_preferences" 
ON user_preferences FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data in user_preferences" 
ON user_preferences FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data in user_preferences" 
ON user_preferences FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own data in user_preferences" 
ON user_preferences FOR DELETE USING (auth.uid() = id);

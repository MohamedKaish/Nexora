-- Migration to add new preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS sidebar_collapsed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dashboard_layout TEXT DEFAULT 'grid',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

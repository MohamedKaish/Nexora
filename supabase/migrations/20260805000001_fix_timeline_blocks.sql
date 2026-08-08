-- Fix timeline_blocks schema to match codebase

ALTER TABLE timeline_blocks
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='timeline_blocks' AND column_name='ref_id') THEN
    ALTER TABLE timeline_blocks RENAME COLUMN reference_id TO ref_id;
  END IF;
END $$;

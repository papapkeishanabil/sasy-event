-- Migration: Add Invitation Tracking Columns (Safe Version)
-- Run this in Supabase SQL Editor
-- Date: 2026-04-09

-- Step 1: Add invitation_sent column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests'
    AND column_name = 'invitation_sent'
  ) THEN
    ALTER TABLE guests ADD COLUMN invitation_sent BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Step 2: Add invitation_sent_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guests'
    AND column_name = 'invitation_sent_time'
  ) THEN
    ALTER TABLE guests ADD COLUMN invitation_sent_time TIMESTAMPTZ;
  END IF;
END $$;

-- Step 3: Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guests'
AND column_name IN ('invitation_sent', 'invitation_sent_time');

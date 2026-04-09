-- Migration helper: Just the invitation tracking columns
-- Run this in Supabase SQL Editor

-- Method 1: Simple ALTER TABLE
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS invitation_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE guests
ADD COLUMN IF NOT EXISTS invitation_sent_time TIMESTAMPTZ;

-- Method 2: With DO blocks (safer)
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

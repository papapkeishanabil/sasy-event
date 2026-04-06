-- Create categories table for dynamic guest category management
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT 'cat_' || gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#8B7355', -- Default mocca color
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, color, display_order) VALUES
  ('VIP', 'Very Important Person', '#D4AF37', 1),
  ('Regular', 'Regular Guest', '#8B7355', 2),
  ('Media', 'Media/Press', '#2C3E50', 3),
  ('Speaker', 'Event Speaker', '#E74C3C', 4),
  ('Owner', 'Event Owner', '#9B59B6', 5)
ON CONFLICT (name) DO NOTHING;

-- Enable real-time for categories
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- Update guests table to allow any category (remove check constraint)
-- First, let's check if the constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'guests_category_check'
  ) THEN
    ALTER TABLE guests DROP CONSTRAINT guests_category_check;
  END IF;
END $$;

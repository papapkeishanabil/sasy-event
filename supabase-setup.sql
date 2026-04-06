-- ============================================
-- Supabase Setup for SASIE REGIST
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('VIP', 'Regular', 'Media', 'Speaker', 'Owner')),
  status TEXT NOT NULL DEFAULT 'not_checked_in' CHECK (status IN ('not_checked_in', 'checked_in')),
  check_in_time TIMESTAMPTZ,
  email TEXT,
  phone TEXT,
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
  rsvp_response_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_category ON guests(category);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);

-- ============================================
-- CHECK-IN HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS check_ins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  guest_id BIGINT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for history queries
CREATE INDEX IF NOT EXISTS idx_check_ins_timestamp ON check_ins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_guest_id ON check_ins(guest_id);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default event
INSERT INTO events (id, title, description, date, time, location, location_lat, location_lng, location_address)
VALUES (
  'default',
  'SASIENALA x WARDAH',
  'Kami dengan hangat mengundang Anda untuk meluncurkan kolaborasi istimewa bersama Waradah',
  'Minggu, 14 April 2024',
  '10:00 - 15:00 WIB',
  'Sasie Nala Boutique',
  -6.2088,
  106.8456,
  'Jl. Kemang Raya No. 123, Jakarta Selatan'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ENABLE REAL-TIME
-- ============================================
-- Enable real-time for guests table
ALTER PUBLICATION supabase_realtime ADD TABLE guests;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================
-- For now, disable RLS to allow public access
-- You can enable this later when implementing authentication
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTION TO UPDATE UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for guests table
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
-- Uncomment to insert sample guests
-- INSERT INTO guests (id, name, category, status) VALUES
--   (1, 'Deny', 'VIP', 'not_checked_in'),
--   (2, 'Sarah Wijaya', 'VIP', 'not_checked_in'),
--   (3, 'Budi Santoso', 'Regular', 'not_checked_in'),
--   (4, 'Citra Lestari', 'VIP', 'not_checked_in'),
--   (5, 'Ahmad Rahman', 'Media', 'not_checked_in')
-- ON CONFLICT (id) DO NOTHING;

-- Migration: Create device_state table for screen persistence
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS device_state (
  device_id TEXT PRIMARY KEY,
  current_screen TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_device_state_updated ON device_state(updated_at);

-- Clean up old device states (older than 7 days)
-- DELETE FROM device_state WHERE updated_at < NOW() - INTERVAL '7 days';
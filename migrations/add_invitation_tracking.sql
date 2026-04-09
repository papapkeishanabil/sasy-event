-- Migration: Add Invitation Tracking Columns
-- Description: Add columns to track when invitations have been sent to guests
-- Date: 2026-04-09
-- Author: Claude Code

-- Add invitation tracking columns to guests table
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS invitation_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invitation_sent_time TIMESTAMPTZ;

-- Add index for faster filtering by invitation status
CREATE INDEX IF NOT EXISTS idx_invitation_sent ON guests(invitation_sent);

-- Add comment for documentation
COMMENT ON COLUMN guests.invitation_sent IS 'Whether the invitation has been sent to this guest (via WhatsApp, email, etc.)';
COMMENT ON COLUMN guests.invitation_sent_time IS 'Timestamp when the invitation was sent to this guest';

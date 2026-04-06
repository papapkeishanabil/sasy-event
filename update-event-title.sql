-- Update event title to enable "Color Of Us" Dancing Script font
-- Run this in Supabase SQL Editor

UPDATE events
SET title = 'Sasienala: Color Of Us'
WHERE id = 'default';

-- Verify the update
SELECT * FROM events WHERE id = 'default';

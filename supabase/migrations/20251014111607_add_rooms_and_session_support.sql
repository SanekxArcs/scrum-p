/*
  # Add Rooms and Session Management
  
  1. Schema Changes
    - Add `rooms` table
      - `id` (uuid, primary key)
      - `name` (text) - room name
      - `password` (text, nullable) - optional password for private rooms
      - `is_private` (boolean) - whether room is private
      - `creator_id` (uuid) - participant who created the room
      - `last_activity_at` (timestamptz) - for cleanup
      - `created_at` (timestamptz)
    
    - Update `participants` table
      - Add `room_id` (uuid) - reference to rooms
      - Add `session_token` (text) - for cookie-based sessions
      - Add `last_seen_at` (timestamptz) - for activity tracking
    
    - Update `votes` table
      - Add `room_id` (uuid) - reference to rooms
    
    - Update `room_state` table
      - Add `room_id` (uuid) - reference to rooms
  
  2. Notes
    - Rooms are automatically cleaned up after 30 minutes of inactivity
    - Session tokens allow users to rejoin rooms
    - Default room is created for backwards compatibility
  
  3. Security
    - Enable RLS on rooms table
    - Public read access for room list
    - Anyone can create rooms
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  password text,
  is_private boolean DEFAULT false,
  creator_id uuid,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete rooms"
  ON rooms FOR DELETE
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN room_id uuid REFERENCES rooms(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'session_token'
  ) THEN
    ALTER TABLE participants ADD COLUMN session_token text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'last_seen_at'
  ) THEN
    ALTER TABLE participants ADD COLUMN last_seen_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE votes ADD COLUMN room_id uuid REFERENCES rooms(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'room_state' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE room_state ADD COLUMN room_id uuid REFERENCES rooms(id) ON DELETE CASCADE;
  END IF;
END $$;

INSERT INTO rooms (id, name, is_private, last_activity_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Room', false, now())
ON CONFLICT (id) DO NOTHING;

UPDATE room_state
SET room_id = '00000000-0000-0000-0000-000000000001'
WHERE room_id IS NULL;

UPDATE participants
SET room_id = '00000000-0000-0000-0000-000000000001'
WHERE room_id IS NULL;

UPDATE votes
SET room_id = '00000000-0000-0000-0000-000000000001'
WHERE room_id IS NULL;
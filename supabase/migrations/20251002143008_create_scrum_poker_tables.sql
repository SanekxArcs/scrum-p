/*
  # Scrum Poker Tables

  1. New Tables
    - `participants`
      - `id` (uuid, primary key)
      - `name` (text) - participant's name
      - `role` (text) - one of: 'front-end', 'back-end', 'QA', 'PM'
      - `is_online` (boolean) - connection status
      - `created_at` (timestamptz)
      
    - `votes`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, foreign key to participants)
      - `round_number` (integer) - current round identifier
      - `points` (integer) - voted story points
      - `created_at` (timestamptz)
      
    - `room_state`
      - `id` (uuid, primary key)
      - `current_round` (integer) - current round number
      - `is_revealed` (boolean) - whether votes are shown
      - `fe_multiplier` (numeric) - front-end role multiplier
      - `be_multiplier` (numeric) - back-end role multiplier
      - `qa_multiplier` (numeric) - QA role multiplier
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow public read/write access (single room for team use)
*/

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('front-end', 'back-end', 'QA', 'PM')),
  is_online boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  points integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_id, round_number)
);

CREATE TABLE IF NOT EXISTS room_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_round integer DEFAULT 1,
  is_revealed boolean DEFAULT false,
  fe_multiplier numeric DEFAULT 1.0,
  be_multiplier numeric DEFAULT 1.0,
  qa_multiplier numeric DEFAULT 1.0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read participants"
  ON participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert participants"
  ON participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON participants FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete participants"
  ON participants FOR DELETE
  USING (true);

CREATE POLICY "Anyone can read votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update votes"
  ON votes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete votes"
  ON votes FOR DELETE
  USING (true);

CREATE POLICY "Anyone can read room state"
  ON room_state FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert room state"
  ON room_state FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update room state"
  ON room_state FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete room state"
  ON room_state FOR DELETE
  USING (true);

INSERT INTO room_state (current_round, is_revealed, fe_multiplier, be_multiplier, qa_multiplier)
VALUES (1, false, 1.0, 1.0, 1.0)
ON CONFLICT DO NOTHING;
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'front-end' | 'back-end' | 'QA' | 'PM';

export interface Room {
  id: string;
  name: string;
  password: string | null;
  is_private: boolean;
  creator_id: string | null;
  last_activity_at: string;
  created_at: string;
}

export interface Participant {
  id: string;
  name: string;
  role: Role;
  is_online: boolean;
  room_id: string;
  session_token: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface Vote {
  id: string;
  participant_id: string;
  room_id: string;
  round_number: number;
  points: number;
  created_at: string;
}

export interface RoomState {
  id: string;
  room_id: string;
  current_round: number;
  is_revealed: boolean;
  fe_multiplier: number;
  be_multiplier: number;
  qa_multiplier: number;
  updated_at: string;
}

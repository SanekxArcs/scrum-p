import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'front-end' | 'back-end' | 'QA' | 'PM';

export interface Participant {
  id: string;
  name: string;
  role: Role;
  is_online: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  participant_id: string;
  round_number: number;
  points: number;
  created_at: string;
}

export interface RoomState {
  id: string;
  current_round: number;
  is_revealed: boolean;
  fe_multiplier: number;
  be_multiplier: number;
  qa_multiplier: number;
  updated_at: string;
}

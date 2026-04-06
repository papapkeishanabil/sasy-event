import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Create a dummy client that does nothing if Supabase is not configured
const dummyClient = {
  from: () => ({
    select: () => ({ data: null, error: 'Not configured' }),
    insert: () => ({ error: 'Not configured' }),
    update: () => ({ error: 'Not configured' }),
    delete: () => ({ error: 'Not configured' }),
    upsert: () => ({ error: 'Not configured' }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({}) }),
  }),
  removeChannel: () => {},
};

export const supabase = supabaseClient || dummyClient;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseClient);
};

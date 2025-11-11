// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmbfsplimbwnycaawhta.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYmZzcGxpbWJ3bnljYWF3aHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjY2NTMsImV4cCI6MjA3Nzc0MjY1M30.x32wIbTOCP-5trobejkQKdowQL0U3hGlyge5lMQb2nM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
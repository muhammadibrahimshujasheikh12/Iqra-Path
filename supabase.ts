
/**
 * SUPABASE CLIENT CONFIGURATION
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfshhxnwpqmdkfwtpgyf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmc2hoeG53cHFtZGtmd3RwZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjM1NTgsImV4cCI6MjA4NDU5OTU1OH0.q7Lt-_OI9avHcTijcaV85MisjPXCNb50oEb43XFtQOU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if the client is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && (supabaseUrl as string) !== 'https://your-project-url.supabase.co';
};

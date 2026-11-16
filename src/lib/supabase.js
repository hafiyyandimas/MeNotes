import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    !supabaseKey.includes('YOUR_PUBLISHABLE'),
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export const restClient = axios.create({
  baseURL: isSupabaseConfigured ? `${supabaseUrl}/rest/v1` : undefined,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

restClient.interceptors.request.use(async (config) => {
  if (!supabase) throw new Error('Supabase is not configured. Add the values from .env.example to .env.');
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  if (!session?.access_token) throw new Error('Could not establish an anonymous Supabase session.');
  config.headers.set('apikey', supabaseKey);
  config.headers.set('Authorization', `Bearer ${session.access_token}`);
  return config;
});

export function getSetupMessage() {
  return 'Supabase is not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable cloud sync. Notes will still be saved on this device.';
}

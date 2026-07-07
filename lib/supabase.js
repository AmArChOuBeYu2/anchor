import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Create a Supabase client for browser-side use.
 * This uses the public anon key and is safe to expose in the browser.
 */
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return supabaseCreateClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Create a Supabase client for server-side use (API routes, server components).
 * In a no-auth setup this is functionally identical to the browser client,
 * but kept as a separate export so we can swap in a service-role key later.
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return supabaseCreateClient(supabaseUrl, supabaseAnonKey);
}

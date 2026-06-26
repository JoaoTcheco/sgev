// This file is auto-generated for Lovable Cloud. The PharmaSys desktop build
// extends it to swap to a local SQLite-backed client when running inside
// Electron (window.pharmaDB present). In the cloud preview the original
// Supabase client is used unchanged.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabase as localClient } from '@/integrations/local-db/client';

function isElectron(): boolean {
  return typeof window !== 'undefined'
    && (window as unknown as { pharmaDB?: unknown }).pharmaDB != null;
}

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Proxy: in Electron, delegate every property access to the local SQLite-backed client.
// In the cloud, lazily instantiate the real Supabase client on first access.
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (isElectron()) {
      return Reflect.get(localClient as unknown as object, prop, receiver);
    }
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

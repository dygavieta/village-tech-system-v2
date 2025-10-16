/**
 * Supabase client for Platform app (client-side)
 * Used in Client Components for browser-based operations
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { Database } from '@village-tech/database-types';

export function createClient() {
  return createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        cookieOptions: {
          name: 'platform-auth-token', // Unique cookie name for platform
          domain: process.env.NODE_ENV === 'production' ? 'villagetech.app' : 'localhost',
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        },
        storageKey: 'platform-supabase-auth-token' // Unique storage key
      }
    }
  );
}

// Export with the expected name for compatibility
export function createBrowserClient() {
  return createClient();
}

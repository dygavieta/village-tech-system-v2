/**
 * Supabase client for Admin app (client-side)
 * Used in Client Components for browser-based operations
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@village-tech/database-types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        cookieOptions: {
          name: 'admin-auth-token', // Unique cookie name for admin
          domain: process.env.NODE_ENV === 'production' ? '.villagetech.app' : 'localhost',
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        },
        storageKey: 'admin-supabase-auth-token' // Unique storage key
      }
    }
  );
}

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
        storageKey: 'admin-supabase-auth-token', // Unique storage key
        cookieOptions: {
          domain: process.env.NODE_ENV === 'production' ? '.admin.villagetech.app' : 'localhost',
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      }
    }
  );
}

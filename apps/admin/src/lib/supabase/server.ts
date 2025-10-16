/**
 * Supabase client for Admin app (server-side)
 * Used in Server Components, Server Actions, and Route Handlers
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@village-tech/database-types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'admin-supabase-auth-token', // Must match client and middleware configuration
        cookieOptions: {
          domain: process.env.NODE_ENV === 'production' ? '.admin.villagetech.app' : 'localhost',
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle server component cookie setting
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle server component cookie removal
          }
        },
      },
    }
  );
}

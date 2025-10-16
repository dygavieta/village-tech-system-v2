/**
 * Supabase middleware for Platform app
 * Handles session refresh and JWT token management
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@village-tech/database-types';

// Platform-specific cookie configuration
const platformCookieOptions: CookieOptions = {
  name: 'platform-auth-token', // Must match client configuration
  domain: process.env.NODE_ENV === 'production' ? 'villagetech.app' : 'localhost',
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        cookieOptions: platformCookieOptions,
        storageKey: 'platform-supabase-auth-token' // Must match client configuration
      },
      cookies: {
        get(name: string) {
          // Only look for platform-specific cookies
          if (name === 'platform-auth-token' || name.startsWith('platform-')) {
            return request.cookies.get(name)?.value;
          }
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Only set platform-specific cookies
          const cookieName = name === 'sb-access-token' ? 'platform-auth-token' : name;
          const finalOptions = name === 'sb-access-token' ? platformCookieOptions : options;

          request.cookies.set({
            name: cookieName,
            value,
            ...finalOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name: cookieName,
            value,
            ...finalOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Only remove platform-specific cookies
          const cookieName = name === 'sb-access-token' ? 'platform-auth-token' : name;
          const finalOptions = name === 'sb-access-token' ? platformCookieOptions : options;

          request.cookies.set({
            name: cookieName,
            value: '',
            ...finalOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name: cookieName,
            value: '',
            ...finalOptions,
          });
        },
      },
    }
  );

  // Refresh session and get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/auth');

  // Protected routes - all dashboard pages (using route groups)
  const protectedRoutes = ['/dashboard', '/tenants', '/analytics', '/superadmins', '/settings', '/profile'];
  const isDashboardPage = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect authenticated users away from login pages
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes - require authentication
  if (isDashboardPage && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Verify superadmin role for dashboard access
  if (isDashboardPage && user) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Parse JWT payload to access custom claims (added by custom_access_token_hook)
    const base64Payload = session.access_token.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    const userRole = payload.user_role;

    if (userRole !== 'superadmin') {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
  }

  return response;
}

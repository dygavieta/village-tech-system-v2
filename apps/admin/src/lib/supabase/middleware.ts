/**
 * Supabase middleware for Admin app
 * Handles session refresh and JWT token management
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@village-tech/database-types';

// Admin-specific cookie configuration
const adminCookieOptions: CookieOptions = {
  name: 'admin-auth-token', // Must match client configuration
  domain: process.env.NODE_ENV === 'production' ? '.villagetech.app' : 'localhost',
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
        cookieOptions: adminCookieOptions,
        storageKey: 'admin-supabase-auth-token' // Must match client configuration
      },
      cookies: {
        get(name: string) {
          // Only look for admin-specific cookies
          if (name === 'admin-auth-token' || name.startsWith('admin-')) {
            return request.cookies.get(name)?.value;
          }
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Only set admin-specific cookies
          const cookieName = name === 'sb-access-token' ? 'admin-auth-token' : name;
          const finalOptions = name === 'sb-access-token' ? adminCookieOptions : options;

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
          // Only remove admin-specific cookies
          const cookieName = name === 'sb-access-token' ? 'admin-auth-token' : name;
          const finalOptions = name === 'sb-access-token' ? adminCookieOptions : options;

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

  const { data: { user }, error } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If user is not authenticated and trying to access a protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Enhanced security: Verify admin role for protected routes
  if (user && !isPublicRoute) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    // Parse JWT payload to access custom claims (added by custom_access_token_hook)
    const base64Payload = session.access_token.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
    const userRole = payload.user_role;

    // Only allow admin roles (admin_head, admin_officer) to access admin portal
    if (!['admin_head', 'admin_officer'].includes(userRole)) {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(redirectUrl);
    }

    // Reject superadmin access to admin portal
    if (userRole === 'superadmin') {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('error', 'invalid_portal');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

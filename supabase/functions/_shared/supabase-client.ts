/**
 * Supabase Client Utility for Edge Functions
 *
 * Provides utility functions to create Supabase clients for Edge Functions.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Create Supabase client with service role key
 * Use this for admin operations that bypass RLS
 */
export function createServiceRoleClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Create Supabase client with anon key (respects RLS)
 * Use this for operations that should respect row-level security
 */
export function createAnonClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Validate JWT token and extract user information
 */
export interface UserAuth {
  userId: string;
  tenantId: string;
  role: string;
  email?: string;
}

export async function validateAuth(authHeader: string | null): Promise<UserAuth> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  const client = createAnonClient();

  const { data: { user }, error } = await client.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid or expired token");
  }

  const tenantId = user.user_metadata?.tenant_id;
  const role = user.user_metadata?.role;

  if (!tenantId) {
    throw new Error("User missing tenant_id in metadata");
  }

  return {
    userId: user.id,
    tenantId,
    role: role || "unknown",
    email: user.email,
  };
}

/**
 * Subdomain Validation Utility
 *
 * Validates tenant subdomains for uniqueness, format, and reserved word conflicts.
 * Used during tenant creation to ensure valid, unique subdomains.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Reserved subdomains that cannot be used by tenants
const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'platform',
  'dashboard',
  'portal',
  'support',
  'help',
  'docs',
  'blog',
  'mail',
  'email',
  'status',
  'staging',
  'test',
  'dev',
  'demo',
  'sandbox',
  'localhost',
];

export interface SubdomainValidationResult {
  valid: boolean;
  error?: string;
  subdomain?: string;
}

/**
 * Validates subdomain format and checks for reserved words
 */
export function validateSubdomainFormat(subdomain: string): SubdomainValidationResult {
  if (!subdomain || typeof subdomain !== 'string') {
    return { valid: false, error: 'Subdomain is required' };
  }

  // Convert to lowercase and trim
  const cleaned = subdomain.toLowerCase().trim();

  // Check length (3-63 characters as per DNS standards)
  if (cleaned.length < 3) {
    return { valid: false, error: 'Subdomain must be at least 3 characters long' };
  }

  if (cleaned.length > 63) {
    return { valid: false, error: 'Subdomain must be 63 characters or less' };
  }

  // Check format: must start and end with alphanumeric, can contain hyphens
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!subdomainRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'Subdomain must start and end with a letter or number, and can only contain letters, numbers, and hyphens',
    };
  }

  // Check for consecutive hyphens
  if (cleaned.includes('--')) {
    return { valid: false, error: 'Subdomain cannot contain consecutive hyphens' };
  }

  // Check for reserved words
  if (RESERVED_SUBDOMAINS.includes(cleaned)) {
    return { valid: false, error: `Subdomain '${cleaned}' is reserved and cannot be used` };
  }

  return { valid: true, subdomain: cleaned };
}

/**
 * Checks if subdomain is already taken in the database
 */
export async function checkSubdomainUniqueness(
  subdomain: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SubdomainValidationResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('tenants')
    .select('id, subdomain')
    .eq('subdomain', subdomain.toLowerCase())
    .maybeSingle();

  if (error) {
    return { valid: false, error: `Database error: ${error.message}` };
  }

  if (data) {
    return { valid: false, error: `Subdomain '${subdomain}' is already taken` };
  }

  return { valid: true, subdomain: subdomain.toLowerCase() };
}

/**
 * Complete subdomain validation: format + uniqueness
 */
export async function validateSubdomain(
  subdomain: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SubdomainValidationResult> {
  // First check format
  const formatCheck = validateSubdomainFormat(subdomain);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // Then check uniqueness
  return await checkSubdomainUniqueness(formatCheck.subdomain!, supabaseUrl, supabaseKey);
}

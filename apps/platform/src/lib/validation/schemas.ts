/**
 * Platform App - Centralized Validation Schemas (T046)
 *
 * Zod schemas for validating tenant creation, property import, and other forms.
 * These schemas ensure type-safe validation across all Platform app forms.
 */

import { z } from 'zod';

// ============================================================================
// Tenant Creation & Management
// ============================================================================

/**
 * Subdomain validation rules:
 * - 3-63 characters
 * - Lowercase letters, numbers, and hyphens only
 * - Must start and end with alphanumeric character
 * - Cannot contain consecutive hyphens
 */
export const subdomainSchema = z.string()
  .min(3, 'Subdomain must be at least 3 characters')
  .max(63, 'Subdomain must be 63 characters or less')
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    'Subdomain must start and end with alphanumeric characters and can only contain lowercase letters, numbers, and hyphens'
  )
  .refine(
    (val) => !val.includes('--'),
    'Subdomain cannot contain consecutive hyphens'
  );

/**
 * Tenant basic information schema
 */
export const tenantBasicInfoSchema = z.object({
  name: z.string()
    .min(3, 'Tenant name must be at least 3 characters')
    .max(100, 'Tenant name must be 100 characters or less'),
  legal_name: z.string()
    .max(200, 'Legal name must be 200 characters or less')
    .optional(),
  subdomain: subdomainSchema,
  community_type: z.enum(['HOA', 'Condo', 'Gated Village', 'Subdivision'], {
    errorMap: () => ({ message: 'Please select a valid community type' }),
  }),
  year_established: z.number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional()
    .or(z.literal('')),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
});

/**
 * Subscription limits schema
 */
export const subscriptionLimitsSchema = z.object({
  max_residences: z.number()
    .int('Must be a whole number')
    .min(1, 'Must have at least 1 residence')
    .max(10000, 'Maximum 10,000 residences per tenant'),
  max_admin_users: z.number()
    .int('Must be a whole number')
    .min(1, 'Must have at least 1 admin user')
    .max(100, 'Maximum 100 admin users'),
  max_security_users: z.number()
    .int('Must be a whole number')
    .min(1, 'Must have at least 1 security user')
    .max(500, 'Maximum 500 security users'),
  storage_quota_gb: z.number()
    .int('Must be a whole number')
    .min(1, 'Minimum 1 GB storage')
    .max(1000, 'Maximum 1000 GB storage'),
});

/**
 * Complete tenant creation schema
 */
export const tenantCreationSchema = tenantBasicInfoSchema.merge(subscriptionLimitsSchema);

/**
 * Tenant update schema (all fields optional except ID)
 */
export const tenantUpdateSchema = z.object({
  id: z.string().uuid('Invalid tenant ID'),
  name: z.string().min(3).max(100).optional(),
  legal_name: z.string().max(200).optional(),
  community_type: z.enum(['HOA', 'Condo', 'Gated Village', 'Subdivision']).optional(),
  year_established: z.number().min(1900).max(new Date().getFullYear()).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  max_residences: z.number().int().min(1).max(10000).optional(),
  max_admin_users: z.number().int().min(1).max(100).optional(),
  max_security_users: z.number().int().min(1).max(500).optional(),
  storage_quota_gb: z.number().int().min(1).max(1000).optional(),
});

// ============================================================================
// Property Import
// ============================================================================

/**
 * Individual property schema for CSV import validation
 */
export const propertySchema = z.object({
  address: z.string()
    .min(3, 'Address must be at least 3 characters')
    .max(200, 'Address must be 200 characters or less'),
  phase: z.string().max(50).optional(),
  block: z.string().max(50).optional(),
  lot: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
  property_type: z.enum(['single_family', 'townhouse', 'condo', 'lot_only'], {
    errorMap: () => ({ message: 'Invalid property type' }),
  }),
  property_size_sqm: z.number().positive('Size must be positive').optional(),
  lot_size_sqm: z.number().positive('Size must be positive').optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  parking_slots: z.number().int().min(0).max(10).default(0),
  gps_lat: z.number().min(-90).max(90).optional(),
  gps_lng: z.number().min(-180).max(180).optional(),
});

/**
 * Property import batch schema (array of properties)
 */
export const propertyImportSchema = z.object({
  properties: z.array(propertySchema)
    .min(1, 'Must import at least 1 property')
    .max(1000, 'Maximum 1000 properties per import batch'),
  tenant_id: z.string().uuid('Invalid tenant ID'),
});

/**
 * CSV row schema for property import (all fields as strings before parsing)
 */
export const propertyCSVRowSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  phase: z.string().optional(),
  block: z.string().optional(),
  lot: z.string().optional(),
  unit: z.string().optional(),
  property_type: z.string().refine(
    (val) => ['single_family', 'townhouse', 'condo', 'lot_only'].includes(val),
    'Invalid property type'
  ),
  property_size_sqm: z.string().optional(),
  lot_size_sqm: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  parking_slots: z.string().optional(),
  gps_lat: z.string().optional(),
  gps_lng: z.string().optional(),
});

// ============================================================================
// Gate Configuration
// ============================================================================

/**
 * Gate configuration schema
 */
export const gateConfigSchema = z.object({
  name: z.string()
    .min(2, 'Gate name must be at least 2 characters')
    .max(50, 'Gate name must be 50 characters or less'),
  gate_type: z.enum(['primary', 'secondary', 'service', 'emergency'], {
    errorMap: () => ({ message: 'Please select a valid gate type' }),
  }),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  operating_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  operating_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  gps_lat: z.number().min(-90).max(90).optional(),
  gps_lng: z.number().min(-180).max(180).optional(),
  rfid_reader_serial: z.string()
    .min(5, 'Serial must be at least 5 characters')
    .max(50, 'Serial must be 50 characters or less')
    .optional(),
});

/**
 * Gate batch creation schema
 */
export const gatesBatchSchema = z.object({
  gates: z.array(gateConfigSchema)
    .min(1, 'Must configure at least 1 gate')
    .max(20, 'Maximum 20 gates per tenant'),
  tenant_id: z.string().uuid('Invalid tenant ID'),
});

// ============================================================================
// Admin User Setup
// ============================================================================

/**
 * Admin user creation schema
 */
export const adminUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less'),
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be 50 characters or less'),
  middle_name: z.string()
    .max(50, 'Middle name must be 50 characters or less')
    .optional(),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be 50 characters or less'),
  phone_number: z.string()
    .regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be 20 characters or less')
    .optional(),
  position: z.string()
    .max(100, 'Position must be 100 characters or less')
    .optional(),
  role: z.enum(['admin_head', 'admin_officer']).default('admin_head'),
});

// ============================================================================
// Branding Configuration
// ============================================================================

/**
 * Hex color validation
 */
const hexColorSchema = z.string().regex(
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  'Invalid hex color format (e.g., #FF5733)'
);

/**
 * Tenant branding schema
 */
export const brandingConfigSchema = z.object({
  tenant_id: z.string().uuid('Invalid tenant ID'),
  primary_color: hexColorSchema,
  secondary_color: hexColorSchema.optional(),
  logo_url: z.string().url('Invalid logo URL').optional(),
  favicon_url: z.string().url('Invalid favicon URL').optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type TenantBasicInfo = z.infer<typeof tenantBasicInfoSchema>;
export type SubscriptionLimits = z.infer<typeof subscriptionLimitsSchema>;
export type TenantCreation = z.infer<typeof tenantCreationSchema>;
export type TenantUpdate = z.infer<typeof tenantUpdateSchema>;
export type Property = z.infer<typeof propertySchema>;
export type PropertyImport = z.infer<typeof propertyImportSchema>;
export type PropertyCSVRow = z.infer<typeof propertyCSVRowSchema>;
export type GateConfig = z.infer<typeof gateConfigSchema>;
export type GatesBatch = z.infer<typeof gatesBatchSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type BrandingConfig = z.infer<typeof brandingConfigSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safely validate data against a schema and return errors
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Validate CSV import data and return detailed error report
 */
export function validateCSVImport(
  rows: unknown[]
): { valid: unknown[]; invalid: Array<{ row: number; data: unknown; errors: Record<string, string> }> } {
  const valid: unknown[] = [];
  const invalid: Array<{ row: number; data: unknown; errors: Record<string, string> }> = [];

  rows.forEach((row, index) => {
    const result = validateWithErrors(propertyCSVRowSchema, row);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        row: index + 1,
        data: row,
        errors: result.errors,
      });
    }
  });

  return { valid, invalid };
}

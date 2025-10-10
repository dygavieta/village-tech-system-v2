/**
 * Zod validation schemas for Platform app
 * Input validation for forms and API requests
 */

import { z } from 'zod';

// Tenant creation schema
export const createTenantSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  legal_name: z.string().optional(),
  subdomain: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  community_type: z.enum(['HOA', 'Condo', 'Gated Village', 'Subdivision']),
  total_residences: z.number().int().positive(),
  max_residences: z.number().int().positive(),
  max_admin_users: z.number().int().positive().default(10),
  max_security_users: z.number().int().positive().default(20),
  admin_email: z.string().email(),
  admin_name: z.string().min(2),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

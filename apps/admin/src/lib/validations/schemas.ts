/**
 * Zod validation schemas for Admin app
 * Input validation for forms and API requests
 */

import { z } from 'zod';

// Household creation schema
export const createHouseholdSchema = z.object({
  property_id: z.string().uuid(),
  household_head_email: z.string().email(),
  household_head_name: z.string().min(2),
  household_head_phone: z.string().optional(),
  move_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ownership_type: z.enum(['owner', 'renter']),
  sticker_allocation: z.number().int().positive().default(3),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

// Sticker approval schema
export const approveStickerSchema = z.object({
  sticker_id: z.string().uuid(),
  approved: z.boolean(),
  rfid_serial: z.string().optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ApproveStickerInput = z.infer<typeof approveStickerSchema>;

// Announcement creation schema
export const createAnnouncementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  urgency: z.enum(['critical', 'important', 'info']),
  category: z.enum(['event', 'maintenance', 'security', 'policy']),
  target_audience: z.enum(['all_residents', 'all_security', 'specific_households', 'all']),
  specific_household_ids: z.array(z.string().uuid()).optional(),
  effective_start: z.string().datetime().optional(),
  effective_end: z.string().datetime().optional(),
  requires_acknowledgment: z.boolean().default(false),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

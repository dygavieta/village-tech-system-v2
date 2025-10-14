/**
 * Zod validation schemas for Admin app
 * Input validation for forms and API requests
 */

import { z } from 'zod';

// Household creation schema - T179: Enhanced validation
export const createHouseholdSchema = z.object({
  property_id: z.string().uuid('Please select a valid property'),
  ownership_type: z.enum(['owner', 'renter'], {
    required_error: 'Ownership type is required',
  }),
  move_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  sticker_allocation: z
    .number({
      required_error: 'Sticker allocation is required',
      invalid_type_error: 'Must be a number',
    })
    .int('Must be a whole number')
    .min(1, 'Must allow at least 1 sticker')
    .max(10, 'Cannot exceed 10 stickers'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .min(1, 'Email is required'),
  first_name: z
    .string({ required_error: 'First name is required' })
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  middle_name: z.string().max(50, 'Middle name cannot exceed 50 characters').optional(),
  last_name: z
    .string({ required_error: 'Last name is required' })
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  phone_number: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
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

// Announcement creation schema - T179: Enhanced validation
export const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .min(20, 'Content must be at least 20 characters')
    .max(5000, 'Content cannot exceed 5000 characters'),
  urgency: z.enum(['critical', 'important', 'info'], {
    required_error: 'Urgency level is required',
  }),
  category: z.enum(['event', 'maintenance', 'security', 'policy'], {
    required_error: 'Category is required',
  }),
  target_audience: z.enum(['all_residents', 'all_security', 'specific_households', 'all'], {
    required_error: 'Target audience is required',
  }),
  specific_household_ids: z.array(z.string().uuid()).optional(),
  effective_start: z.string().datetime().optional(),
  effective_end: z.string().datetime().optional(),
  requires_acknowledgment: z.boolean().default(false),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

// Invoice generation schema - T179
export const generateInvoiceSchema = z.object({
  household_id: z.string().uuid('Please select a valid household'),
  fee_type: z.enum(['monthly', 'special', 'penalty', 'other'], {
    required_error: 'Fee type is required',
  }),
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount cannot exceed 1,000,000'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  late_fee_percentage: z
    .number()
    .min(0, 'Late fee percentage cannot be negative')
    .max(100, 'Late fee percentage cannot exceed 100%')
    .optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;

/**
 * Email Service Wrapper
 *
 * Provides type-safe wrappers for calling email-related Edge Functions
 */

import { createClient } from '@/lib/supabase/client';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface HouseholdWelcomeEmailData {
  recipientName: string;
  recipientEmail: string;
  householdNumber: string;
  tenantName: string;
  portalUrl: string;
  tempPassword?: string;
}

export interface StickerApprovalEmailData {
  recipientName: string;
  recipientEmail: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
  stickerNumber: string;
  expiryDate: string;
  tenantName: string;
  portalUrl: string;
}

export interface PermitApprovalEmailData {
  recipientName: string;
  recipientEmail: string;
  permitType: string;
  permitNumber: string;
  validFrom: string;
  validUntil: string;
  tenantName: string;
  portalUrl: string;
}

export interface FeeInvoiceEmailData {
  recipientName: string;
  recipientEmail: string;
  feeType: string;
  amount: number;
  dueDate: string;
  invoiceNumber: string;
  tenantName: string;
  invoiceUrl?: string;
}

export interface PaymentReceiptEmailData {
  recipientName: string;
  recipientEmail: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  feeType: string;
  tenantName: string;
  receiptUrl?: string;
}

/**
 * Send household welcome email
 */
export async function sendHouseholdWelcomeEmail(
  data: HouseholdWelcomeEmailData
): Promise<EmailResult> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'household_welcome',
        data,
      },
    });

    if (error) {
      console.error('Failed to send household welcome email:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (error) {
    console.error('Error sending household welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send sticker approval email
 */
export async function sendStickerApprovalEmail(
  data: StickerApprovalEmailData
): Promise<EmailResult> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'sticker_approval',
        data,
      },
    });

    if (error) {
      console.error('Failed to send sticker approval email:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (error) {
    console.error('Error sending sticker approval email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send permit approval email
 */
export async function sendPermitApprovalEmail(
  data: PermitApprovalEmailData
): Promise<EmailResult> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'permit_approval',
        data,
      },
    });

    if (error) {
      console.error('Failed to send permit approval email:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (error) {
    console.error('Error sending permit approval email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send fee invoice email
 */
export async function sendFeeInvoiceEmail(
  data: FeeInvoiceEmailData
): Promise<EmailResult> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'fee_invoice',
        data,
      },
    });

    if (error) {
      console.error('Failed to send fee invoice email:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (error) {
    console.error('Error sending fee invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  data: PaymentReceiptEmailData
): Promise<EmailResult> {
  try {
    const supabase = createClient();

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'payment_receipt',
        data,
      },
    });

    if (error) {
      console.error('Failed to send payment receipt email:', error);
      return { success: false, error: error.message };
    }

    return result as EmailResult;
  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

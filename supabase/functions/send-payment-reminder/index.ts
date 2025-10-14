/**
 * Edge Function: send-payment-reminder
 * Feature: 001-residential-community-management
 * Phase: 7 - User Story 5 (Payment Reminders)
 * Task: T154c
 *
 * Sends payment reminders for overdue or upcoming association fees.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { createServiceRoleClient, validateAuth } from "../_shared/supabase-client.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";
import { sendEmail, generatePaymentReminderEmail } from "../_shared/email.ts";
import { sendSMS } from "../_shared/notification.ts";

interface SendPaymentReminderRequest {
  fee_id?: string; // Specific fee to remind about
  batch_mode?: boolean; // If true, process all overdue fees
  days_before_due?: number; // Send reminder X days before due date (for upcoming payments)
  include_sms?: boolean; // Send SMS reminders in addition to email
}

interface AssociationFee {
  id: string;
  tenant_id: string;
  household_id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  payment_status: string;
  household: {
    household_head_id: string;
    property: {
      address: string;
    };
    user_profiles: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
    };
  };
}

interface PaymentReminder {
  id: string;
  fee_id: string;
  sent_at: string;
  reminder_type: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logger = createLogger({ function: "send-payment-reminder" });

  try {
    // Validate authentication
    const authHeader = req.headers.get("authorization");
    const auth = await validateAuth(authHeader);

    logger.info("Processing payment reminder request", {
      userId: auth.userId,
      tenantId: auth.tenantId,
      role: auth.role,
    });

    // Only admins can send payment reminders (or allow system/cron jobs)
    if (!["admin_head", "admin_officer", "system"].includes(auth.role)) {
      logger.warn("Unauthorized reminder attempt", { role: auth.role });
      return createErrorResponse("Unauthorized: Only admins can send payment reminders", 403);
    }

    // Parse request body
    const body = await req.json() as SendPaymentReminderRequest;
    const supabase = createServiceRoleClient();

    let feesToRemind: AssociationFee[] = [];

    // Fetch tenant info
    const { data: tenant } = await supabase
      .from("tenants")
      .select("tenant_name, subdomain")
      .eq("id", auth.tenantId)
      .single();

    const tenantName = tenant?.tenant_name || "Your Community";

    if (body.fee_id) {
      // Specific fee reminder
      const { data: fee, error: feeError } = await supabase
        .from("association_fees")
        .select(`
          *,
          household:households(
            household_head_id,
            property:properties(address),
            user_profiles!households_household_head_id_fkey(id, email, first_name, last_name, phone)
          )
        `)
        .eq("id", body.fee_id)
        .eq("tenant_id", auth.tenantId)
        .single();

      if (feeError || !fee) {
        logger.error("Fee not found", feeError);
        return createErrorResponse("Fee not found", 404);
      }

      if (fee.payment_status === "paid") {
        return createErrorResponse("Fee has already been paid", 400);
      }

      feesToRemind = [fee as AssociationFee];
    } else if (body.batch_mode) {
      // Batch mode: Find all overdue or upcoming fees
      let query = supabase
        .from("association_fees")
        .select(`
          *,
          household:households(
            household_head_id,
            property:properties(address),
            user_profiles!households_household_head_id_fkey(id, email, first_name, last_name, phone)
          )
        `)
        .eq("tenant_id", auth.tenantId)
        .in("payment_status", ["unpaid", "overdue"]);

      // If days_before_due is specified, filter for upcoming payments
      if (body.days_before_due && body.days_before_due > 0) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + body.days_before_due);
        const targetDateStr = targetDate.toISOString().split("T")[0];

        query = query.eq("due_date", targetDateStr).eq("payment_status", "unpaid");
      }

      const { data: fees, error: feesError } = await query;

      if (feesError) {
        logger.error("Failed to fetch fees", feesError);
        throw feesError;
      }

      feesToRemind = (fees as AssociationFee[]) || [];
    } else {
      return createErrorResponse("Either fee_id or batch_mode must be specified");
    }

    if (feesToRemind.length === 0) {
      return createSuccessResponse({
        success: true,
        reminder_sent_count: 0,
        message: "No fees requiring reminders",
      });
    }

    logger.info("Fees to remind", { count: feesToRemind.length });

    // Check reminder history to avoid duplicate reminders within 24 hours
    // Note: We'll need a payment_reminders table to track sent reminders
    // For now, we'll query it and handle gracefully if it doesn't exist

    let recentReminderFeeIds = new Set<string>();
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentReminders } = await supabase
        .from("payment_reminders")
        .select("fee_id")
        .in("fee_id", feesToRemind.map((f) => f.id))
        .gte("sent_at", twentyFourHoursAgo.toISOString());

      recentReminderFeeIds = new Set(recentReminders?.map((r: PaymentReminder) => r.fee_id) || []);
    } catch (error) {
      // payment_reminders table might not exist, continue without filtering
      logger.warn("Could not check reminder history (table may not exist)", {
        error: error instanceof Error ? error.message : "Unknown",
      });
    }

    // Filter out fees that had reminders in the last 24 hours
    const feesToProcess = feesToRemind.filter((f) => !recentReminderFeeIds.has(f.id));

    if (feesToProcess.length === 0) {
      return createSuccessResponse({
        success: true,
        reminder_sent_count: 0,
        message: "All fees have recent reminders, skipping to avoid duplicates",
      });
    }

    logger.info("Processing reminders after deduplication", {
      original: feesToRemind.length,
      afterDedup: feesToProcess.length,
    });

    let emailsSent = 0;
    let smsSent = 0;
    const reminderRecords = [];

    for (const fee of feesToProcess) {
      const household = fee.household;
      if (!household?.user_profiles) {
        logger.warn("Missing household data for fee", { feeId: fee.id });
        continue;
      }

      const dueDate = new Date(fee.due_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysOverdue > 0;

      // Calculate late fee if overdue (example: 5% after 30 days)
      let lateFee = 0;
      if (isOverdue && daysOverdue > 30) {
        lateFee = fee.amount * 0.05;
      }

      // Generate invoice URL (in production, this would link to payment portal)
      const invoiceUrl = tenant?.subdomain
        ? `https://${tenant.subdomain}.villagetech.com/payments/${fee.id}`
        : undefined;

      // Generate and send email
      const emailTemplate = generatePaymentReminderEmail({
        recipientName: `${household.user_profiles.first_name} ${household.user_profiles.last_name}`,
        amount: fee.amount,
        dueDate: dueDate.toLocaleDateString(),
        feeType: fee.fee_type,
        daysOverdue: isOverdue ? daysOverdue : undefined,
        lateFee: lateFee > 0 ? lateFee : undefined,
        invoiceUrl,
        tenantName,
      });

      const emailResult = await sendEmail({
        to: household.user_profiles.email,
        subject: emailTemplate.subject,
        htmlBody: emailTemplate.htmlBody,
        textBody: emailTemplate.textBody,
      });

      if (emailResult.success) {
        emailsSent++;
      }

      // Send SMS if requested and phone number available
      if (body.include_sms && household.user_profiles.phone) {
        const smsMessage = isOverdue
          ? `[${tenantName}] Payment Overdue: Your ${fee.fee_type} payment of ₱${fee.amount.toFixed(2)} is ${daysOverdue} days overdue. ${lateFee > 0 ? `Late fee: ₱${lateFee.toFixed(2)}. ` : ''}Pay now: ${invoiceUrl || 'contact admin'}`
          : `[${tenantName}] Payment Reminder: Your ${fee.fee_type} payment of ₱${fee.amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}. Pay now: ${invoiceUrl || 'contact admin'}`;

        const smsResult = await sendSMS({
          to: household.user_profiles.phone,
          message: smsMessage,
        });

        if (smsResult.success) {
          smsSent++;
        }
      }

      // Record reminder sent
      reminderRecords.push({
        fee_id: fee.id,
        household_id: fee.household_id,
        tenant_id: fee.tenant_id,
        reminder_type: isOverdue ? "overdue" : "upcoming",
        sent_at: new Date().toISOString(),
        email_sent: emailResult.success,
        sms_sent: body.include_sms && household.user_profiles.phone ? true : false,
      });
    }

    // Insert reminder records into payment_reminders table
    try {
      if (reminderRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("payment_reminders")
          .insert(reminderRecords);

        if (insertError) {
          logger.warn("Failed to insert reminder records", insertError);
          // Don't fail the request if we can't log reminders
        }
      }
    } catch (error) {
      logger.warn("payment_reminders table may not exist", {
        error: error instanceof Error ? error.message : "Unknown",
      });
    }

    logger.info("Payment reminders sent", {
      processed: feesToProcess.length,
      emailsSent,
      smsSent,
    });

    return createSuccessResponse({
      success: true,
      reminder_sent_count: feesToProcess.length,
      notifications: {
        emails_sent: emailsSent,
        sms_sent: smsSent,
      },
      fees_processed: feesToProcess.map((f) => ({
        fee_id: f.id,
        household_id: f.household_id,
        amount: f.amount,
        due_date: f.due_date,
        payment_status: f.payment_status,
      })),
      message: "Payment reminders sent successfully",
    });
  } catch (error) {
    logger.error("Error sending payment reminders", error instanceof Error ? error : undefined);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
});

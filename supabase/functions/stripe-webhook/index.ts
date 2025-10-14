/**
 * Edge Function: stripe-webhook
 * Feature: 001-residential-community-management
 * Phase: 7 - User Story 5 (Payment Processing)
 * Task: T144
 *
 * Handles Stripe webhook events for payment processing.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { createServiceRoleClient } from "../_shared/supabase-client.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";

// Stripe webhook signature verification
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Stripe signature format: t=timestamp,v1=signature
    const elements = signature.split(",");
    const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
    const sig = elements.find((e) => e.startsWith("v1="))?.split("=")[1];

    if (!timestamp || !sig) {
      return false;
    }

    // Create signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Create HMAC SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    // Convert to hex
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures
    return expectedSig === sig;
  } catch (error) {
    console.error("Error verifying Stripe signature:", error);
    return false;
  }
}

interface StripePaymentIntentSucceeded {
  id: string;
  object: "payment_intent";
  amount: number;
  currency: string;
  status: string;
  metadata: {
    fee_id?: string;
    household_id?: string;
    tenant_id?: string;
  };
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripePaymentIntentSucceeded;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logger = createLogger({ function: "stripe-webhook" });

  try {
    // Get Stripe webhook secret
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeWebhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return createErrorResponse("Webhook secret not configured", 500);
    }

    // Get signature from header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logger.warn("Missing Stripe signature");
      return createErrorResponse("Missing stripe-signature header", 400);
    }

    // Get raw body
    const rawBody = await req.text();

    // Verify signature
    const isValid = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
    if (!isValid) {
      logger.warn("Invalid Stripe signature");
      return createErrorResponse("Invalid signature", 401);
    }

    // Parse event
    const event: StripeEvent = JSON.parse(rawBody);

    logger.info("Stripe webhook received", {
      eventId: event.id,
      eventType: event.type,
    });

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { fee_id, household_id, tenant_id } = paymentIntent.metadata;

      if (!fee_id || !household_id || !tenant_id) {
        logger.warn("Missing metadata in payment intent", {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });
        return createErrorResponse("Missing required metadata in payment intent", 400);
      }

      const supabase = createServiceRoleClient();

      // Update association_fees record
      const { data: fee, error: updateError } = await supabase
        .from("association_fees")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "stripe",
        })
        .eq("id", fee_id)
        .eq("household_id", household_id)
        .eq("tenant_id", tenant_id)
        .select(`
          *,
          household:households(
            household_head_id,
            property:properties(address),
            user_profiles!households_household_head_id_fkey(email, first_name, last_name)
          ),
          tenant:tenants(tenant_name)
        `)
        .single();

      if (updateError) {
        logger.error("Failed to update fee status", updateError);
        throw updateError;
      }

      if (!fee) {
        logger.warn("Fee not found", { feeId: fee_id });
        return createErrorResponse("Fee not found", 404);
      }

      logger.info("Payment recorded", {
        feeId: fee.id,
        householdId: household_id,
        amount: paymentIntent.amount / 100, // Convert from cents
      });

      // Generate receipt URL (stored in Supabase Storage or external service)
      const receiptUrl = `https://dashboard.stripe.com/payments/${paymentIntent.id}`;

      // Update with receipt URL
      await supabase
        .from("association_fees")
        .update({ receipt_url: receiptUrl })
        .eq("id", fee_id);

      // Send confirmation email to household
      const householdHead = fee.household?.user_profiles;
      const tenantName = fee.tenant?.tenant_name || "Your Community";
      const propertyAddress = fee.household?.property?.address || "your property";

      if (householdHead?.email) {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .receipt-box { background: white; border: 2px solid #28a745; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 36px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Payment Successful</h1>
      <p style="margin: 10px 0 0 0;">Thank you for your payment</p>
    </div>
    <div class="content">
      <p>Dear ${householdHead.first_name} ${householdHead.last_name},</p>
      <p>We have successfully received your payment for <strong>${tenantName}</strong>.</p>
      <div class="receipt-box">
        <h3 style="margin-top: 0; text-align: center;">Payment Receipt</h3>
        <div class="amount">₱${fee.amount.toFixed(2)}</div>
        <table style="width: 100%; margin: 20px 0;">
          <tr><td><strong>Fee Type:</strong></td><td style="text-align: right;">${fee.fee_type}</td></tr>
          <tr><td><strong>Property:</strong></td><td style="text-align: right;">${propertyAddress}</td></tr>
          <tr><td><strong>Payment Date:</strong></td><td style="text-align: right;">${new Date(fee.paid_at).toLocaleDateString()}</td></tr>
          <tr><td><strong>Payment Method:</strong></td><td style="text-align: right;">Credit Card (Stripe)</td></tr>
          <tr><td><strong>Receipt ID:</strong></td><td style="text-align: right;">${fee.id.substring(0, 8)}</td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${receiptUrl}" class="button">View Detailed Receipt</a>
      </div>
      <p style="font-size: 14px; color: #6c757d;">
        This is an automated confirmation email. If you have any questions, please contact your community administration.
      </p>
    </div>
  </div>
</body>
</html>
        `;

        const emailText = `
Payment Successful

Dear ${householdHead.first_name} ${householdHead.last_name},

We have successfully received your payment for ${tenantName}.

PAYMENT RECEIPT
Amount: ₱${fee.amount.toFixed(2)}
Fee Type: ${fee.fee_type}
Property: ${propertyAddress}
Payment Date: ${new Date(fee.paid_at).toLocaleDateString()}
Payment Method: Credit Card (Stripe)
Receipt ID: ${fee.id.substring(0, 8)}

View Detailed Receipt: ${receiptUrl}

This is an automated confirmation email. If you have any questions, please contact your community administration.
        `;

        const emailResult = await sendEmail({
          to: householdHead.email,
          subject: `Payment Confirmation - ${tenantName}`,
          htmlBody: emailHtml,
          textBody: emailText,
        });

        if (emailResult.success) {
          logger.info("Confirmation email sent", {
            email: householdHead.email,
            feeId: fee.id,
          });
        } else {
          logger.warn("Failed to send confirmation email", {
            email: householdHead.email,
            error: emailResult.error,
          });
        }
      }

      return createSuccessResponse({
        received: true,
        payment_intent_id: paymentIntent.id,
        fee_id: fee.id,
        message: "Payment processed successfully",
      });
    }

    // For other event types, just acknowledge receipt
    logger.info("Unhandled event type", { eventType: event.type });
    return createSuccessResponse({ received: true });
  } catch (error) {
    logger.error("Error processing webhook", error instanceof Error ? error : undefined);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
});

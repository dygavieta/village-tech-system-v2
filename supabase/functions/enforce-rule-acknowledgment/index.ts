/**
 * Edge Function: enforce-rule-acknowledgment
 * Feature: 001-residential-community-management
 * Phase: 7 - User Story 5 (Admin Communication)
 * Task: T151d
 *
 * Enforces rule acknowledgment by sending notifications to residents who haven't acknowledged.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { createServiceRoleClient, validateAuth } from "../_shared/supabase-client.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { sendPushNotification, sendSMS } from "../_shared/notification.ts";

interface EnforceRuleAcknowledgmentRequest {
  rule_id: string;
  criticality?: "high" | "medium" | "low"; // Determines notification channels
  deadline?: string; // ISO date string
  escalate_to_admin?: boolean; // If true, sends report to admin for non-compliance
}

interface VillageRule {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: string;
  effective_date: string;
  requires_acknowledgment: boolean;
}

interface ResidentInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  householdId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logger = createLogger({ function: "enforce-rule-acknowledgment" });

  try {
    // Validate authentication
    const authHeader = req.headers.get("authorization");
    const auth = await validateAuth(authHeader);

    logger.info("Processing rule acknowledgment enforcement", {
      userId: auth.userId,
      tenantId: auth.tenantId,
      role: auth.role,
    });

    // Only admins can enforce rule acknowledgment
    if (!["admin_head", "admin_officer"].includes(auth.role)) {
      logger.warn("Unauthorized enforcement attempt", { role: auth.role });
      return createErrorResponse("Unauthorized: Only admins can enforce rule acknowledgment", 403);
    }

    // Parse request body
    const body = await req.json() as EnforceRuleAcknowledgmentRequest;

    // Validate required fields
    if (!body.rule_id) {
      return createErrorResponse("Missing required field: rule_id");
    }

    const criticality = body.criticality || "medium";
    const supabase = createServiceRoleClient();

    // Fetch the rule
    const { data: rule, error: ruleError } = await supabase
      .from("village_rules")
      .select("*")
      .eq("id", body.rule_id)
      .eq("tenant_id", auth.tenantId)
      .single() as { data: VillageRule | null; error: any };

    if (ruleError || !rule) {
      logger.error("Rule not found", ruleError);
      return createErrorResponse("Rule not found", 404);
    }

    if (!rule.requires_acknowledgment) {
      return createErrorResponse("Rule does not require acknowledgment", 400);
    }

    logger.info("Processing rule enforcement", {
      ruleId: rule.id,
      ruleTitle: rule.title,
      criticality,
    });

    // Get all residents in the tenant
    const { data: households } = await supabase
      .from("households")
      .select(`
        id,
        household_head_id,
        user_profiles!households_household_head_id_fkey(id, email, first_name, last_name, phone)
      `)
      .eq("tenant_id", auth.tenantId);

    if (!households || households.length === 0) {
      return createSuccessResponse({
        success: true,
        residents_count: 0,
        pending_acknowledgments: 0,
        notifications_sent: 0,
        message: "No residents found in tenant",
      });
    }

    // Create rule_acknowledgments table entry tracking if not exists
    // First, check which residents have already acknowledged
    // Note: We'll need to create a rule_acknowledgments table similar to announcement_acknowledgments
    // For now, we'll assume the table exists with columns: id, rule_id, user_id, acknowledged_at

    const allResidentIds = households
      .filter((h) => h.user_profiles)
      .map((h) => h.user_profiles.id);

    // Check existing acknowledgments
    const { data: existingAcks } = await supabase
      .from("rule_acknowledgments")
      .select("user_id")
      .eq("rule_id", rule.id)
      .in("user_id", allResidentIds);

    const acknowledgedUserIds = new Set(existingAcks?.map((ack) => ack.user_id) || []);

    // Filter residents who haven't acknowledged
    const pendingResidents: ResidentInfo[] = households
      .filter((h) => h.user_profiles && !acknowledgedUserIds.has(h.user_profiles.id))
      .map((h) => ({
        userId: h.user_profiles.id,
        email: h.user_profiles.email,
        firstName: h.user_profiles.first_name,
        lastName: h.user_profiles.last_name,
        phone: h.user_profiles.phone || undefined,
        householdId: h.id,
      }));

    logger.info("Residents requiring acknowledgment", {
      total: households.length,
      acknowledged: acknowledgedUserIds.size,
      pending: pendingResidents.length,
    });

    if (pendingResidents.length === 0) {
      return createSuccessResponse({
        success: true,
        residents_count: households.length,
        pending_acknowledgments: 0,
        notifications_sent: 0,
        message: "All residents have acknowledged the rule",
      });
    }

    // Fetch tenant info for branding
    const { data: tenant } = await supabase
      .from("tenants")
      .select("tenant_name, subdomain")
      .eq("id", auth.tenantId)
      .single();

    const tenantName = tenant?.tenant_name || "Your Community";
    const portalUrl = tenant?.subdomain
      ? `https://${tenant.subdomain}.villagetech.com/rules/${rule.id}`
      : undefined;

    // Send notifications based on criticality
    let emailsSent = 0;
    let pushNotificationsSent = 0;
    let smsSent = 0;

    for (const resident of pendingResidents) {
      // Always send email for rule enforcement
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${criticality === 'high' ? '#dc3545' : criticality === 'medium' ? '#ffc107' : '#17a2b8'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .rule-box { background: white; border-left: 4px solid ${criticality === 'high' ? '#dc3545' : criticality === 'medium' ? '#ffc107' : '#17a2b8'}; padding: 20px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Action Required: Rule Acknowledgment</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Dear ${resident.firstName} ${resident.lastName},</p>
      <p>You are required to acknowledge the following community rule:</p>
      <div class="rule-box">
        <h3 style="margin-top: 0;">${rule.title}</h3>
        <p><strong>Category:</strong> ${rule.category}</p>
        <p><strong>Effective Date:</strong> ${new Date(rule.effective_date).toLocaleDateString()}</p>
        <p style="margin-top: 15px;">${rule.description}</p>
      </div>
      ${body.deadline ? `
      <div class="warning">
        <strong>⚠️ Acknowledgment Deadline</strong>
        <p style="margin: 10px 0 0 0;">Please acknowledge this rule by <strong>${new Date(body.deadline).toLocaleDateString()}</strong>. Failure to do so may result in administrative action.</p>
      </div>
      ` : ''}
      <div style="text-align: center; margin: 30px 0;">
        ${portalUrl ? `<a href="${portalUrl}" class="button">Acknowledge Rule</a>` : ''}
      </div>
      <p style="font-size: 14px; color: #6c757d;">
        This is an automated reminder from ${tenantName} administration.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const emailText = `
ACTION REQUIRED: Rule Acknowledgment
${tenantName}

Dear ${resident.firstName} ${resident.lastName},

You are required to acknowledge the following community rule:

RULE: ${rule.title}
Category: ${rule.category}
Effective Date: ${new Date(rule.effective_date).toLocaleDateString()}

${rule.description}

${body.deadline ? `ACKNOWLEDGMENT DEADLINE: ${new Date(body.deadline).toLocaleDateString()}\nFailure to acknowledge may result in administrative action.` : ''}

${portalUrl ? `Acknowledge Rule: ${portalUrl}` : ''}

This is an automated reminder from ${tenantName} administration.
      `;

      const emailResult = await sendEmail({
        to: resident.email,
        subject: `[Action Required] Rule Acknowledgment - ${rule.title}`,
        htmlBody: emailHtml,
        textBody: emailText,
      });

      if (emailResult.success) {
        emailsSent++;
      }

      // Send push notification for high and medium criticality
      if (criticality === "high" || criticality === "medium") {
        const pushResult = await sendPushNotification({
          userId: resident.userId,
          title: "Rule Acknowledgment Required",
          body: `Please acknowledge: ${rule.title}`,
          data: {
            ruleId: rule.id,
            criticality,
            deadline: body.deadline,
          },
          priority: criticality === "high" ? "high" : "normal",
        });

        if (pushResult.success) {
          pushNotificationsSent++;
        }
      }

      // Send SMS for high criticality only
      if (criticality === "high" && resident.phone) {
        const smsResult = await sendSMS({
          to: resident.phone,
          message: `[${tenantName}] URGENT: Please acknowledge the rule "${rule.title}" in your resident portal. ${body.deadline ? `Deadline: ${new Date(body.deadline).toLocaleDateString()}` : ''}`,
        });

        if (smsResult.success) {
          smsSent++;
        }
      }
    }

    logger.info("Notifications sent", {
      ruleId: rule.id,
      pending: pendingResidents.length,
      emailsSent,
      pushNotificationsSent,
      smsSent,
    });

    // If escalate_to_admin is true, send a report to admin
    if (body.escalate_to_admin && pendingResidents.length > 0) {
      const { data: adminUser } = await supabase
        .from("user_profiles")
        .select("email, first_name, last_name")
        .eq("id", auth.userId)
        .single();

      if (adminUser?.email) {
        const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
    th { background: #6c757d; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Rule Acknowledgment Report</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <h2>Non-Compliance Report</h2>
      <p><strong>Rule:</strong> ${rule.title}</p>
      <p><strong>Total Residents:</strong> ${households.length}</p>
      <p><strong>Acknowledged:</strong> ${acknowledgedUserIds.size}</p>
      <p><strong>Pending:</strong> ${pendingResidents.length}</p>
      <h3>Residents Who Have Not Acknowledged:</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          ${pendingResidents.map((r) => `<tr><td>${r.firstName} ${r.lastName}</td><td>${r.email}</td></tr>`).join('')}
        </tbody>
      </table>
      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        This report was generated automatically by the VillageTech system.
      </p>
    </div>
  </div>
</body>
</html>
        `;

        await sendEmail({
          to: adminUser.email,
          subject: `Rule Acknowledgment Report - ${rule.title}`,
          htmlBody: reportHtml,
          textBody: `Non-Compliance Report for Rule: ${rule.title}\n\nTotal Residents: ${households.length}\nAcknowledged: ${acknowledgedUserIds.size}\nPending: ${pendingResidents.length}`,
        });

        logger.info("Admin escalation report sent", { adminEmail: adminUser.email });
      }
    }

    return createSuccessResponse({
      success: true,
      rule_id: rule.id,
      rule_title: rule.title,
      acknowledgment_stats: {
        total_residents: households.length,
        acknowledged: acknowledgedUserIds.size,
        pending: pendingResidents.length,
        acknowledgment_rate: Math.round((acknowledgedUserIds.size / households.length) * 100),
      },
      notifications_sent: {
        emails: emailsSent,
        push_notifications: pushNotificationsSent,
        sms: smsSent,
      },
      escalated_to_admin: body.escalate_to_admin || false,
      message: "Rule acknowledgment enforcement completed",
    });
  } catch (error) {
    logger.error("Error enforcing rule acknowledgment", error instanceof Error ? error : undefined);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
});

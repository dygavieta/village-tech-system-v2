/**
 * Edge Function: send-announcement
 * Feature: 001-residential-community-management
 * Phase: 7 - User Story 5 (Admin Communication)
 * Task: T143
 *
 * Creates announcements and sends notifications to target audience.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { createServiceRoleClient, validateAuth } from "../_shared/supabase-client.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/cors.ts";
import { sendEmail, generateAnnouncementEmail } from "../_shared/email.ts";
import { sendPushNotification } from "../_shared/notification.ts";

interface SendAnnouncementRequest {
  title: string;
  content: string;
  urgency: "critical" | "important" | "info";
  category: "event" | "maintenance" | "security" | "policy" | "general";
  target_audience: "all_residents" | "all_security" | "specific_households" | "all";
  specific_household_ids?: string[];
  effective_start?: string;
  effective_end?: string;
  requires_acknowledgment?: boolean;
  attachment_urls?: string[];
}

interface Recipient {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logger = createLogger({ function: "send-announcement" });

  try {
    // Validate authentication
    const authHeader = req.headers.get("authorization");
    const auth = await validateAuth(authHeader);

    logger.info("Processing announcement request", {
      userId: auth.userId,
      tenantId: auth.tenantId,
      role: auth.role,
    });

    // Only admins can send announcements
    if (!["admin_head", "admin_officer"].includes(auth.role)) {
      logger.warn("Unauthorized announcement attempt", { role: auth.role });
      return createErrorResponse("Unauthorized: Only admins can send announcements", 403);
    }

    // Parse request body
    const body = await req.json() as SendAnnouncementRequest;

    // Validate required fields
    if (!body.title || !body.content || !body.urgency || !body.category || !body.target_audience) {
      return createErrorResponse("Missing required fields: title, content, urgency, category, target_audience");
    }

    // Validate specific_household_ids if target is specific
    if (body.target_audience === "specific_households" && (!body.specific_household_ids || body.specific_household_ids.length === 0)) {
      return createErrorResponse("specific_household_ids required when target_audience is 'specific_households'");
    }

    const supabase = createServiceRoleClient();

    // Insert announcement into database
    const { data: announcement, error: insertError } = await supabase
      .from("announcements")
      .insert({
        tenant_id: auth.tenantId,
        created_by_admin_id: auth.userId,
        title: body.title,
        content: body.content,
        urgency: body.urgency,
        category: body.category,
        target_audience: body.target_audience,
        specific_household_ids: body.specific_household_ids || null,
        effective_start: body.effective_start || new Date().toISOString(),
        effective_end: body.effective_end || null,
        requires_acknowledgment: body.requires_acknowledgment || false,
        attachment_urls: body.attachment_urls || null,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Failed to insert announcement", insertError);
      throw insertError;
    }

    logger.info("Announcement created", { announcementId: announcement.id });

    // Fetch tenant info for branding
    const { data: tenant } = await supabase
      .from("tenants")
      .select("tenant_name, subdomain")
      .eq("id", auth.tenantId)
      .single();

    const tenantName = tenant?.tenant_name || "Your Community";

    // Determine recipients based on target audience
    let recipients: Recipient[] = [];

    if (body.target_audience === "all" || body.target_audience === "all_residents") {
      // Fetch all household heads and members
      const { data: householdUsers } = await supabase
        .from("households")
        .select(`
          household_head_id,
          user_profiles!households_household_head_id_fkey(id, email, first_name, last_name, role)
        `)
        .eq("tenant_id", auth.tenantId);

      if (householdUsers) {
        recipients.push(
          ...householdUsers
            .filter((h) => h.user_profiles)
            .map((h) => ({
              userId: h.user_profiles.id,
              email: h.user_profiles.email,
              firstName: h.user_profiles.first_name,
              lastName: h.user_profiles.last_name,
              role: h.user_profiles.role,
            }))
        );
      }

      // Also fetch household members
      const { data: members } = await supabase
        .from("household_members")
        .select(`
          user_id,
          user_profiles!household_members_user_id_fkey(id, email, first_name, last_name, role),
          households!household_members_household_id_fkey(tenant_id)
        `)
        .eq("households.tenant_id", auth.tenantId);

      if (members) {
        recipients.push(
          ...members
            .filter((m) => m.user_profiles)
            .map((m) => ({
              userId: m.user_profiles.id,
              email: m.user_profiles.email,
              firstName: m.user_profiles.first_name,
              lastName: m.user_profiles.last_name,
              role: m.user_profiles.role,
            }))
        );
      }
    } else if (body.target_audience === "all_security") {
      // Fetch all security officers
      const { data: securityUsers } = await supabase
        .from("user_profiles")
        .select("id, email, first_name, last_name, role")
        .eq("tenant_id", auth.tenantId)
        .in("role", ["security_head", "security_officer"]);

      if (securityUsers) {
        recipients = securityUsers.map((u) => ({
          userId: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
        }));
      }
    } else if (body.target_audience === "specific_households" && body.specific_household_ids) {
      // Fetch specific household heads
      const { data: householdUsers } = await supabase
        .from("households")
        .select(`
          household_head_id,
          user_profiles!households_household_head_id_fkey(id, email, first_name, last_name, role)
        `)
        .in("id", body.specific_household_ids);

      if (householdUsers) {
        recipients = householdUsers
          .filter((h) => h.user_profiles)
          .map((h) => ({
            userId: h.user_profiles.id,
            email: h.user_profiles.email,
            firstName: h.user_profiles.first_name,
            lastName: h.user_profiles.last_name,
            role: h.user_profiles.role,
          }));
      }
    }

    // Remove duplicates based on userId
    const uniqueRecipients = Array.from(
      new Map(recipients.map((r) => [r.userId, r])).values()
    );

    logger.info("Recipients identified", {
      count: uniqueRecipients.length,
      targetAudience: body.target_audience,
    });

    // Send notifications based on urgency
    let emailsSent = 0;
    let pushNotificationsSent = 0;

    for (const recipient of uniqueRecipients) {
      // Send push notifications for critical announcements
      if (body.urgency === "critical") {
        const pushResult = await sendPushNotification({
          userId: recipient.userId,
          title: `[CRITICAL] ${body.title}`,
          body: body.content.substring(0, 200),
          data: {
            announcementId: announcement.id,
            urgency: body.urgency,
            category: body.category,
          },
          priority: "high",
        });

        if (pushResult.success) {
          pushNotificationsSent++;
        }
      }

      // Send emails for important and critical announcements
      if (body.urgency === "critical" || body.urgency === "important") {
        const emailTemplate = generateAnnouncementEmail({
          recipientName: `${recipient.firstName} ${recipient.lastName}`,
          title: body.title,
          content: body.content,
          urgency: body.urgency,
          tenantName: tenantName,
          portalUrl: tenant?.subdomain
            ? `https://${tenant.subdomain}.villagetech.com/announcements/${announcement.id}`
            : undefined,
        });

        const emailResult = await sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          htmlBody: emailTemplate.htmlBody,
          textBody: emailTemplate.textBody,
        });

        if (emailResult.success) {
          emailsSent++;
        }
      }
    }

    logger.info("Notifications sent", {
      announcementId: announcement.id,
      recipients: uniqueRecipients.length,
      emailsSent,
      pushNotificationsSent,
    });

    return createSuccessResponse({
      success: true,
      announcement_id: announcement.id,
      recipients_count: uniqueRecipients.length,
      notifications: {
        emails_sent: emailsSent,
        push_notifications_sent: pushNotificationsSent,
      },
      message: "Announcement created and notifications sent successfully",
    });
  } catch (error) {
    logger.error("Error sending announcement", error instanceof Error ? error : undefined);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
});

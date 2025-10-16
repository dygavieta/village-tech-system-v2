import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { sendEmail, generatePermitApprovalEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovePermitRequest {
  permit_id: string;
  admin_id: string;
  road_fee_amount?: number;
  approval_decision: "approved" | "rejected";
  rejection_reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { permit_id, admin_id, road_fee_amount, approval_decision, rejection_reason } =
      (await req.json()) as ApprovePermitRequest;

    // Validate required fields
    if (!permit_id || !admin_id || !approval_decision) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the permit
    const { data: permit, error: fetchError } = await supabaseClient
      .from("construction_permits")
      .select("*, household:households(*, household_head:user_profiles(email, first_name, last_name))")
      .eq("id", permit_id)
      .single();

    if (fetchError || !permit) {
      return new Response(
        JSON.stringify({ error: "Permit not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if permit is in pending status
    if (permit.permit_status !== "pending_approval") {
      return new Response(
        JSON.stringify({ error: "Permit is not pending approval" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let updateData: any = {
      approved_by_admin_id: admin_id,
      approved_at: new Date().toISOString(),
    };

    if (approval_decision === "approved") {
      updateData.permit_status = "approved";
      updateData.payment_status = road_fee_amount && road_fee_amount > 0 ? "pending" : "paid";
      if (road_fee_amount) {
        updateData.road_fee_amount = road_fee_amount;
      }
    } else {
      updateData.permit_status = "rejected";
      updateData.rejection_reason = rejection_reason || "No reason provided";
    }

    // Update the permit
    const { data: updatedPermit, error: updateError } = await supabaseClient
      .from("construction_permits")
      .update(updateData)
      .eq("id", permit_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Send notification email to household head
    const householdHead = permit.household?.household_head;
    if (householdHead?.email && approval_decision === "approved") {
      // Fetch tenant info for branding
      const { data: tenant } = await supabaseClient
        .from("tenants")
        .select("tenant_name, subdomain")
        .eq("id", permit.tenant_id)
        .single();

      const tenantName = tenant?.tenant_name || "Your Community";
      const portalUrl = tenant?.subdomain
        ? `https://${tenant.subdomain}.villagetech.com/permits/${permit.id}`
        : undefined;

      // Format dates
      const startDate = new Date(permit.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const endDate = new Date(permit.end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailTemplate = generatePermitApprovalEmail({
        recipientName: `${householdHead.first_name} ${householdHead.last_name}`,
        projectType: permit.project_type,
        permitNumber: permit.id.substring(0, 8).toUpperCase(),
        startDate,
        endDate,
        roadFee: road_fee_amount || 0,
        tenantName,
        portalUrl,
      });

      const emailResult = await sendEmail({
        to: householdHead.email,
        subject: emailTemplate.subject,
        htmlBody: emailTemplate.htmlBody,
        textBody: emailTemplate.textBody,
      });

      if (emailResult.success) {
        console.log(`Permit approval email sent to ${householdHead.email}`);
      } else {
        console.warn(`Failed to send permit approval email: ${emailResult.error}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        permit: updatedPermit,
        message: `Permit ${approval_decision} successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error approving permit:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Email Service for Edge Functions
 *
 * Provides utilities to send emails via Resend or other email providers.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send email using Resend API
 * Requires RESEND_API_KEY environment variable
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  const fromEmail = options.from || Deno.env.get("DEFAULT_FROM_EMAIL") || "noreply@villagetech.com";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody || undefined,
        reply_to: options.replyTo || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      return { success: false, error: `Email send failed: ${error}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Generate announcement email template
 */
export interface AnnouncementEmailData {
  recipientName: string;
  title: string;
  content: string;
  urgency: "critical" | "important" | "info";
  tenantName: string;
  portalUrl?: string;
}

export function generateAnnouncementEmail(data: AnnouncementEmailData): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, title, content, urgency, tenantName, portalUrl } = data;

  const urgencyColors = {
    critical: "#dc3545",
    important: "#ffc107",
    info: "#17a2b8",
  };

  const urgencyLabels = {
    critical: "CRITICAL",
    important: "IMPORTANT",
    info: "INFORMATION",
  };

  const subject = `[${urgencyLabels[urgency]}] ${title}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${urgencyColors[urgency]}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.3); border-radius: 4px; font-weight: bold; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .announcement-body { background: white; padding: 20px; border-left: 4px solid ${urgencyColors[urgency]}; margin: 20px 0; }
    .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${urgencyLabels[urgency]}</div>
      <h1 style="margin: 15px 0 5px 0;">${title}</h1>
      <p style="margin: 0; opacity: 0.9;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      <div class="announcement-body">
        ${content.replace(/\n/g, '<br>')}
      </div>
      ${portalUrl ? `<p style="text-align: center;"><a href="${portalUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View in Portal</a></p>` : ''}
      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        This announcement was sent by the ${tenantName} administration.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VillageTech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
[${urgencyLabels[urgency]}] ${title}
${tenantName}

Hello ${recipientName},

${content}

${portalUrl ? `View in Portal: ${portalUrl}` : ''}

This announcement was sent by the ${tenantName} administration.

© ${new Date().getFullYear()} VillageTech. All rights reserved.
  `;

  return { subject, htmlBody, textBody };
}

/**
 * Generate payment reminder email template
 */
export interface PaymentReminderEmailData {
  recipientName: string;
  amount: number;
  dueDate: string;
  feeType: string;
  daysOverdue?: number;
  lateFee?: number;
  invoiceUrl?: string;
  tenantName: string;
}

export function generatePaymentReminderEmail(data: PaymentReminderEmailData): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, amount, dueDate, feeType, daysOverdue, lateFee, invoiceUrl, tenantName } = data;

  const isOverdue = daysOverdue && daysOverdue > 0;
  const totalAmount = lateFee ? amount + lateFee : amount;

  const subject = isOverdue
    ? `Payment Overdue: ${feeType} - ${tenantName}`
    : `Payment Reminder: ${feeType} - ${tenantName}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isOverdue ? '#dc3545' : '#007bff'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .payment-box { background: white; border: 2px solid ${isOverdue ? '#dc3545' : '#007bff'}; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 36px; font-weight: bold; color: ${isOverdue ? '#dc3545' : '#007bff'}; text-align: center; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #28a745; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      <p>This is a ${isOverdue ? 'notice that your payment is overdue' : 'reminder about your upcoming payment'}.</p>
      <div class="payment-box">
        <h3 style="margin-top: 0; text-align: center;">Payment Details</h3>
        <table style="width: 100%; margin: 20px 0;">
          <tr><td><strong>Fee Type:</strong></td><td style="text-align: right;">${feeType}</td></tr>
          <tr><td><strong>Original Amount:</strong></td><td style="text-align: right;">₱${amount.toFixed(2)}</td></tr>
          ${lateFee ? `<tr><td><strong>Late Fee:</strong></td><td style="text-align: right; color: #dc3545;">₱${lateFee.toFixed(2)}</td></tr>` : ''}
          <tr style="border-top: 2px solid #dee2e6;"><td><strong>Total Due:</strong></td><td style="text-align: right; font-size: 20px;">₱${totalAmount.toFixed(2)}</td></tr>
          <tr><td><strong>Due Date:</strong></td><td style="text-align: right;">${dueDate}</td></tr>
          ${daysOverdue ? `<tr><td><strong>Days Overdue:</strong></td><td style="text-align: right; color: #dc3545;">${daysOverdue} days</td></tr>` : ''}
        </table>
      </div>
      ${isOverdue ? `
      <div class="warning">
        <strong>⚠️ Overdue Notice</strong>
        <p style="margin: 10px 0 0 0;">Your payment is ${daysOverdue} days overdue. Please settle your account as soon as possible to avoid additional penalties.</p>
      </div>
      ` : ''}
      <div style="text-align: center; margin: 30px 0;">
        ${invoiceUrl ? `<a href="${invoiceUrl}" class="button">View Invoice & Pay Now</a>` : ''}
      </div>
      <p style="font-size: 14px; color: #6c757d;">
        If you have already made this payment, please disregard this reminder. For questions, contact your community administration.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
${isOverdue ? 'PAYMENT OVERDUE' : 'PAYMENT REMINDER'}
${tenantName}

Dear ${recipientName},

This is a ${isOverdue ? 'notice that your payment is overdue' : 'reminder about your upcoming payment'}.

PAYMENT DETAILS
Fee Type: ${feeType}
Original Amount: ₱${amount.toFixed(2)}
${lateFee ? `Late Fee: ₱${lateFee.toFixed(2)}` : ''}
Total Due: ₱${totalAmount.toFixed(2)}
Due Date: ${dueDate}
${daysOverdue ? `Days Overdue: ${daysOverdue} days` : ''}

${isOverdue ? `
OVERDUE NOTICE
Your payment is ${daysOverdue} days overdue. Please settle your account as soon as possible to avoid additional penalties.
` : ''}

${invoiceUrl ? `View Invoice & Pay: ${invoiceUrl}` : ''}

If you have already made this payment, please disregard this reminder.
For questions, contact your community administration.
  `;

  return { subject, htmlBody, textBody };
}

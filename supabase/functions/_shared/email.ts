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

/**
 * Generate sticker approval email template
 */
export interface StickerApprovalEmailData {
  recipientName: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  stickerType: string;
  rfidSerial: string;
  expiryDate: string;
  tenantName: string;
  portalUrl?: string;
}

export function generateStickerApprovalEmail(data: StickerApprovalEmailData): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, vehiclePlate, vehicleMake, vehicleModel, vehicleColor, stickerType, rfidSerial, expiryDate, tenantName, portalUrl } = data;

  const subject = `Vehicle Sticker Approved - ${vehiclePlate}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .sticker-box { background: white; border: 2px solid #28a745; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .label { font-weight: 600; color: #495057; }
    .value { color: #212529; }
    .rfid-highlight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✓ Vehicle Sticker Approved</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      <p>Your vehicle sticker application has been <strong>approved</strong>! Your vehicle is now authorized for entry to the community.</p>

      <div class="sticker-box">
        <h3 style="margin-top: 0; color: #28a745; text-align: center;">Approved Sticker Details</h3>
        <div class="detail-row">
          <span class="label">Vehicle:</span>
          <span class="value">${vehicleMake} ${vehicleModel} (${vehicleColor})</span>
        </div>
        <div class="detail-row">
          <span class="label">Plate Number:</span>
          <span class="value">${vehiclePlate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Sticker Type:</span>
          <span class="value">${stickerType}</span>
        </div>
        <div class="detail-row">
          <span class="label">RFID Serial:</span>
          <span class="value"><strong>${rfidSerial}</strong></span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="label">Expiry Date:</span>
          <span class="value">${expiryDate}</span>
        </div>
      </div>

      <div class="rfid-highlight">
        <strong>📋 Next Steps:</strong>
        <ol style="margin: 10px 0 0 20px; padding: 0;">
          <li>Pick up your vehicle sticker from the admin office</li>
          <li>The RFID sticker must be placed on your vehicle's windshield</li>
          <li>Your RFID serial (${rfidSerial}) is now active in the gate system</li>
          <li>Present this sticker at the gate for quick entry</li>
        </ol>
      </div>

      ${portalUrl ? `<div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" class="button">View in Residence App</a>
      </div>` : ''}

      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        If you have any questions, please contact the community administration office.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
VEHICLE STICKER APPROVED
${tenantName}

Dear ${recipientName},

Your vehicle sticker application has been approved! Your vehicle is now authorized for entry to the community.

APPROVED STICKER DETAILS
Vehicle: ${vehicleMake} ${vehicleModel} (${vehicleColor})
Plate Number: ${vehiclePlate}
Sticker Type: ${stickerType}
RFID Serial: ${rfidSerial}
Expiry Date: ${expiryDate}

NEXT STEPS:
1. Pick up your vehicle sticker from the admin office
2. The RFID sticker must be placed on your vehicle's windshield
3. Your RFID serial (${rfidSerial}) is now active in the gate system
4. Present this sticker at the gate for quick entry

${portalUrl ? `View in Residence App: ${portalUrl}` : ''}

If you have any questions, please contact the community administration office.
  `;

  return { subject, htmlBody, textBody };
}

/**
 * Generate sticker rejection email template
 */
export interface StickerRejectionEmailData {
  recipientName: string;
  vehiclePlate: string;
  rejectionReason: string;
  tenantName: string;
  portalUrl?: string;
}

export function generateStickerRejectionEmail(data: StickerRejectionEmailData): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, vehiclePlate, rejectionReason, tenantName, portalUrl } = data;

  const subject = `Vehicle Sticker Application - Action Required`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Vehicle Sticker - Action Required</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      <p>We regret to inform you that your vehicle sticker application for <strong>${vehiclePlate}</strong> requires additional information or corrections.</p>

      <div class="reason-box">
        <strong>Reason:</strong>
        <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Review the reason provided above</li>
        <li>Make necessary corrections or provide additional documentation</li>
        <li>Submit a new application through the Residence App</li>
        <li>Contact the admin office if you need clarification</li>
      </ul>

      ${portalUrl ? `<div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" class="button">Submit New Application</a>
      </div>` : ''}

      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        If you have any questions, please contact the community administration office.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
VEHICLE STICKER - ACTION REQUIRED
${tenantName}

Dear ${recipientName},

We regret to inform you that your vehicle sticker application for ${vehiclePlate} requires additional information or corrections.

REASON:
${rejectionReason}

NEXT STEPS:
- Review the reason provided above
- Make necessary corrections or provide additional documentation
- Submit a new application through the Residence App
- Contact the admin office if you need clarification

${portalUrl ? `Submit New Application: ${portalUrl}` : ''}

If you have any questions, please contact the community administration office.
  `;

  return { subject, htmlBody, textBody };
}

/**
 * Generate permit approval email template
 */
export interface PermitApprovalEmailData {
  recipientName: string;
  projectType: string;
  permitNumber: string;
  startDate: string;
  endDate: string;
  roadFee: number;
  tenantName: string;
  portalUrl?: string;
}

export function generatePermitApprovalEmail(data: PermitApprovalEmailData): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, projectType, permitNumber, startDate, endDate, roadFee, tenantName, portalUrl } = data;

  const subject = `Construction Permit Approved - ${permitNumber}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .permit-box { background: white; border: 2px solid #28a745; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .fee-highlight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✓ Construction Permit Approved</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      <p>Your construction permit application has been <strong>approved</strong>!</p>

      <div class="permit-box">
        <h3 style="margin-top: 0; color: #28a745; text-align: center;">Permit Details</h3>
        <div class="detail-row">
          <span style="font-weight: 600;">Permit Number:</span>
          <span><strong>${permitNumber}</strong></span>
        </div>
        <div class="detail-row">
          <span style="font-weight: 600;">Project Type:</span>
          <span>${projectType}</span>
        </div>
        <div class="detail-row">
          <span style="font-weight: 600;">Valid From:</span>
          <span>${startDate}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span style="font-weight: 600;">Valid Until:</span>
          <span>${endDate}</span>
        </div>
      </div>

      ${roadFee > 0 ? `
      <div class="fee-highlight">
        <strong>💰 Road Fee Assessment</strong>
        <p style="margin: 10px 0 0 0;">A road fee of <strong>₱${roadFee.toFixed(2)}</strong> has been assessed for this project. Please settle this fee at the admin office before starting construction.</p>
      </div>
      ` : ''}

      <p><strong>Important Guidelines:</strong></p>
      <ul>
        <li>Display your permit number (${permitNumber}) at the construction site</li>
        <li>All workers must be registered with security</li>
        <li>Construction hours: 8:00 AM - 5:00 PM (weekdays only)</li>
        <li>Road fee must be paid before work begins</li>
        <li>Keep construction materials within your property</li>
      </ul>

      ${portalUrl ? `<div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" class="button">View Permit Details</a>
      </div>` : ''}

      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        For questions or concerns, please contact the community administration office.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
CONSTRUCTION PERMIT APPROVED
${tenantName}

Dear ${recipientName},

Your construction permit application has been approved!

PERMIT DETAILS
Permit Number: ${permitNumber}
Project Type: ${projectType}
Valid From: ${startDate}
Valid Until: ${endDate}

${roadFee > 0 ? `
ROAD FEE ASSESSMENT
A road fee of ₱${roadFee.toFixed(2)} has been assessed for this project. Please settle this fee at the admin office before starting construction.
` : ''}

IMPORTANT GUIDELINES:
- Display your permit number (${permitNumber}) at the construction site
- All workers must be registered with security
- Construction hours: 8:00 AM - 5:00 PM (weekdays only)
- Road fee must be paid before work begins
- Keep construction materials within your property

${portalUrl ? `View Permit Details: ${portalUrl}` : ''}

For questions or concerns, please contact the community administration office.
  `;

  return { subject, htmlBody, textBody };
}

/**
 * Generate guest approval notification email template
 */
export interface GuestApprovalEmailData {
  recipientName: string;
  guestName: string;
  vehiclePlate?: string;
  visitDate: string;
  approvalStatus: 'approved' | 'denied';
  tenantName: string;
}

export function generateGuestApprovalEmail(data: GuestApprovalEmailData): { subject: string; htmlBody: string; textBody: string } {
  const { recipientName, guestName, vehiclePlate, visitDate, approvalStatus, tenantName } = data;

  const isApproved = approvalStatus === 'approved';
  const subject = isApproved
    ? `Guest Visit Approved - ${guestName}`
    : `Guest Visit Request - ${guestName}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isApproved ? '#28a745' : '#ffc107'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .guest-box { background: white; border: 2px solid ${isApproved ? '#28a745' : '#ffc107'}; border-radius: 6px; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${isApproved ? '✓' : '⏳'} Guest Visit ${isApproved ? 'Approved' : 'Request'}</h1>
      <p style="margin: 10px 0 0 0;">${tenantName}</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      <p>${isApproved
        ? 'Your guest visit request has been approved. Your guest can now enter the community.'
        : 'Your guest is requesting entry. Please approve or deny this visit request.'
      }</p>

      <div class="guest-box">
        <h3 style="margin-top: 0; text-align: center;">Guest Information</h3>
        <p><strong>Guest Name:</strong> ${guestName}</p>
        ${vehiclePlate ? `<p><strong>Vehicle Plate:</strong> ${vehiclePlate}</p>` : ''}
        <p><strong>Visit Date:</strong> ${visitDate}</p>
        <p><strong>Status:</strong> <span style="color: ${isApproved ? '#28a745' : '#ffc107'}; font-weight: 600;">${isApproved ? 'APPROVED' : 'PENDING'}</span></p>
      </div>

      ${!isApproved ? `
      <p style="font-size: 14px; color: #6c757d;">
        Please respond to this request through your Residence App within 2 minutes. After the timeout, the request will be automatically denied.
      </p>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
GUEST VISIT ${isApproved ? 'APPROVED' : 'REQUEST'}
${tenantName}

Dear ${recipientName},

${isApproved
  ? 'Your guest visit request has been approved. Your guest can now enter the community.'
  : 'Your guest is requesting entry. Please approve or deny this visit request.'
}

GUEST INFORMATION
Guest Name: ${guestName}
${vehiclePlate ? `Vehicle Plate: ${vehiclePlate}` : ''}
Visit Date: ${visitDate}
Status: ${isApproved ? 'APPROVED' : 'PENDING'}

${!isApproved ? 'Please respond to this request through your Residence App within 2 minutes. After the timeout, the request will be automatically denied.' : ''}
  `;

  return { subject, htmlBody, textBody };
}

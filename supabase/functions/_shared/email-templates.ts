/**
 * Email Template Service
 *
 * Provides email templates for tenant activation, credentials delivery,
 * and admin onboarding notifications.
 */

export interface AdminActivationEmailData {
  adminName: string;
  adminEmail: string;
  tenantName: string;
  subdomain: string;
  portalUrl: string;
  temporaryPassword: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

/**
 * Generate admin activation email with credentials and portal link
 */
export function generateAdminActivationEmail(data: AdminActivationEmailData): EmailTemplate {
  const { adminName, tenantName, subdomain, portalUrl, temporaryPassword } = data;

  const subject = `Welcome to ${tenantName} - Your Admin Portal Access`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .credentials-box {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      margin: 15px 0;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .credential-label {
      font-weight: 600;
      color: #495057;
      margin-bottom: 5px;
    }
    .credential-value {
      font-family: 'Courier New', monospace;
      color: #212529;
      font-size: 14px;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #5568d3;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #6c757d;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Welcome to VillageTech</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Community Management Platform</p>
  </div>

  <div class="content">
    <h2>Hello ${adminName},</h2>

    <p>Congratulations! Your community <strong>${tenantName}</strong> has been successfully set up on the VillageTech platform.</p>

    <p>You have been designated as the <strong>Admin Head</strong> for your community. Your admin portal is now ready and you can access it using the credentials below.</p>

    <div class="credentials-box">
      <h3 style="margin-top: 0; color: #495057;">Your Admin Portal Access</h3>

      <div class="credential-item">
        <div class="credential-label">Portal URL</div>
        <div class="credential-value">${portalUrl}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Subdomain</div>
        <div class="credential-value">${subdomain}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Email</div>
        <div class="credential-value">${data.adminEmail}</div>
      </div>

      <div class="credential-item">
        <div class="credential-label">Temporary Password</div>
        <div class="credential-value">${temporaryPassword}</div>
      </div>
    </div>

    <div class="warning">
      <strong>⚠️ Important Security Notice</strong>
      <p style="margin: 10px 0 0 0;">This is a temporary password. For security reasons, you will be required to change it upon your first login. Please do not share this password with anyone.</p>
    </div>

    <div style="text-align: center;">
      <a href="${portalUrl}" class="button">Access Your Admin Portal</a>
    </div>

    <h3>Next Steps</h3>
    <ul>
      <li><strong>Log in</strong> to your admin portal using the credentials above</li>
      <li><strong>Change your password</strong> immediately upon first login</li>
      <li><strong>Set up Multi-Factor Authentication (MFA)</strong> for enhanced security</li>
      <li><strong>Import your community data</strong> (properties, households, gates)</li>
      <li><strong>Customize branding</strong> (logo, colors) to match your community</li>
      <li><strong>Create admin officers</strong> to help manage your community</li>
    </ul>

    <h3>Need Help?</h3>
    <p>Our support team is here to assist you with onboarding and any questions you may have.</p>
    <ul>
      <li>📧 Email: support@villagetech.com</li>
      <li>📚 Documentation: https://docs.villagetech.com</li>
      <li>💬 Live Chat: Available in your admin portal</li>
    </ul>
  </div>

  <div class="footer">
    <p>This email was sent by VillageTech Platform</p>
    <p>If you did not request this account, please contact support immediately.</p>
    <p>&copy; ${new Date().getFullYear()} VillageTech. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const textBody = `
Welcome to VillageTech - ${tenantName}

Hello ${adminName},

Congratulations! Your community ${tenantName} has been successfully set up on the VillageTech platform.

You have been designated as the Admin Head for your community. Your admin portal is now ready and you can access it using the credentials below.

YOUR ADMIN PORTAL ACCESS
-------------------------
Portal URL: ${portalUrl}
Subdomain: ${subdomain}
Email: ${data.adminEmail}
Temporary Password: ${temporaryPassword}

IMPORTANT SECURITY NOTICE
This is a temporary password. For security reasons, you will be required to change it upon your first login. Please do not share this password with anyone.

NEXT STEPS
1. Log in to your admin portal using the credentials above
2. Change your password immediately upon first login
3. Set up Multi-Factor Authentication (MFA) for enhanced security
4. Import your community data (properties, households, gates)
5. Customize branding (logo, colors) to match your community
6. Create admin officers to help manage your community

NEED HELP?
Our support team is here to assist you with onboarding and any questions you may have.
- Email: support@villagetech.com
- Documentation: https://docs.villagetech.com
- Live Chat: Available in your admin portal

This email was sent by VillageTech Platform
If you did not request this account, please contact support immediately.

© ${new Date().getFullYear()} VillageTech. All rights reserved.
  `;

  return { subject, htmlBody, textBody };
}

/**
 * Generate welcome email for newly created households
 */
export interface HouseholdWelcomeEmailData {
  householdHeadName: string;
  householdHeadEmail: string;
  tenantName: string;
  propertyAddress: string;
  mobileAppUrl: string;
  temporaryPassword: string;
}

export function generateHouseholdWelcomeEmail(data: HouseholdWelcomeEmailData): EmailTemplate {
  const { householdHeadName, tenantName, propertyAddress, mobileAppUrl, temporaryPassword } = data;

  const subject = `Welcome to ${tenantName} - Your Residence App Access`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: white; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${tenantName}</h1>
    </div>
    <div class="content">
      <h2>Hello ${householdHeadName},</h2>
      <p>Your household at <strong>${propertyAddress}</strong> has been registered in our community management system.</p>
      <div class="credentials">
        <h3>Mobile App Access</h3>
        <p><strong>Email:</strong> ${data.householdHeadEmail}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        <p><strong>Download App:</strong> <a href="${mobileAppUrl}">Get VillageTech Residence App</a></p>
      </div>
      <p>Please change your password upon first login.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
Welcome to ${tenantName}

Hello ${householdHeadName},

Your household at ${propertyAddress} has been registered in our community management system.

MOBILE APP ACCESS
Email: ${data.householdHeadEmail}
Temporary Password: ${temporaryPassword}
Download App: ${mobileAppUrl}

Please change your password upon first login.
  `;

  return { subject, htmlBody, textBody };
}

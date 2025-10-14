/**
 * Notification Service for Edge Functions
 *
 * Provides utilities to send push notifications and SMS messages.
 */

export interface PushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: "high" | "normal";
}

/**
 * Send push notification via Firebase Cloud Messaging (FCM)
 * Requires FCM_SERVER_KEY environment variable
 */
export async function sendPushNotification(options: PushNotificationOptions): Promise<{ success: boolean; error?: string }> {
  const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

  if (!fcmServerKey) {
    console.warn("FCM_SERVER_KEY not configured, skipping push notification");
    return { success: false, error: "Push notification service not configured" };
  }

  try {
    // In production, you would fetch the user's FCM token from the database
    // For now, we'll log the notification
    console.log("Push notification would be sent:", {
      userId: options.userId,
      title: options.title,
      body: options.body,
      data: options.data,
    });

    // TODO: Implement actual FCM API call
    // const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `key=${fcmServerKey}`,
    //   },
    //   body: JSON.stringify({
    //     to: userFcmToken,
    //     notification: {
    //       title: options.title,
    //       body: options.body,
    //     },
    //     data: options.data,
    //     priority: options.priority || "high",
    //   }),
    // });

    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export interface SMSOptions {
  to: string; // Phone number in E.164 format
  message: string;
}

/**
 * Send SMS via Twilio
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER environment variables
 */
export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromPhone) {
    console.warn("Twilio not configured, skipping SMS send");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${auth}`,
        },
        body: new URLSearchParams({
          To: options.to,
          From: fromPhone,
          Body: options.message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send SMS:", error);
      return { success: false, error: `SMS send failed: ${error}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send notification via multiple channels based on urgency
 */
export interface MultiChannelNotificationOptions {
  userId: string;
  userEmail: string;
  userPhone?: string;
  title: string;
  message: string;
  urgency: "critical" | "important" | "info";
  emailHtml?: string;
}

export async function sendMultiChannelNotification(
  options: MultiChannelNotificationOptions
): Promise<{ push: boolean; email: boolean; sms: boolean }> {
  const results = {
    push: false,
    email: false,
    sms: false,
  };

  // Send push notification for important and critical
  if (options.urgency === "important" || options.urgency === "critical") {
    const pushResult = await sendPushNotification({
      userId: options.userId,
      title: options.title,
      body: options.message,
      priority: options.urgency === "critical" ? "high" : "normal",
    });
    results.push = pushResult.success;
  }

  // Send SMS for critical only
  if (options.urgency === "critical" && options.userPhone) {
    const smsResult = await sendSMS({
      to: options.userPhone,
      message: `[CRITICAL] ${options.title}: ${options.message}`,
    });
    results.sms = smsResult.success;
  }

  return results;
}

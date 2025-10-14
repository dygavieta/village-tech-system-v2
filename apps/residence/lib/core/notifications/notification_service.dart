// Residence App - Notification Service
// User Story 4: Security Officer Manages Gate Entry/Exit (Residence side)
// User Story 5: Announcements and Fees (Phase 7)
// Purpose: Configure and handle push notifications for guest approvals and announcements

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static bool _initialized = false;
  static BuildContext? _context;

  /// Initialize notification service with navigation context
  static Future<void> initialize({BuildContext? context}) async {
    if (_initialized) return;

    _context = context;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Setup notification channels for Android
    await _setupNotificationChannels();

    _initialized = true;
  }

  /// Setup notification channels for different types
  static Future<void> _setupNotificationChannels() async {
    // Guest approval channel
    const guestChannel = AndroidNotificationChannel(
      'guest_approvals',
      'Guest Approvals',
      description: 'Notifications for guest approval requests',
      importance: Importance.high,
    );

    // Announcements channel - different priorities
    const announcementsUrgentChannel = AndroidNotificationChannel(
      'announcements_urgent',
      'Urgent Announcements',
      description: 'Urgent announcements that require immediate attention',
      importance: Importance.max,
      enableVibration: true,
      playSound: true,
    );

    const announcementsHighChannel = AndroidNotificationChannel(
      'announcements_high',
      'High Priority Announcements',
      description: 'High priority announcements',
      importance: Importance.high,
    );

    const announcementsNormalChannel = AndroidNotificationChannel(
      'announcements_normal',
      'Announcements',
      description: 'General announcements and notifications',
      importance: Importance.defaultImportance,
    );

    // Fees channel
    const feesChannel = AndroidNotificationChannel(
      'association_fees',
      'Association Fees',
      description: 'Notifications for association fees and payments',
      importance: Importance.high,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(guestChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(announcementsUrgentChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(announcementsHighChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(announcementsNormalChannel);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(feesChannel);
  }

  /// Request notification permissions (iOS)
  static Future<bool> requestPermissions() async {
    if (!_initialized) await initialize();

    final result = await _notifications
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );

    return result ?? true;
  }

  /// Show local notification for guest approvals
  static Future<void> showGuestApprovalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_initialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      'guest_approvals',
      'Guest Approvals',
      channelDescription: 'Notifications for guest approval requests',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Show announcement notification with priority-based channel
  static Future<void> showAnnouncementNotification({
    required String title,
    required String body,
    required String announcementId,
    required String urgency, // 'urgent', 'high', 'medium', 'low'
  }) async {
    if (!_initialized) await initialize();

    // Select channel based on urgency
    String channelId;
    Importance importance;
    Priority priority;

    switch (urgency.toLowerCase()) {
      case 'urgent':
        channelId = 'announcements_urgent';
        importance = Importance.max;
        priority = Priority.max;
        break;
      case 'high':
        channelId = 'announcements_high';
        importance = Importance.high;
        priority = Priority.high;
        break;
      default:
        channelId = 'announcements_normal';
        importance = Importance.defaultImportance;
        priority = Priority.defaultPriority;
    }

    final androidDetails = AndroidNotificationDetails(
      channelId,
      urgency == 'urgent' ? 'Urgent Announcements' : 'Announcements',
      channelDescription: 'Notifications for village announcements',
      importance: importance,
      priority: priority,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: 'announcement:$announcementId',
    );
  }

  /// Show fee notification
  static Future<void> showFeeNotification({
    required String title,
    required String body,
    required String feeId,
  }) async {
    if (!_initialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      'association_fees',
      'Association Fees',
      channelDescription: 'Notifications for association fees and payments',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: 'fee:$feeId',
    );
  }

  /// Generic local notification method (for backward compatibility)
  static Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    await showGuestApprovalNotification(
      title: title,
      body: body,
      payload: payload,
    );
  }

  /// Handle notification tap with deep linking
  static void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null || _context == null) return;

    try {
      // Parse payload to determine navigation
      if (payload.startsWith('announcement:')) {
        final announcementId = payload.replaceFirst('announcement:', '');
        _context?.push('/announcements/detail/$announcementId');
      } else if (payload.startsWith('fee:')) {
        final feeId = payload.replaceFirst('fee:', '');
        _context?.push('/fees/payment/$feeId');
      } else if (payload.startsWith('guest:')) {
        // Navigate to guest approval screen
        _context?.push('/guests');
      } else {
        // Default navigation
        print('Notification tapped with payload: $payload');
      }
    } catch (e) {
      print('Error handling notification tap: $e');
    }
  }

  /// Cancel all notifications
  static Future<void> cancelAll() async {
    await _notifications.cancelAll();
  }

  /// Cancel specific notification
  static Future<void> cancel(int id) async {
    await _notifications.cancel(id);
  }
}

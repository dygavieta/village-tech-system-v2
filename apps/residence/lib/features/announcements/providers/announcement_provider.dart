// Residence App - Announcement Provider (T161)
// Phase 7 User Story 5: Residence Mobile App - Announcements Module
// Purpose: Riverpod providers with Supabase Realtime for announcements

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/notifications/notification_service.dart';
import '../models/announcement.dart';
import '../models/village_rule.dart';
import '../models/curfew.dart';

/// Provider for announcements list with realtime updates
final announcementsProvider = StreamProvider.autoDispose<List<Announcement>>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    return Stream.value([]);
  }

  // Get initial data + realtime updates
  // Note: We fetch read status separately and merge it
  return supabase
      .from('announcements')
      .stream(primaryKey: ['id'])
      .order('effective_start', ascending: false)
      .asyncMap((data) async {
        // Fetch all read statuses for current user
        final readStatuses = await supabase
            .from('announcement_reads')
            .select('announcement_id')
            .eq('user_id', userId);

        final readIds = readStatuses
            .map((r) => r['announcement_id'] as String)
            .toSet();

        // Fetch all acknowledgment statuses for current user
        final ackStatuses = await supabase
            .from('announcement_acknowledgments')
            .select('announcement_id')
            .eq('user_id', userId);

        final ackedIds = ackStatuses
            .map((r) => r['announcement_id'] as String)
            .toSet();

        return data.map((json) {
          final announcementId = json['id'] as String;
          // Add read and acknowledged status to JSON
          json['is_read'] = readIds.contains(announcementId);
          json['is_acknowledged'] = ackedIds.contains(announcementId);
          return Announcement.fromJson(json);
        }).toList();
      });
});

/// Provider for filtered announcements by category
final filteredAnnouncementsProvider = StreamProvider.autoDispose
    .family<List<Announcement>, AnnouncementCategory?>((ref, category) {
  final allAnnouncements = ref.watch(announcementsProvider);

  return allAnnouncements.when(
    data: (announcements) {
      if (category == null) {
        return Stream.value(announcements);
      }
      final filtered =
          announcements.where((a) => a.category == category).toList();
      return Stream.value(filtered);
    },
    loading: () => Stream.value([]),
    error: (err, stack) => Stream.value([]),
  );
});

/// Provider for single announcement detail
final announcementDetailProvider =
    StreamProvider.autoDispose.family<Announcement?, String>((ref, id) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    return Stream.value(null);
  }

  return supabase
      .from('announcements')
      .stream(primaryKey: ['id'])
      .eq('id', id)
      .asyncMap((data) async {
        if (data.isEmpty) return null;

        // Fetch read and acknowledgment status
        final isRead = await _checkReadStatus(supabase, userId, id);
        final isAcknowledged = await _checkAcknowledgmentStatus(supabase, userId, id);

        final json = data.first;
        json['is_read'] = isRead;
        json['is_acknowledged'] = isAcknowledged;

        final announcement = Announcement.fromJson(json);

        // Mark as read when viewed
        _markAnnouncementAsRead(supabase, userId, id);

        return announcement;
      });
});

/// Provider for village rules with realtime updates
final villageRulesProvider = StreamProvider.autoDispose<List<VillageRule>>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    debugPrint('[VillageRules] No user ID, returning empty list');
    return Stream.value([]);
  }

  return supabase
      .from('village_rules')
      .stream(primaryKey: ['id'])
      .order('created_at', ascending: false)
      .asyncMap((data) async {
        debugPrint('[VillageRules] Received ${data.length} rules from stream');

        final now = DateTime.now();

        // Filter for published rules that have reached their effective date
        final publishedRules = data.where((json) {
          final publishedAt = json['published_at'];
          final effectiveDate = json['effective_date'];

          debugPrint('[VillageRules] Rule ${json['id']}: published_at=$publishedAt, effective_date=$effectiveDate');

          // Only include rules that are published and effective
          if (publishedAt == null) {
            debugPrint('[VillageRules] Rule ${json['id']} filtered: not published');
            return false;
          }
          if (effectiveDate == null) {
            debugPrint('[VillageRules] Rule ${json['id']} filtered: no effective date');
            return false;
          }

          // Parse the date (effective_date is a DATE field, not TIMESTAMPTZ)
          final effective = DateTime.parse(effectiveDate as String);
          final today = DateTime(now.year, now.month, now.day);
          final effectiveDay = DateTime(effective.year, effective.month, effective.day);

          final isEffective = effectiveDay.isBefore(today) || effectiveDay.isAtSameMomentAs(today);

          if (!isEffective) {
            debugPrint('[VillageRules] Rule ${json['id']} filtered: not yet effective (effective: $effectiveDay, today: $today)');
          }

          return isEffective;
        }).toList();

        debugPrint('[VillageRules] After filtering: ${publishedRules.length} published and effective rules');

        // Fetch all acknowledgment statuses for current user
        final ackStatuses = await supabase
            .from('rule_acknowledgments')
            .select('rule_id, acknowledged_at')
            .eq('user_id', userId);

        final ackMap = <String, DateTime>{};
        for (final ack in ackStatuses) {
          final ruleId = ack['rule_id'] as String;
          final acknowledgedAt = ack['acknowledged_at'] as String;
          ackMap[ruleId] = DateTime.parse(acknowledgedAt);
        }

        debugPrint('[VillageRules] Found ${ackMap.length} acknowledgments for user');

        return publishedRules.map((json) {
          final ruleId = json['id'] as String;
          // Add acknowledgment status to JSON
          json['is_acknowledged'] = ackMap.containsKey(ruleId);
          json['acknowledged_at'] = ackMap[ruleId]?.toIso8601String();
          return VillageRule.fromJson(json);
        }).toList();
      });
});

/// Provider for rules grouped by category
final rulesGroupedByCategoryProvider =
    StreamProvider.autoDispose<Map<RuleCategory, List<VillageRule>>>((ref) {
  final rules = ref.watch(villageRulesProvider);

  return rules.when(
    data: (rulesList) {
      final grouped = <RuleCategory, List<VillageRule>>{};
      for (final rule in rulesList) {
        grouped.putIfAbsent(rule.category, () => []).add(rule);
      }
      return Stream.value(grouped);
    },
    loading: () => Stream.value({}),
    error: (err, stack) => Stream.value({}),
  );
});

/// Provider for curfews with realtime updates
final curfewsProvider = StreamProvider.autoDispose<List<Curfew>>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    debugPrint('[Curfews] No user ID, returning empty list');
    return Stream.value([]);
  }

  // Fetch only active curfews (RLS will handle tenant filtering)
  return supabase
      .from('curfews')
      .stream(primaryKey: ['id'])
      .eq('is_active', true)
      .order('created_at', ascending: false)
      .map((data) {
        debugPrint('[Curfews] Received ${data.length} curfews from stream');
        return data.map((json) => Curfew.fromJson(json)).toList();
      });
});

/// Provider for unread announcements count
final unreadAnnouncementsCountProvider = StreamProvider.autoDispose<int>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    return Stream.value(0);
  }

  return supabase
      .from('announcement_reads')
      .stream(primaryKey: ['id'])
      .eq('user_id', userId)
      .map((reads) {
        final readIds = reads.map((r) => r['announcement_id'] as String).toSet();

        // Get all announcements and count unread
        return supabase
            .from('announcements')
            .select()
            .then((announcements) {
              final unread = announcements
                  .where((a) => !readIds.contains(a['id']))
                  .length;
              return unread;
            });
      })
      .asyncMap((future) => future);
});

/// Notifier for announcement actions
class AnnouncementNotifier extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {
    // No initial build needed
  }

  /// Mark announcement as read
  Future<void> markAsRead(String announcementId) async {
    state = const AsyncLoading();

    try {
      final supabase = ref.read(supabaseClientProvider);
      final userId = supabase.auth.currentUser?.id;

      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Check if already marked as read
      final existing = await supabase
          .from('announcement_reads')
          .select('id')
          .eq('user_id', userId)
          .eq('announcement_id', announcementId)
          .maybeSingle();

      if (existing != null) {
        // Already marked as read
        state = const AsyncData(null);
        return;
      }

      // Use upsert with onConflict to handle race conditions
      await supabase.from('announcement_reads').upsert(
        {
          'user_id': userId,
          'announcement_id': announcementId,
          'read_at': DateTime.now().toIso8601String(),
        },
        onConflict: 'user_id,announcement_id',
      );

      state = const AsyncData(null);
    } catch (e, stack) {
      // Don't fail silently here since this is an explicit user action
      debugPrint('Failed to mark announcement as read: $e');
      state = AsyncError(e, stack);
    }
  }

  /// Acknowledge announcement
  /// T177: Optimistic update - marks announcement as acknowledged immediately
  Future<void> acknowledgeAnnouncement(String announcementId) async {
    state = const AsyncLoading();

    try {
      final supabase = ref.read(supabaseClientProvider);
      final userId = supabase.auth.currentUser?.id;

      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Check if already acknowledged to prevent duplicate errors
      final existing = await supabase
          .from('announcement_acknowledgments')
          .select('id')
          .eq('user_id', userId)
          .eq('announcement_id', announcementId)
          .maybeSingle();

      if (existing != null) {
        // Already acknowledged
        state = const AsyncData(null);
        return;
      }

      // Use upsert with onConflict to handle race conditions
      await supabase.from('announcement_acknowledgments').upsert(
        {
          'user_id': userId,
          'announcement_id': announcementId,
          'acknowledged_at': DateTime.now().toIso8601String(),
        },
        onConflict: 'announcement_id,user_id',
      );

      state = const AsyncData(null);

      // Invalidate the detail provider to force refresh with new acknowledgment status
      ref.invalidate(announcementDetailProvider(announcementId));
    } catch (e, stack) {
      debugPrint('Failed to acknowledge announcement: $e');
      state = AsyncError(e, stack);
      // UI should show error and allow retry
      rethrow;
    }
  }

  /// Acknowledge village rule
  Future<void> acknowledgeRule({
    required String ruleId,
  }) async {
    state = const AsyncLoading();

    try {
      final supabase = ref.read(supabaseClientProvider);
      final userId = supabase.auth.currentUser?.id;

      if (userId == null) {
        throw Exception('User not authenticated');
      }

      // Check if already acknowledged to prevent duplicate errors
      final existing = await supabase
          .from('rule_acknowledgments')
          .select('id')
          .eq('user_id', userId)
          .eq('rule_id', ruleId)
          .maybeSingle();

      if (existing != null) {
        // Already acknowledged
        debugPrint('[AcknowledgeRule] Rule $ruleId already acknowledged by user $userId');
        state = const AsyncData(null);
        return;
      }

      // Insert acknowledgment (database schema: id, rule_id, user_id, acknowledged_at)
      await supabase.from('rule_acknowledgments').insert({
        'user_id': userId,
        'rule_id': ruleId,
        'acknowledged_at': DateTime.now().toIso8601String(),
      });

      debugPrint('[AcknowledgeRule] Successfully acknowledged rule $ruleId');
      state = const AsyncData(null);
    } catch (e, stack) {
      debugPrint('[AcknowledgeRule] Failed to acknowledge rule: $e');
      state = AsyncError(e, stack);
      // Rethrow so the UI can show the error
      rethrow;
    }
  }

  /// Setup realtime listener for new announcements
  void setupRealtimeListener() {
    final supabase = ref.read(supabaseClientProvider);

    supabase
        .channel('announcements')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'announcements',
          callback: (payload) {
            final announcement = Announcement.fromJson(payload.newRecord);

            // Show local notification for urgent announcements
            if (announcement.urgency == AnnouncementUrgency.critical ||
                announcement.urgency == AnnouncementUrgency.important) {
              NotificationService.showLocalNotification(
                title: 'New Announcement: ${announcement.title}',
                body: announcement.content.length > 100
                    ? '${announcement.content.substring(0, 100)}...'
                    : announcement.content,
                payload: 'announcement:${announcement.id}',
              );
            }
          },
        )
        .subscribe();
  }
}

final announcementNotifierProvider =
    AutoDisposeAsyncNotifierProvider<AnnouncementNotifier, void>(
  AnnouncementNotifier.new,
);

// Helper functions

Future<bool> _checkReadStatus(
  SupabaseClient supabase,
  String userId,
  String announcementId,
) async {
  final result = await supabase
      .from('announcement_reads')
      .select()
      .eq('user_id', userId)
      .eq('announcement_id', announcementId)
      .maybeSingle();

  return result != null;
}

Future<void> _markAnnouncementAsRead(
  SupabaseClient supabase,
  String userId,
  String announcementId,
) async {
  try {
    // Check if already marked as read to avoid unnecessary database calls
    final existing = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('user_id', userId)
        .eq('announcement_id', announcementId)
        .maybeSingle();

    if (existing != null) {
      // Already marked as read, no need to upsert
      return;
    }

    // Use upsert with onConflict to handle race conditions
    await supabase.from('announcement_reads').upsert(
      {
        'user_id': userId,
        'announcement_id': announcementId,
        'read_at': DateTime.now().toIso8601String(),
      },
      onConflict: 'user_id,announcement_id',
    );
  } catch (e) {
    // Silently fail - marking as read is not critical
    // The error is likely a duplicate key constraint violation
    debugPrint('Failed to mark announcement as read: $e');
  }
}

Future<bool> _checkAcknowledgmentStatus(
  SupabaseClient supabase,
  String userId,
  String announcementId,
) async {
  final result = await supabase
      .from('announcement_acknowledgments')
      .select('id')
      .eq('user_id', userId)
      .eq('announcement_id', announcementId)
      .maybeSingle();

  return result != null;
}

Future<bool> _checkRuleAcknowledgment(
  SupabaseClient supabase,
  String userId,
  String ruleId,
) async {
  final result = await supabase
      .from('rule_acknowledgments')
      .select()
      .eq('user_id', userId)
      .eq('rule_id', ruleId)
      .maybeSingle();

  return result != null;
}

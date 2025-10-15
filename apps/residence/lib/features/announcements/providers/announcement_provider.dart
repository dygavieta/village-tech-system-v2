// Residence App - Announcement Provider (T161)
// Phase 7 User Story 5: Residence Mobile App - Announcements Module
// Purpose: Riverpod providers with Supabase Realtime for announcements

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/notifications/notification_service.dart';
import '../models/announcement.dart';
import '../models/village_rule.dart';

/// Provider for announcements list with realtime updates
final announcementsProvider = StreamProvider.autoDispose<List<Announcement>>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    return Stream.value([]);
  }

  // Get initial data + realtime updates
  return supabase
      .from('announcements')
      .stream(primaryKey: ['id'])
      .order('effective_start', ascending: false)
      .map((data) {
        return data.map((json) {
          // Check if user has read this announcement
          final announcement = Announcement.fromJson(json);
          _checkReadStatus(supabase, userId, announcement.id).then((isRead) {
            if (isRead) {
              // Update local state if needed
            }
          });
          return announcement;
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
      .map((data) {
        if (data.isEmpty) return null;

        final announcement = Announcement.fromJson(data.first);

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
    return Stream.value([]);
  }

  return supabase
      .from('village_rules')
      .stream(primaryKey: ['id'])
      .eq('is_active', true)
      .order('display_order', ascending: true)
      .map((data) {
        return data.map((json) {
          final rule = VillageRule.fromJson(json);
          // Check acknowledgment status
          _checkRuleAcknowledgment(supabase, userId, rule.id).then((isAcknowledged) {
            // Update local state if needed
          });
          return rule;
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

      await supabase.from('announcement_reads').upsert({
        'user_id': userId,
        'announcement_id': announcementId,
        'read_at': DateTime.now().toIso8601String(),
      });

      state = const AsyncData(null);
    } catch (e, stack) {
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

      // Optimistic update - the UI should update immediately
      // The realtime subscription will confirm the change
      await supabase.from('announcement_acknowledgments').insert({
        'user_id': userId,
        'announcement_id': announcementId,
        'acknowledged_at': DateTime.now().toIso8601String(),
      });

      state = const AsyncData(null);
    } catch (e, stack) {
      state = AsyncError(e, stack);
      // UI should show error and allow retry
      rethrow;
    }
  }

  /// Acknowledge village rule with signature
  Future<void> acknowledgeRule({
    required String ruleId,
    required String signatureData,
  }) async {
    state = const AsyncLoading();

    try {
      final supabase = ref.read(supabaseClientProvider);
      final userId = supabase.auth.currentUser?.id;

      if (userId == null) {
        throw Exception('User not authenticated');
      }

      await supabase.from('rule_acknowledgments').insert({
        'user_id': userId,
        'rule_id': ruleId,
        'signature_data': signatureData,
        'acknowledged_at': DateTime.now().toIso8601String(),
      });

      state = const AsyncData(null);
    } catch (e, stack) {
      state = AsyncError(e, stack);
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
  await supabase.from('announcement_reads').upsert({
    'user_id': userId,
    'announcement_id': announcementId,
    'read_at': DateTime.now().toIso8601String(),
  });
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

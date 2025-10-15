import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/household.dart';
import '../models/household_member.dart';

final supabaseClient = Supabase.instance.client;

// Provider for household profile data
final householdProfileProvider = FutureProvider<Household?>((ref) async {
  final userId = supabaseClient.auth.currentUser?.id;
  if (userId == null) {
    throw Exception('User not authenticated');
  }

  // Fetch household where current user is the household head
  final response = await supabaseClient
      .from('households')
      .select('''
        id,
        tenant_id,
        property_id,
        household_head_id,
        move_in_date,
        ownership_type,
        sticker_allocation,
        created_at,
        property:properties(
          id,
          address,
          phase,
          block,
          lot,
          unit,
          property_type,
          property_size_sqm,
          lot_size_sqm,
          bedrooms,
          bathrooms,
          parking_slots
        ),
        household_head:user_profiles!household_head_id(
          id,
          first_name,
          last_name,
          phone_number
        )
      ''')
      .eq('household_head_id', userId)
      .maybeSingle();

  if (response == null) {
    return null;
  }

  return Household.fromJson(response);
});

// Provider for household members
final householdMembersProvider = FutureProvider<List<HouseholdMember>>((ref) async {
  final household = await ref.watch(householdProfileProvider.future);

  if (household == null) {
    return [];
  }

  final response = await supabaseClient
      .from('household_members')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', ascending: true);

  return (response as List)
      .map((member) => HouseholdMember.fromJson(member))
      .toList();
});

// Provider for household stats
final householdStatsProvider = FutureProvider<HouseholdStats>((ref) async {
  final household = await ref.watch(householdProfileProvider.future);

  if (household == null) {
    return HouseholdStats(
      activeStickers: 0,
      totalStickers: 0,
      activePermits: 0,
      upcomingGuests: 0,
      unreadAnnouncements: 0,
    );
  }

  // Fetch stickers count
  final stickersResponse = await supabaseClient
      .from('vehicle_stickers')
      .select('id, status')
      .eq('household_id', household.id);

  final stickersList = stickersResponse as List;
  final activeStickers = stickersList.where((s) =>
    ['approved', 'ready_for_pickup', 'issued'].contains(s['status'])
  ).length;

  // Fetch active permits count
  final permitsResponse = await supabaseClient
      .from('construction_permits')
      .select('id')
      .eq('household_id', household.id)
      .inFilter('permit_status', ['approved', 'active', 'on_hold']);

  final activePermits = (permitsResponse as List).length;

  // Fetch upcoming guests count (next 7 days)
  final today = DateTime.now();
  final nextWeek = today.add(const Duration(days: 7));

  final guestsResponse = await supabaseClient
      .from('guests')
      .select('id')
      .eq('household_id', household.id)
      .gte('visit_date', today.toIso8601String().split('T')[0])
      .lte('visit_date', nextWeek.toIso8601String().split('T')[0])
      .inFilter('status', ['pre_registered', 'arrived']);

  final upcomingGuests = (guestsResponse as List).length;

  // Fetch unread announcements count (active announcements)
  final now = DateTime.now();
  final announcementsResponse = await supabaseClient
      .from('announcements')
      .select('id')
      .eq('tenant_id', household.tenantId)
      .lte('effective_start', now.toIso8601String())
      .or('effective_end.is.null,effective_end.gte.${now.toIso8601String()}');

  final allAnnouncements = (announcementsResponse as List);

  // Get acknowledged announcements by current user
  final userId = supabaseClient.auth.currentUser?.id;

  int unreadAnnouncements = allAnnouncements.length;

  if (userId != null) {
    final acknowledgedResponse = await supabaseClient
        .from('announcement_acknowledgments')
        .select('announcement_id')
        .eq('user_id', userId);

    final acknowledgedIds = (acknowledgedResponse as List)
        .map((a) => a['announcement_id'] as String)
        .toSet();

    unreadAnnouncements = allAnnouncements
        .where((a) => !acknowledgedIds.contains(a['id']))
        .length;
  }

  return HouseholdStats(
    activeStickers: activeStickers,
    totalStickers: household.stickerAllocation,
    activePermits: activePermits,
    upcomingGuests: upcomingGuests,
    unreadAnnouncements: unreadAnnouncements,
  );
});

class HouseholdStats {
  final int activeStickers;
  final int totalStickers;
  final int activePermits;
  final int upcomingGuests;
  final int unreadAnnouncements;

  HouseholdStats({
    required this.activeStickers,
    required this.totalStickers,
    required this.activePermits,
    required this.upcomingGuests,
    required this.unreadAnnouncements,
  });
}

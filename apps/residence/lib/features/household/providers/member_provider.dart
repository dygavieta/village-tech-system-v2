import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/household_member.dart';

// Provider for the current household ID (you'll need to implement this based on your auth setup)
final currentHouseholdIdProvider = FutureProvider<String>((ref) async {
  final supabase = Supabase.instance.client;
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    throw Exception('User not authenticated');
  }

  // Get household where user is the household head
  final response = await supabase
      .from('households')
      .select('id')
      .eq('household_head_id', userId)
      .single();

  return response['id'] as String;
});

// Provider to fetch household members
final householdMembersProvider = FutureProvider.autoDispose<List<HouseholdMember>>((ref) async {
  final supabase = Supabase.instance.client;
  final householdId = await ref.watch(currentHouseholdIdProvider.future);

  final response = await supabase
      .from('household_members')
      .select()
      .eq('household_id', householdId)
      .order('created_at', ascending: false);

  return (response as List)
      .map((json) => HouseholdMember.fromJson(json))
      .toList();
});

// State notifier for member operations
class MemberNotifier extends StateNotifier<AsyncValue<void>> {
  MemberNotifier() : super(const AsyncValue.data(null));

  Future<void> addMember(HouseholdMember member) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('household_members').insert(member.toJson());
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateMember(String memberId, Map<String, dynamic> updates) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase
          .from('household_members')
          .update(updates)
          .eq('id', memberId);
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> deleteMember(String memberId) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase
          .from('household_members')
          .delete()
          .eq('id', memberId);
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final memberNotifierProvider = StateNotifierProvider<MemberNotifier, AsyncValue<void>>((ref) {
  return MemberNotifier();
});

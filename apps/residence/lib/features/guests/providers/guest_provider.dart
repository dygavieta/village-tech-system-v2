import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../household/providers/member_provider.dart';
import '../models/guest.dart';

// Provider to fetch guests
final guestsProvider = FutureProvider.autoDispose<List<Guest>>((ref) async {
  final supabase = Supabase.instance.client;
  final householdId = await ref.watch(currentHouseholdIdProvider.future);

  final response = await supabase
      .from('guests')
      .select()
      .eq('household_id', householdId)
      .order('visit_date', ascending: false);

  return (response as List).map((json) => Guest.fromJson(json)).toList();
});

// State notifier for guest operations
class GuestNotifier extends StateNotifier<AsyncValue<void>> {
  GuestNotifier() : super(const AsyncValue.data(null));

  Future<void> registerGuest(Guest guest) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('guests').insert(guest.toJson());
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateGuest(String guestId, Map<String, dynamic> updates) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('guests').update(updates).eq('id', guestId);
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> deleteGuest(String guestId) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('guests').delete().eq('id', guestId);
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final guestNotifierProvider = StateNotifierProvider<GuestNotifier, AsyncValue<void>>((ref) {
  return GuestNotifier();
});

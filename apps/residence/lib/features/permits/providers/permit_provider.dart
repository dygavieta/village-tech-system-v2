import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../household/providers/member_provider.dart';
import '../models/construction_permit.dart';

// Provider to fetch permits
final permitsProvider = FutureProvider.autoDispose<List<ConstructionPermit>>((ref) async {
  final supabase = Supabase.instance.client;
  final householdId = await ref.watch(currentHouseholdIdProvider.future);

  final response = await supabase
      .from('construction_permits')
      .select()
      .eq('household_id', householdId)
      .order('created_at', ascending: false);

  return (response as List).map((json) => ConstructionPermit.fromJson(json)).toList();
});

// State notifier for permit operations
class PermitNotifier extends StateNotifier<AsyncValue<void>> {
  PermitNotifier() : super(const AsyncValue.data(null));

  Future<void> requestPermit(ConstructionPermit permit) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('construction_permits').insert(permit.toJson());
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<String> uploadDocument(String filePath, String fileName) async {
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;

      if (userId == null) {
        throw Exception('User not authenticated');
      }

      final path = 'permit_documents/$userId/$fileName';
      final file = File(filePath);

      await supabase.storage.from('documents').upload(
            path,
            file,
            fileOptions: const FileOptions(upsert: true),
          );

      final publicUrl = supabase.storage.from('documents').getPublicUrl(path);

      return publicUrl;
    } catch (error) {
      rethrow;
    }
  }
}

final permitNotifierProvider = StateNotifierProvider<PermitNotifier, AsyncValue<void>>((ref) {
  return PermitNotifier();
});

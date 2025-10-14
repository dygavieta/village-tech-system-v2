import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../household/providers/member_provider.dart';
import '../models/vehicle_sticker.dart';

// Provider to fetch vehicle stickers
final vehicleStickersProvider = FutureProvider.autoDispose<List<VehicleSticker>>((ref) async {
  final supabase = Supabase.instance.client;
  final householdId = await ref.watch(currentHouseholdIdProvider.future);

  final response = await supabase
      .from('vehicle_stickers')
      .select()
      .eq('household_id', householdId)
      .order('created_at', ascending: false);

  return (response as List)
      .map((json) => VehicleSticker.fromJson(json))
      .toList();
});

// State notifier for sticker operations
class StickerNotifier extends StateNotifier<AsyncValue<void>> {
  StickerNotifier() : super(const AsyncValue.data(null));

  Future<void> requestSticker(VehicleSticker sticker) async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.from('vehicle_stickers').insert(sticker.toJson());
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

      final path = 'sticker_documents/$userId/$fileName';
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

final stickerNotifierProvider = StateNotifierProvider<StickerNotifier, AsyncValue<void>>((ref) {
  return StickerNotifier();
});

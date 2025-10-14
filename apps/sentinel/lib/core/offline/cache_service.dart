/**
 * Cache Service for Sentinel app
 * Manages offline caching of valid stickers in Hive
 * Provides hourly sync and offline lookup capabilities
 */

import 'dart:async';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class CacheService {
  final SupabaseClient _supabase;
  Timer? _syncTimer;

  static const String _stickersBoxName = 'cached_stickers';
  static const String _lastSyncKey = 'last_sync_timestamp';
  static const Duration _syncInterval = Duration(hours: 1);

  CacheService({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client;

  /// Initialize cache service and start periodic sync
  Future<void> initialize() async {
    await _ensureBoxOpen();
    await syncStickers(); // Initial sync
    _startPeriodicSync();
  }

  /// Ensure Hive box is open
  Future<Box> _ensureBoxOpen() async {
    if (!Hive.isBoxOpen(_stickersBoxName)) {
      return await Hive.openBox(_stickersBoxName);
    }
    return Hive.box(_stickersBoxName);
  }

  /// Start periodic sync timer
  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(_syncInterval, (_) => syncStickers());
  }

  /// Stop periodic sync
  void dispose() {
    _syncTimer?.cancel();
  }

  /// Sync stickers from Supabase to local cache
  Future<void> syncStickers() async {
    try {
      final box = await _ensureBoxOpen();

      // Fetch all active stickers
      final response = await _supabase
          .from('vehicle_stickers')
          .select('''
            id,
            rfid_serial,
            vehicle_plate,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            sticker_type,
            status,
            expiration_date,
            household_id,
            households!inner(
              id,
              property_id,
              properties!inner(
                address
              ),
              user_profiles!inner(
                first_name,
                last_name,
                phone
              )
            )
          ''')
          .eq('status', 'active')
          .gte('expiration_date', DateTime.now().toIso8601String());

      // Clear old cache
      await box.clear();

      // Store stickers indexed by RFID serial
      for (final sticker in response) {
        final rfidSerial = sticker['rfid_serial'] as String;
        await box.put(rfidSerial, sticker);
      }

      // Store last sync timestamp
      await box.put(_lastSyncKey, DateTime.now().toIso8601String());

      print('Cache sync completed: ${response.length} stickers cached');
    } catch (e) {
      print('Error syncing stickers to cache: $e');
      // Don't throw - allow app to continue with existing cache
    }
  }

  /// Look up sticker from cache (offline-first)
  Future<Map<String, dynamic>?> lookupSticker(String rfidSerial) async {
    try {
      final box = await _ensureBoxOpen();
      final cachedSticker = box.get(rfidSerial);

      if (cachedSticker != null) {
        // Validate expiration from cache
        final expirationDate = DateTime.parse(cachedSticker['expiration_date'] as String);
        if (expirationDate.isAfter(DateTime.now())) {
          return Map<String, dynamic>.from(cachedSticker as Map);
        } else {
          // Remove expired sticker from cache
          await box.delete(rfidSerial);
          return null;
        }
      }

      return null;
    } catch (e) {
      print('Error looking up sticker from cache: $e');
      return null;
    }
  }

  /// Check if cache is stale and needs sync
  Future<bool> isCacheStale() async {
    try {
      final box = await _ensureBoxOpen();
      final lastSyncStr = box.get(_lastSyncKey) as String?;

      if (lastSyncStr == null) return true;

      final lastSync = DateTime.parse(lastSyncStr);
      final now = DateTime.now();
      final diff = now.difference(lastSync);

      return diff > _syncInterval;
    } catch (e) {
      print('Error checking cache staleness: $e');
      return true;
    }
  }

  /// Get cache statistics
  Future<Map<String, dynamic>> getCacheStats() async {
    try {
      final box = await _ensureBoxOpen();
      final lastSyncStr = box.get(_lastSyncKey) as String?;

      return {
        'total_stickers': box.length - 1, // Exclude last_sync_key
        'last_sync': lastSyncStr,
        'is_stale': await isCacheStale(),
      };
    } catch (e) {
      print('Error getting cache stats: $e');
      return {
        'total_stickers': 0,
        'last_sync': null,
        'is_stale': true,
      };
    }
  }

  /// Clear all cached data
  Future<void> clearCache() async {
    try {
      final box = await _ensureBoxOpen();
      await box.clear();
      print('Cache cleared successfully');
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  /// Get all cached stickers (for debugging/admin)
  Future<List<Map<String, dynamic>>> getAllCachedStickers() async {
    try {
      final box = await _ensureBoxOpen();
      final stickers = <Map<String, dynamic>>[];

      for (final key in box.keys) {
        if (key != _lastSyncKey) {
          final value = box.get(key);
          if (value != null) {
            stickers.add(Map<String, dynamic>.from(value as Map));
          }
        }
      }

      return stickers;
    } catch (e) {
      print('Error getting all cached stickers: $e');
      return [];
    }
  }
}

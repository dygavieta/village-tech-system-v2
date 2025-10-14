/**
 * Entry Log Repository for Sentinel app
 * Manages entry/exit log persistence with offline support
 * Automatically syncs logs to Supabase when online
 */

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/offline/drift_database.dart';

class EntryLogRepository {
  final SentinelDatabase _database;
  final SupabaseClient _supabase;
  final Connectivity _connectivity;

  EntryLogRepository({
    required SentinelDatabase database,
    SupabaseClient? supabase,
    Connectivity? connectivity,
  })  : _database = database,
        _supabase = supabase ?? Supabase.instance.client,
        _connectivity = connectivity ?? Connectivity();

  /// Log an entry/exit event
  /// Attempts online sync first, falls back to offline storage
  Future<String> logEntry({
    required String gateId,
    required String entryType,
    required String direction,
    String? stickerId,
    String? guestId,
    String? permitId,
    String? guardOnDutyId,
    String? vehiclePlate,
    String? purpose,
    String? notes,
  }) async {
    final timestamp = DateTime.now();

    // Check connectivity
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        // Attempt online sync
        final logResponse = await _supabase
            .from('entry_exit_logs')
            .insert({
              'gate_id': gateId,
              'entry_type': entryType,
              'direction': direction,
              'timestamp': timestamp.toIso8601String(),
              'sticker_id': stickerId,
              'guest_id': guestId,
              'permit_id': permitId,
              'guard_on_duty_id': guardOnDutyId,
              'vehicle_plate': vehiclePlate,
              'purpose': purpose,
              'notes': notes,
            })
            .select('id')
            .single();

        return logResponse['id'] as String;
      } catch (e) {
        print('Error syncing log online, falling back to offline: $e');
        // Fall through to offline storage
      }
    }

    // Store offline
    final offlineLogId = await _storeOffline(
      vehiclePlate: vehiclePlate ?? 'UNKNOWN',
      entryType: entryType,
      direction: direction,
      timestamp: timestamp,
      stickerRFID: stickerId,
      guestName: guestId,
    );

    return 'offline_$offlineLogId';
  }

  /// Store log in offline database
  Future<int> _storeOffline({
    String? stickerRFID,
    String? guestName,
    required String vehiclePlate,
    required String entryType,
    required String direction,
    required DateTime timestamp,
  }) async {
    return await _database.addOfflineLog(
      OfflineEntryLogsCompanion(
        stickerRFID: Value(stickerRFID),
        guestName: Value(guestName),
        vehiclePlate: Value(vehiclePlate),
        entryType: Value(entryType),
        direction: Value(direction),
        timestamp: Value(timestamp),
        synced: const Value(false),
      ),
    );
  }

  /// Check network connectivity
  Future<bool> _checkConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return result.contains(ConnectivityResult.mobile) ||
          result.contains(ConnectivityResult.wifi) ||
          result.contains(ConnectivityResult.ethernet);
    } catch (e) {
      print('Error checking connectivity: $e');
      return false;
    }
  }

  /// Sync all offline logs to Supabase
  Future<Map<String, dynamic>> syncOfflineLogs() async {
    final isOnline = await _checkConnectivity();
    if (!isOnline) {
      return {
        'success': false,
        'message': 'No internet connection',
        'synced': 0,
        'failed': 0,
      };
    }

    final unsyncedLogs = await _database.getUnsyncedLogs();

    if (unsyncedLogs.isEmpty) {
      return {
        'success': true,
        'message': 'No logs to sync',
        'synced': 0,
        'failed': 0,
      };
    }

    int syncedCount = 0;
    int failedCount = 0;
    final syncedIds = <int>[];

    for (final log in unsyncedLogs) {
      try {
        // Convert offline log to Supabase format
        final logData = {
          'gate_id': 'UNKNOWN', // We don't store gate_id in offline logs currently
          'entry_type': log.entryType,
          'direction': log.direction,
          'timestamp': log.timestamp.toIso8601String(),
          'vehicle_plate': log.vehiclePlate,
          'notes': 'Synced from offline storage',
        };

        // If we have sticker RFID, try to resolve it
        if (log.stickerRFID != null) {
          final stickerResponse = await _supabase
              .from('vehicle_stickers')
              .select('id')
              .eq('rfid_serial', log.stickerRFID!)
              .maybeSingle();

          if (stickerResponse != null) {
            logData['sticker_id'] = stickerResponse['id'];
          }
        }

        // Insert to Supabase
        await _supabase.from('entry_exit_logs').insert(logData);

        syncedIds.add(log.id);
        syncedCount++;
      } catch (e) {
        print('Error syncing log ${log.id}: $e');
        failedCount++;
      }
    }

    // Mark synced logs
    if (syncedIds.isNotEmpty) {
      await _database.markAsSynced(syncedIds);
    }

    return {
      'success': failedCount == 0,
      'message': 'Synced $syncedCount logs, $failedCount failed',
      'synced': syncedCount,
      'failed': failedCount,
      'total': unsyncedLogs.length,
    };
  }

  /// Get count of unsynced logs
  Future<int> getUnsyncedCount() async {
    final unsyncedLogs = await _database.getUnsyncedLogs();
    return unsyncedLogs.length;
  }

  /// Get all unsynced logs (for debugging/admin)
  Future<List<OfflineEntryLog>> getUnsyncedLogs() async {
    return await _database.getUnsyncedLogs();
  }

  /// Clear all synced logs from offline database
  Future<void> clearSyncedLogs() async {
    // Note: This would require adding a delete method to SentinelDatabase
    // For now, we keep synced logs for audit purposes
    print('Clear synced logs not implemented - keeping for audit trail');
  }
}

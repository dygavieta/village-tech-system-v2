/**
 * Sync service for Sentinel app
 * Handles syncing offline logs to Supabase when connectivity is restored
 */

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:sentinel/core/supabase/supabase_client.dart';
import 'drift_database.dart';

class SyncService {
  final SentinelDatabase _database;
  final SupabaseClient _supabase;

  SyncService({
    required SentinelDatabase database,
    SupabaseClient? supabase,
  })  : _database = database,
        _supabase = supabase ?? Supabase.instance.client;

  /// Sync all unsynced logs to Supabase
  Future<SyncResult> syncOfflineLogs() async {
    try {
      final unsyncedLogs = await _database.getUnsyncedLogs();

      if (unsyncedLogs.isEmpty) {
        return SyncResult(success: true, syncedCount: 0);
      }

      // Convert to Supabase format
      final logsToSync = unsyncedLogs.map((log) {
        return {
          'vehicle_plate': log.vehiclePlate,
          'entry_type': log.entryType,
          'direction': log.direction,
          'timestamp': log.timestamp.toIso8601String(),
          // Add tenant_id, gate_id from stored session
        };
      }).toList();

      // Batch insert to Supabase
      await _supabase.from('entry_exit_logs').insert(logsToSync);

      // Mark as synced
      await _database.markAsSynced(unsyncedLogs.map((e) => e.id).toList());

      return SyncResult(success: true, syncedCount: unsyncedLogs.length);
    } catch (e) {
      return SyncResult(success: false, error: e.toString());
    }
  }
}

class SyncResult {
  final bool success;
  final int syncedCount;
  final String? error;

  SyncResult({
    required this.success,
    this.syncedCount = 0,
    this.error,
  });
}

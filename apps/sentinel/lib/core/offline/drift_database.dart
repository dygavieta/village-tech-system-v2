/**
 * Drift database for Sentinel app offline logs
 * Stores entry/exit logs when offline for later sync
 */

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'drift_database.g.dart';

/// Offline entry logs table
class OfflineEntryLogs extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get stickerRFID => text().nullable()();
  TextColumn get guestName => text().nullable()();
  TextColumn get vehiclePlate => text()();
  TextColumn get entryType => text()();
  TextColumn get direction => text()();
  DateTimeColumn get timestamp => dateTime()();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

@DriftDatabase(tables: [OfflineEntryLogs])
class SentinelDatabase extends _$SentinelDatabase {
  SentinelDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return driftDatabase(name: 'sentinel_offline_db');
  }

  /// Get unsynced logs
  Future<List<OfflineEntryLog>> getUnsyncedLogs() {
    return (select(offlineEntryLogs)..where((log) => log.synced.equals(false)))
        .get();
  }

  /// Mark logs as synced
  Future<void> markAsSynced(List<int> logIds) {
    return (update(offlineEntryLogs)..where((log) => log.id.isIn(logIds)))
        .write(const OfflineEntryLogsCompanion(synced: Value(true)));
  }

  /// Add offline log
  Future<int> addOfflineLog(OfflineEntryLogsCompanion log) {
    return into(offlineEntryLogs).insert(log);
  }
}

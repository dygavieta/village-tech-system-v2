/**
 * Hive service for Sentinel app offline caching
 * Stores recent stickers and gate configurations
 */

import 'package:hive_flutter/hive_flutter.dart';

class HiveService {
  static const String _stickersBoxName = 'cached_stickers';
  static const String _gatesBoxName = 'cached_gates';
  static const String _incidentsBoxName = 'cached_incidents';
  static const String _incidentDraftsBoxName = 'incident_drafts';
  static const String _curfewRulesBoxName = 'cached_curfew_rules';

  static Future<void> init() async {
    await Hive.initFlutter();
    // Register adapters here when data models are created
  }

  static Future<Box> get stickersBox => Hive.openBox(_stickersBoxName);
  static Future<Box> get gatesBox => Hive.openBox(_gatesBoxName);
  static Future<Box> get incidentsBox => Hive.openBox(_incidentsBoxName);
  static Future<Box> get incidentDraftsBox => Hive.openBox(_incidentDraftsBoxName);
  static Future<Box> get curfewRulesBox => Hive.openBox(_curfewRulesBoxName);

  static Future<void> clearAll() async {
    await Hive.deleteFromDisk();
  }
}

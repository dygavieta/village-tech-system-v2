/**
 * Hive service for Sentinel app offline caching
 * Stores recent stickers and gate configurations
 */

import 'package:hive_flutter/hive_flutter.dart';

class HiveService {
  static const String _stickersBoxName = 'cached_stickers';
  static const String _gatesBoxName = 'cached_gates';

  static Future<void> init() async {
    await Hive.initFlutter();
    // Register adapters here when data models are created
  }

  static Future<Box> get stickersBox => Hive.openBox(_stickersBoxName);
  static Future<Box> get gatesBox => Hive.openBox(_gatesBoxName);

  static Future<void> clearAll() async {
    await Hive.deleteFromDisk();
  }
}

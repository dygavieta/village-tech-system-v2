// Residence App - Curfew Model
// Purpose: Model for viewing curfew hours and schedules

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

enum CurfewSeason {
  allYear,
  summer,
  winter,
  custom,
}

class Curfew {
  final String id;
  final String tenantId;
  final String name;
  final String? description;
  final String startTime;
  final String endTime;
  final List<String> daysOfWeek;
  final CurfewSeason season;
  final DateTime? seasonStartDate;
  final DateTime? seasonEndDate;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Curfew({
    required this.id,
    required this.tenantId,
    required this.name,
    this.description,
    required this.startTime,
    required this.endTime,
    required this.daysOfWeek,
    required this.season,
    this.seasonStartDate,
    this.seasonEndDate,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Curfew.fromJson(Map<String, dynamic> json) {
    return Curfew(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      daysOfWeek: (json['days_of_week'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      season: _parseSeason(json['season'] as String),
      seasonStartDate: json['season_start_date'] != null
          ? DateTime.parse(json['season_start_date'] as String)
          : null,
      seasonEndDate: json['season_end_date'] != null
          ? DateTime.parse(json['season_end_date'] as String)
          : null,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  static CurfewSeason _parseSeason(String season) {
    switch (season.toLowerCase()) {
      case 'all_year':
        return CurfewSeason.allYear;
      case 'summer':
        return CurfewSeason.summer;
      case 'winter':
        return CurfewSeason.winter;
      case 'custom':
        return CurfewSeason.custom;
      default:
        return CurfewSeason.allYear;
    }
  }

  String get seasonDisplay {
    switch (season) {
      case CurfewSeason.allYear:
        return 'All Year Round';
      case CurfewSeason.summer:
        return 'Summer Only';
      case CurfewSeason.winter:
        return 'Winter Only';
      case CurfewSeason.custom:
        return 'Custom Season';
    }
  }

  String get daysDisplay {
    if (daysOfWeek.length == 7) return 'Every day';
    if (daysOfWeek.length == 5 &&
        !daysOfWeek.contains('saturday') &&
        !daysOfWeek.contains('sunday')) {
      return 'Weekdays';
    }
    if (daysOfWeek.length == 2 &&
        daysOfWeek.contains('saturday') &&
        daysOfWeek.contains('sunday')) {
      return 'Weekends';
    }
    return daysOfWeek
        .map((d) => d[0].toUpperCase() + d.substring(1, 3))
        .join(', ');
  }

  /// Check if this curfew is currently active based on time, day, and season
  bool get isCurrentlyActive {
    if (!isActive) return false;

    final now = DateTime.now();

    // Check if we're in the correct season
    if (!_isInSeason(now)) return false;

    // Check if today is in the days of week
    final todayName = _getDayName(now.weekday);
    if (!daysOfWeek.contains(todayName)) return false;

    // Check if current time is within curfew hours
    final currentTime = TimeOfDay.fromDateTime(now);
    final start = _parseTimeOfDay(startTime);
    final end = _parseTimeOfDay(endTime);

    // Handle overnight curfew (e.g., 22:00 to 06:00)
    if (_isTimeAfter(start, end)) {
      // Curfew spans midnight
      return _isTimeAfter(currentTime, start) || !_isTimeAfter(currentTime, end);
    } else {
      // Normal curfew (same day)
      return _isTimeAfter(currentTime, start) && !_isTimeAfter(currentTime, end);
    }
  }

  /// Check if the current date falls within the curfew's season
  bool _isInSeason(DateTime now) {
    switch (season) {
      case CurfewSeason.allYear:
        return true;

      case CurfewSeason.summer:
        // Summer: June 1 - August 31 (Northern Hemisphere)
        final month = now.month;
        return month >= 6 && month <= 8;

      case CurfewSeason.winter:
        // Winter: December 1 - February 28/29 (Northern Hemisphere)
        final month = now.month;
        return month == 12 || month == 1 || month == 2;

      case CurfewSeason.custom:
        // Custom date range
        if (seasonStartDate == null || seasonEndDate == null) {
          return true; // If dates not set, treat as all year
        }
        final today = DateTime(now.year, now.month, now.day);
        final start = DateTime(seasonStartDate!.year, seasonStartDate!.month, seasonStartDate!.day);
        final end = DateTime(seasonEndDate!.year, seasonEndDate!.month, seasonEndDate!.day);

        return (today.isAfter(start) || today.isAtSameMomentAs(start)) &&
               (today.isBefore(end) || today.isAtSameMomentAs(end));
    }
  }

  String _getDayName(int weekday) {
    switch (weekday) {
      case DateTime.monday:
        return 'monday';
      case DateTime.tuesday:
        return 'tuesday';
      case DateTime.wednesday:
        return 'wednesday';
      case DateTime.thursday:
        return 'thursday';
      case DateTime.friday:
        return 'friday';
      case DateTime.saturday:
        return 'saturday';
      case DateTime.sunday:
        return 'sunday';
      default:
        return 'monday';
    }
  }

  TimeOfDay _parseTimeOfDay(String time) {
    final parts = time.split(':');
    return TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1].split('.').first), // Handle HH:MM:SS format
    );
  }

  bool _isTimeAfter(TimeOfDay time, TimeOfDay other) {
    if (time.hour > other.hour) return true;
    if (time.hour < other.hour) return false;
    return time.minute >= other.minute;
  }
}

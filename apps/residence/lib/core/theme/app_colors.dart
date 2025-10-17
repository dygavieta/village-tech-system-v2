/**
 * Centralized color constants for Residence app
 * Ensures consistent color usage across the application
 */

import 'package:flutter/material.dart';

class AppColors {
  // Prevent instantiation
  AppColors._();

  // Primary Colors
  static const Color primary = Color(0xFF1976D2);
  static const Color primaryLight = Color(0xFF1173D4);
  static const Color primaryContainer = Color(0xFFE3F2FD);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryContainer = Color(0xFF1976D2);

  // Background Colors
  static const Color backgroundLight = Color(0xFFF6F7F8);
  static const Color backgroundGrey = Color(0xFFF5F5F5); // grey[100]
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F5F5);

  // Border Colors
  static const Color borderLight = Color(0xFFE0E0E0); // grey[300]
  static const Color borderMedium = Color(0xFFBDBDBD); // grey[400]
  static const Color divider = Color(0xFFEEEEEE); // grey[200]

  // Text Colors
  static const Color textPrimary = Color(0xFF212121); // grey[900]
  static const Color textSecondary = Color(0xFF616161); // grey[700]
  static const Color textTertiary = Color(0xFF757575); // grey[600]
  static const Color textDisabled = Color(0xFF9E9E9E); // grey[500]
  static const Color textHint = Color(0xFFBDBDBD); // grey[400]

  // Avatar Colors
  static const Color avatarPeach = Color(0xFFFFD9B3);
  static const Color avatarIconBrown = Color(0xFFA1887F); // brown[300]

  // Icon Colors
  static const Color iconLight = Color(0xFFE3F2FD);
  static const Color iconPrimary = Color(0xFF1976D2);

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);

  // Badge Colors
  static const Color badgeGeneral = Color(0xFF9E9E9E);
  static const Color badgeParking = Color(0xFF2196F3);
  static const Color badgeNoise = Color(0xFFFF9800);
  static const Color badgePets = Color(0xFF4CAF50);

  // Category Badge Colors
  static const Color categoryRenovation = Color(0xFFFF9800);
  static const Color categoryLandscaping = Color(0xFF4CAF50);
  static const Color categoryRepair = Color(0xFF2196F3);
  static const Color categoryNewConstruction = Color(0xFF9C27B0);

  // Urgency Badge Colors
  static const Color urgencyCritical = Color(0xFFF44336);
  static const Color urgencyImportant = Color(0xFFFF9800);
  static const Color urgencyNormal = Color(0xFF2196F3);
  static const Color urgencyLow = Color(0xFF9E9E9E);

  // Additional UI Colors
  static const Color shadowLight = Color(0x1F000000);
  static const Color shadowMedium = Color(0x3D000000);
  static const Color overlay = Color(0x80000000);

  // Helper method to get grey shade
  static Color grey(int shade) {
    switch (shade) {
      case 50:
        return const Color(0xFFFAFAFA);
      case 100:
        return const Color(0xFFF5F5F5);
      case 200:
        return const Color(0xFFEEEEEE);
      case 300:
        return const Color(0xFFE0E0E0);
      case 400:
        return const Color(0xFFBDBDBD);
      case 500:
        return const Color(0xFF9E9E9E);
      case 600:
        return const Color(0xFF757575);
      case 700:
        return const Color(0xFF616161);
      case 800:
        return const Color(0xFF424242);
      case 900:
        return const Color(0xFF212121);
      default:
        return const Color(0xFF9E9E9E);
    }
  }

  // Helper method to get color with opacity
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }
}

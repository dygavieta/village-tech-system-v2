// T181: Form Validation Utilities for Sentinel App
// Provides reusable validators for incident reporting and security forms

/// Required field validator
String? validateRequired(String? value, {String fieldName = 'This field'}) {
  if (value == null || value.trim().isEmpty) {
    return '$fieldName is required';
  }
  return null;
}

/// Incident description validator
String? validateIncidentDescription(String? value) {
  if (value == null || value.isEmpty) {
    return 'Incident description is required';
  }

  if (value.length < 20) {
    return 'Description must be at least 20 characters';
  }

  if (value.length > 2000) {
    return 'Description cannot exceed 2000 characters';
  }

  return null;
}

/// Location validator
String? validateLocation(String? value) {
  if (value == null || value.isEmpty) {
    return 'Location is required';
  }

  if (value.length < 3) {
    return 'Location must be at least 3 characters';
  }

  if (value.length > 200) {
    return 'Location cannot exceed 200 characters';
  }

  return null;
}

/// Vehicle plate number validator
String? validatePlateNumber(String? value) {
  if (value == null || value.isEmpty) {
    return null; // Optional for some incidents
  }

  // Remove spaces and hyphens
  final cleaned = value.replaceAll(RegExp(r'[\s\-]'), '');

  // Plate numbers are typically 4-10 alphanumeric characters
  if (cleaned.length < 4 || cleaned.length > 10) {
    return 'Plate number must be 4-10 characters';
  }

  // Must contain at least one letter and one number
  final hasLetter = RegExp(r'[A-Za-z]').hasMatch(cleaned);
  final hasNumber = RegExp(r'[0-9]').hasMatch(cleaned);

  if (!hasLetter || !hasNumber) {
    return 'Plate number must contain both letters and numbers';
  }

  return null;
}

/// Person name validator
String? validatePersonName(String? value) {
  if (value == null || value.isEmpty) {
    return null; // Optional for anonymous reports
  }

  if (value.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }

  if (value.length > 100) {
    return 'Name cannot exceed 100 characters';
  }

  // Only letters, spaces, hyphens, and apostrophes
  final nameRegex = RegExp(r'^[a-zA-Z\s\-\']+$');
  if (!nameRegex.hasMatch(value)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }

  return null;
}

/// Phone number validator
String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return null; // Optional field
  }

  // Remove common formatting characters
  final cleaned = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');

  // Check if it's a valid phone number (10-15 digits, may start with +)
  final phoneRegex = RegExp(r'^\+?[1-9]\d{9,14}$');
  if (!phoneRegex.hasMatch(cleaned)) {
    return 'Please enter a valid phone number';
  }

  return null;
}

/// Date and time validator
String? validateDateTime(DateTime? value, {bool allowPast = true, bool allowFuture = false}) {
  if (value == null) {
    return 'Date and time is required';
  }

  final now = DateTime.now();

  if (!allowPast && value.isBefore(now)) {
    return 'Date and time cannot be in the past';
  }

  if (!allowFuture && value.isAfter(now)) {
    return 'Date and time cannot be in the future';
  }

  // Check if timestamp is not more than 7 days in the past (for incident reporting)
  final sevenDaysAgo = now.subtract(const Duration(days: 7));
  if (value.isBefore(sevenDaysAgo)) {
    return 'Incident date cannot be more than 7 days in the past';
  }

  return null;
}

/// Incident severity validator
String? validateSeverity(String? value) {
  if (value == null || value.isEmpty) {
    return 'Severity level is required';
  }

  final validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.contains(value.toLowerCase())) {
    return 'Please select a valid severity level';
  }

  return null;
}

/// Number of people involved validator
String? validatePeopleCount(num? value) {
  if (value == null) {
    return null; // Optional field
  }

  if (value < 0) {
    return 'Number cannot be negative';
  }

  if (value > 100) {
    return 'Number seems too large, please verify';
  }

  return null;
}

/// Text length validator
String? validateTextLength(
  String? value, {
  int? minLength,
  int? maxLength,
  String fieldName = 'This field',
}) {
  if (value == null || value.isEmpty) {
    return null; // Use validateRequired separately for required fields
  }

  if (minLength != null && value.length < minLength) {
    return '$fieldName must be at least $minLength characters';
  }

  if (maxLength != null && value.length > maxLength) {
    return '$fieldName cannot exceed $maxLength characters';
  }

  return null;
}

/// Combine multiple validators
String? Function(String?) combineValidators(
  List<String? Function(String?)> validators,
) {
  return (String? value) {
    for (final validator in validators) {
      final error = validator(value);
      if (error != null) {
        return error;
      }
    }
    return null;
  };
}

/// Witness statement validator
String? validateWitnessStatement(String? value) {
  if (value == null || value.isEmpty) {
    return null; // Optional
  }

  if (value.length < 10) {
    return 'Statement must be at least 10 characters';
  }

  if (value.length > 1000) {
    return 'Statement cannot exceed 1000 characters';
  }

  return null;
}

/// Action taken validator (for incident resolution)
String? validateActionTaken(String? value) {
  if (value == null || value.isEmpty) {
    return 'Action taken is required';
  }

  if (value.length < 10) {
    return 'Description must be at least 10 characters';
  }

  if (value.length > 500) {
    return 'Description cannot exceed 500 characters';
  }

  return null;
}

// T180: Form Validation Utilities for Residence App
// Provides reusable validators for Flutter forms

/// Email validator
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email is required';
  }

  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  if (!emailRegex.hasMatch(value)) {
    return 'Please enter a valid email address';
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

/// Required field validator
String? validateRequired(String? value, {String fieldName = 'This field'}) {
  if (value == null || value.trim().isEmpty) {
    return '$fieldName is required';
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

/// Vehicle plate number validator
String? validatePlateNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Plate number is required';
  }

  // Remove spaces and hyphens
  final cleaned = value.replaceAll(RegExp(r'[\s\-]'), '');

  // Plate numbers are typically 6-8 alphanumeric characters
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

/// Date validator
String? validateDate(String? value, {bool allowPast = true, bool allowFuture = true}) {
  if (value == null || value.isEmpty) {
    return 'Date is required';
  }

  try {
    final date = DateTime.parse(value);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final selectedDate = DateTime(date.year, date.month, date.day);

    if (!allowPast && selectedDate.isBefore(today)) {
      return 'Date cannot be in the past';
    }

    if (!allowFuture && selectedDate.isAfter(today)) {
      return 'Date cannot be in the future';
    }

    // Check if date is not too far in the future (e.g., 2 years)
    final twoYearsFromNow = today.add(const Duration(days: 730));
    if (selectedDate.isAfter(twoYearsFromNow)) {
      return 'Date cannot be more than 2 years in the future';
    }

    return null;
  } catch (e) {
    return 'Invalid date format';
  }
}

/// Number range validator
String? validateNumberRange(
  num? value, {
  num? min,
  num? max,
  String fieldName = 'Value',
}) {
  if (value == null) {
    return '$fieldName is required';
  }

  if (min != null && value < min) {
    return '$fieldName must be at least $min';
  }

  if (max != null && value > max) {
    return '$fieldName cannot exceed $max';
  }

  return null;
}

/// Positive number validator
String? validatePositiveNumber(num? value, {String fieldName = 'Value'}) {
  if (value == null) {
    return '$fieldName is required';
  }

  if (value <= 0) {
    return '$fieldName must be greater than 0';
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

/// Name validator (for people's names)
String? validateName(String? value, {String fieldName = 'Name'}) {
  if (value == null || value.trim().isEmpty) {
    return '$fieldName is required';
  }

  if (value.trim().length < 2) {
    return '$fieldName must be at least 2 characters';
  }

  if (value.length > 50) {
    return '$fieldName cannot exceed 50 characters';
  }

  // Only letters, spaces, hyphens, and apostrophes
  final nameRegex = RegExp(r'^[a-zA-Z\s\-\']+$');
  if (!nameRegex.hasMatch(value)) {
    return '$fieldName can only contain letters, spaces, hyphens, and apostrophes';
  }

  return null;
}

/// Vehicle make validator
String? validateVehicleMake(String? value) {
  if (value == null || value.isEmpty) {
    return 'Vehicle make is required';
  }

  if (value.length < 2) {
    return 'Vehicle make must be at least 2 characters';
  }

  if (value.length > 50) {
    return 'Vehicle make cannot exceed 50 characters';
  }

  return null;
}

/// Color validator
String? validateColor(String? value) {
  if (value == null || value.isEmpty) {
    return 'Color is required';
  }

  if (value.length < 3) {
    return 'Color must be at least 3 characters';
  }

  if (value.length > 30) {
    return 'Color cannot exceed 30 characters';
  }

  return null;
}

/// Project description validator
String? validateProjectDescription(String? value) {
  if (value == null || value.isEmpty) {
    return 'Project description is required';
  }

  if (value.length < 20) {
    return 'Description must be at least 20 characters';
  }

  if (value.length > 1000) {
    return 'Description cannot exceed 1000 characters';
  }

  return null;
}

/// Duration validator (in days)
String? validateDuration(num? value) {
  if (value == null) {
    return 'Duration is required';
  }

  if (value < 1) {
    return 'Duration must be at least 1 day';
  }

  if (value > 365) {
    return 'Duration cannot exceed 365 days';
  }

  return null;
}

/// Worker count validator
String? validateWorkerCount(num? value) {
  if (value == null) {
    return 'Number of workers is required';
  }

  if (value < 1) {
    return 'Must have at least 1 worker';
  }

  if (value > 100) {
    return 'Number of workers cannot exceed 100';
  }

  return null;
}

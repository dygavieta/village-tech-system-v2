/**
 * Custom error classes for Sentinel app
 */

class AppError implements Exception {
  final String message;
  final String code;
  final dynamic details;

  AppError(this.message, {this.code = 'UNKNOWN_ERROR', this.details});

  @override
  String toString() => 'AppError: $message (code: $code)';
}

class AuthError extends AppError {
  AuthError(String message, {dynamic details})
      : super(message, code: 'AUTH_ERROR', details: details);
}

class OfflineError extends AppError {
  OfflineError(String message, {dynamic details})
      : super(message, code: 'OFFLINE_ERROR', details: details);
}

class SyncError extends AppError {
  SyncError(String message, {dynamic details})
      : super(message, code: 'SYNC_ERROR', details: details);
}

class ScanError extends AppError {
  ScanError(String message, {dynamic details})
      : super(message, code: 'SCAN_ERROR', details: details);
}

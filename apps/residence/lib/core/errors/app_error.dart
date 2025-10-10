/**
 * Custom error classes for Residence app
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

class NetworkError extends AppError {
  NetworkError(String message, {dynamic details})
      : super(message, code: 'NETWORK_ERROR', details: details);
}

class ValidationError extends AppError {
  ValidationError(String message, {dynamic details})
      : super(message, code: 'VALIDATION_ERROR', details: details);
}

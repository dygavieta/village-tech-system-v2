/**
 * Gate scan states for Sentinel app
 */

import 'package:equatable/equatable.dart';

abstract class GateScanState extends Equatable {
  const GateScanState();

  @override
  List<Object?> get props => [];
}

/// Initial idle state
class GateScanIdle extends GateScanState {
  const GateScanIdle();
}

/// Processing scan
class GateScanProcessing extends GateScanState {
  const GateScanProcessing();
}

/// Scan successful, entry logged
class GateScanSuccess extends GateScanState {
  final Map<String, dynamic> stickerInfo;
  final Map<String, dynamic> residentInfo;
  final String logId;
  final DateTime timestamp;

  const GateScanSuccess({
    required this.stickerInfo,
    required this.residentInfo,
    required this.logId,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [stickerInfo, residentInfo, logId, timestamp];
}

/// Scan failed or access denied
class GateScanError extends GateScanState {
  final String message;
  final ScanErrorType errorType;

  const GateScanError({
    required this.message,
    required this.errorType,
  });

  @override
  List<Object?> get props => [message, errorType];
}

/// Error types for different scan failures
enum ScanErrorType {
  invalidSticker,
  expiredSticker,
  inactiveSticker,
  networkError,
  unknown,
}

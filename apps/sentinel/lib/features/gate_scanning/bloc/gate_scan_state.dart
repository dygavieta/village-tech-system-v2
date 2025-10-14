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

/// Curfew warning state
class GateScanCurfewWarning extends GateScanState {
  final Map<String, dynamic> stickerInfo;
  final Map<String, dynamic> residentInfo;
  final String curfewRule;
  final String rfidSerial;
  final String gateId;

  const GateScanCurfewWarning({
    required this.stickerInfo,
    required this.residentInfo,
    required this.curfewRule,
    required this.rfidSerial,
    required this.gateId,
  });

  @override
  List<Object?> get props => [stickerInfo, residentInfo, curfewRule, rfidSerial, gateId];
}

/// Error types for different scan failures
enum ScanErrorType {
  invalidSticker,
  expiredSticker,
  inactiveSticker,
  curfewViolation,
  networkError,
  unknown,
}

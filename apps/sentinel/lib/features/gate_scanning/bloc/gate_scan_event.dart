/**
 * Gate scan events for Sentinel app
 * Handles RFID scanning, validation, and entry logging
 */

import 'package:equatable/equatable.dart';

abstract class GateScanEvent extends Equatable {
  const GateScanEvent();

  @override
  List<Object?> get props => [];
}

/// Event triggered when an RFID sticker is scanned
class RfidScanned extends GateScanEvent {
  final String rfidSerial;
  final String gateId;

  const RfidScanned({
    required this.rfidSerial,
    required this.gateId,
  });

  @override
  List<Object?> get props => [rfidSerial, gateId];
}

/// Event triggered for manual entry (without RFID scan)
class ManualEntryRequested extends GateScanEvent {
  final String gateId;
  final String vehiclePlate;
  final String? purpose;

  const ManualEntryRequested({
    required this.gateId,
    required this.vehiclePlate,
    this.purpose,
  });

  @override
  List<Object?> get props => [gateId, vehiclePlate, purpose];
}

/// Event to reset scan state
class ScanReset extends GateScanEvent {
  const ScanReset();
}

/// Event to override curfew violation
class CurfewOverrideRequested extends GateScanEvent {
  final String rfidSerial;
  final String gateId;
  final String overrideReason;
  final Map<String, dynamic> stickerInfo;
  final Map<String, dynamic> residentInfo;

  const CurfewOverrideRequested({
    required this.rfidSerial,
    required this.gateId,
    required this.overrideReason,
    required this.stickerInfo,
    required this.residentInfo,
  });

  @override
  List<Object?> get props => [rfidSerial, gateId, overrideReason, stickerInfo, residentInfo];
}

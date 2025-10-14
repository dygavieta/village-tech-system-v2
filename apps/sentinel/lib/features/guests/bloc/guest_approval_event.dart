/**
 * Guest approval events
 */

import 'package:equatable/equatable.dart';

abstract class GuestApprovalEvent extends Equatable {
  const GuestApprovalEvent();

  @override
  List<Object?> get props => [];
}

class ApprovalRequested extends GuestApprovalEvent {
  final String householdId;
  final String guestName;
  final String? vehiclePlate;
  final String gateId;

  const ApprovalRequested({
    required this.householdId,
    required this.guestName,
    this.vehiclePlate,
    required this.gateId,
  });

  @override
  List<Object?> get props => [householdId, guestName, vehiclePlate, gateId];
}

class ApprovalReset extends GuestApprovalEvent {
  const ApprovalReset();
}

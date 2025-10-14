/**
 * Guest approval states
 */

import 'package:equatable/equatable.dart';

abstract class GuestApprovalState extends Equatable {
  const GuestApprovalState();

  @override
  List<Object?> get props => [];
}

class ApprovalIdle extends GuestApprovalState {
  const ApprovalIdle();
}

class ApprovalWaiting extends GuestApprovalState {
  final String requestId;
  final String guestName;
  final int remainingSeconds;

  const ApprovalWaiting({
    required this.requestId,
    required this.guestName,
    required this.remainingSeconds,
  });

  @override
  List<Object?> get props => [requestId, guestName, remainingSeconds];
}

class ApprovalApproved extends GuestApprovalState {
  final String guestName;
  final String? response;

  const ApprovalApproved({
    required this.guestName,
    this.response,
  });

  @override
  List<Object?> get props => [guestName, response];
}

class ApprovalRejected extends GuestApprovalState {
  final String guestName;
  final String? reason;

  const ApprovalRejected({
    required this.guestName,
    this.reason,
  });

  @override
  List<Object?> get props => [guestName, reason];
}

class ApprovalTimeout extends GuestApprovalState {
  final String guestName;

  const ApprovalTimeout({required this.guestName});

  @override
  List<Object?> get props => [guestName];
}

class ApprovalError extends GuestApprovalState {
  final String message;

  const ApprovalError({required this.message});

  @override
  List<Object?> get props => [message];
}

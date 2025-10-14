/**
 * Incident states for Sentinel app
 */

import 'package:equatable/equatable.dart';

abstract class IncidentState extends Equatable {
  const IncidentState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class IncidentInitial extends IncidentState {
  const IncidentInitial();
}

/// Loading state
class IncidentLoading extends IncidentState {
  const IncidentLoading();
}

/// Incidents loaded successfully
class IncidentLoaded extends IncidentState {
  final List<Map<String, dynamic>> incidents;
  final DateTime loadedAt;

  const IncidentLoaded({
    required this.incidents,
    required this.loadedAt,
  });

  @override
  List<Object?> get props => [incidents, loadedAt];
}

/// Single incident detail loaded
class IncidentDetailLoaded extends IncidentState {
  final Map<String, dynamic> incident;

  const IncidentDetailLoaded({required this.incident});

  @override
  List<Object?> get props => [incident];
}

/// Incident created successfully
class IncidentCreated extends IncidentState {
  final String incidentId;
  final DateTime timestamp;

  const IncidentCreated({
    required this.incidentId,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [incidentId, timestamp];
}

/// Error state
class IncidentError extends IncidentState {
  final String message;
  final IncidentErrorType errorType;

  const IncidentError({
    required this.message,
    required this.errorType,
  });

  @override
  List<Object?> get props => [message, errorType];
}

/// Error types
enum IncidentErrorType {
  networkError,
  storageError,
  validationError,
  permissionError,
  unknown,
}

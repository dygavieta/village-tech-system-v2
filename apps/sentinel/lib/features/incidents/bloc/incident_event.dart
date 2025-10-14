/**
 * Incident events for Sentinel app
 * Handles incident reporting and management
 */

import 'package:equatable/equatable.dart';

abstract class IncidentEvent extends Equatable {
  const IncidentEvent();

  @override
  List<Object?> get props => [];
}

/// Event to create a new incident report
class CreateIncidentEvent extends IncidentEvent {
  final String incidentType;
  final String? locationGateId;
  final String? locationPropertyId;
  final String description;
  final String severity;
  final List<String> photoUrls;
  final List<String> videoUrls;
  final Map<String, dynamic>? gpsCoordinates;
  final String? involvedParties;

  const CreateIncidentEvent({
    required this.incidentType,
    this.locationGateId,
    this.locationPropertyId,
    required this.description,
    required this.severity,
    this.photoUrls = const [],
    this.videoUrls = const [],
    this.gpsCoordinates,
    this.involvedParties,
  });

  @override
  List<Object?> get props => [
        incidentType,
        locationGateId,
        locationPropertyId,
        description,
        severity,
        photoUrls,
        videoUrls,
        gpsCoordinates,
        involvedParties,
      ];
}

/// Event to load all incidents for current guard
class LoadIncidentsEvent extends IncidentEvent {
  final String? severityFilter;
  final String? statusFilter;
  final DateTime? startDate;
  final DateTime? endDate;

  const LoadIncidentsEvent({
    this.severityFilter,
    this.statusFilter,
    this.startDate,
    this.endDate,
  });

  @override
  List<Object?> get props => [severityFilter, statusFilter, startDate, endDate];
}

/// Event to load a single incident detail
class LoadIncidentDetailEvent extends IncidentEvent {
  final String incidentId;

  const LoadIncidentDetailEvent({required this.incidentId});

  @override
  List<Object?> get props => [incidentId];
}

/// Event to refresh incidents list
class RefreshIncidentsEvent extends IncidentEvent {
  const RefreshIncidentsEvent();
}

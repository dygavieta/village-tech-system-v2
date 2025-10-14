/**
 * Incident BLoC for Sentinel app
 * Manages incident reporting, media uploads, and incident list
 */

import 'package:bloc/bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'incident_event.dart';
import 'incident_state.dart';

class IncidentBloc extends Bloc<IncidentEvent, IncidentState> {
  final SupabaseClient _supabase;

  IncidentBloc({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client,
        super(const IncidentInitial()) {
    on<CreateIncidentEvent>(_onCreateIncident);
    on<LoadIncidentsEvent>(_onLoadIncidents);
    on<LoadIncidentDetailEvent>(_onLoadIncidentDetail);
    on<RefreshIncidentsEvent>(_onRefreshIncidents);
  }

  /// Create a new incident report
  Future<void> _onCreateIncident(
    CreateIncidentEvent event,
    Emitter<IncidentState> emit,
  ) async {
    emit(const IncidentLoading());

    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser == null) {
        emit(const IncidentError(
          message: 'User not authenticated',
          errorType: IncidentErrorType.permissionError,
        ));
        return;
      }

      // Validate inputs
      if (event.description.trim().isEmpty) {
        emit(const IncidentError(
          message: 'Description is required',
          errorType: IncidentErrorType.validationError,
        ));
        return;
      }

      if (event.locationGateId == null && event.locationPropertyId == null) {
        emit(const IncidentError(
          message: 'Location (gate or property) is required',
          errorType: IncidentErrorType.validationError,
        ));
        return;
      }

      // Get tenant_id from user metadata
      final tenantId = currentUser.userMetadata?['tenant_id'];
      if (tenantId == null) {
        emit(const IncidentError(
          message: 'Tenant information missing',
          errorType: IncidentErrorType.permissionError,
        ));
        return;
      }

      // Create incident record
      final incidentData = {
        'tenant_id': tenantId,
        'reported_by_security_id': currentUser.id,
        'incident_type': event.incidentType,
        'location_gate_id': event.locationGateId,
        'location_property_id': event.locationPropertyId,
        'description': event.description,
        'severity': event.severity,
        'evidence_photo_urls': event.photoUrls.isNotEmpty ? event.photoUrls : null,
        'status': 'reported',
        'created_at': DateTime.now().toIso8601String(),
      };

      final response = await _supabase
          .from('incidents')
          .insert(incidentData)
          .select()
          .single();

      final incidentId = response['id'] as String;

      // Cache incident locally for offline viewing
      await _cacheIncident(response);

      // Send real-time alert for critical incidents
      if (event.severity == 'critical') {
        await _sendCriticalIncidentAlert(incidentId, event.description);
      }

      emit(IncidentCreated(
        incidentId: incidentId,
        timestamp: DateTime.parse(response['created_at'] as String),
      ));
    } on PostgrestException catch (e) {
      emit(IncidentError(
        message: 'Database error: ${e.message}',
        errorType: IncidentErrorType.networkError,
      ));
    } catch (e) {
      // Check if offline - store draft locally
      if (e.toString().contains('network') || e.toString().contains('connection')) {
        await _storeDraftLocally(event);
        emit(const IncidentError(
          message: 'Offline: Incident saved as draft. Will sync when online.',
          errorType: IncidentErrorType.networkError,
        ));
      } else {
        emit(IncidentError(
          message: 'Error creating incident: ${e.toString()}',
          errorType: IncidentErrorType.unknown,
        ));
      }
    }
  }

  /// Load all incidents for current guard
  Future<void> _onLoadIncidents(
    LoadIncidentsEvent event,
    Emitter<IncidentState> emit,
  ) async {
    emit(const IncidentLoading());

    try {
      final currentUser = _supabase.auth.currentUser;
      if (currentUser == null) {
        emit(const IncidentError(
          message: 'User not authenticated',
          errorType: IncidentErrorType.permissionError,
        ));
        return;
      }

      // Build query
      var query = _supabase
          .from('incidents')
          .select('''
            id,
            incident_type,
            location_gate_id,
            location_property_id,
            description,
            severity,
            status,
            evidence_photo_urls,
            created_at,
            resolved_at,
            resolution_notes,
            gates(name),
            properties(address)
          ''')
          .eq('reported_by_security_id', currentUser.id)
          .order('created_at', ascending: false);

      // Apply filters
      if (event.severityFilter != null) {
        query = query.eq('severity', event.severityFilter!);
      }

      if (event.statusFilter != null) {
        query = query.eq('status', event.statusFilter!);
      }

      if (event.startDate != null) {
        query = query.gte('created_at', event.startDate!.toIso8601String());
      }

      if (event.endDate != null) {
        query = query.lte('created_at', event.endDate!.toIso8601String());
      }

      final incidents = await query as List<dynamic>;

      // Cache incidents locally
      for (final incident in incidents) {
        await _cacheIncident(incident);
      }

      emit(IncidentLoaded(
        incidents: incidents.cast<Map<String, dynamic>>(),
        loadedAt: DateTime.now(),
      ));
    } on PostgrestException catch (e) {
      // Try to load from cache if network error
      final cachedIncidents = await _loadCachedIncidents();
      if (cachedIncidents.isNotEmpty) {
        emit(IncidentLoaded(
          incidents: cachedIncidents,
          loadedAt: DateTime.now(),
        ));
      } else {
        emit(IncidentError(
          message: 'Database error: ${e.message}',
          errorType: IncidentErrorType.networkError,
        ));
      }
    } catch (e) {
      // Try to load from cache
      final cachedIncidents = await _loadCachedIncidents();
      if (cachedIncidents.isNotEmpty) {
        emit(IncidentLoaded(
          incidents: cachedIncidents,
          loadedAt: DateTime.now(),
        ));
      } else {
        emit(IncidentError(
          message: 'Error loading incidents: ${e.toString()}',
          errorType: IncidentErrorType.unknown,
        ));
      }
    }
  }

  /// Load single incident detail
  Future<void> _onLoadIncidentDetail(
    LoadIncidentDetailEvent event,
    Emitter<IncidentState> emit,
  ) async {
    emit(const IncidentLoading());

    try {
      final incident = await _supabase
          .from('incidents')
          .select('''
            id,
            incident_type,
            location_gate_id,
            location_property_id,
            description,
            severity,
            status,
            evidence_photo_urls,
            created_at,
            resolved_at,
            resolution_notes,
            resolved_by_admin_id,
            gates(name),
            properties(address),
            user_profiles!incidents_resolved_by_admin_id_fkey(first_name, last_name)
          ''')
          .eq('id', event.incidentId)
          .single();

      emit(IncidentDetailLoaded(incident: incident));
    } catch (e) {
      emit(IncidentError(
        message: 'Error loading incident detail: ${e.toString()}',
        errorType: IncidentErrorType.unknown,
      ));
    }
  }

  /// Refresh incidents list
  Future<void> _onRefreshIncidents(
    RefreshIncidentsEvent event,
    Emitter<IncidentState> emit,
  ) async {
    add(const LoadIncidentsEvent());
  }

  /// Cache incident locally for offline viewing
  Future<void> _cacheIncident(Map<String, dynamic> incident) async {
    try {
      final box = await Hive.openBox('cached_incidents');
      await box.put(incident['id'], incident);
    } catch (e) {
      // Silently fail cache writes
    }
  }

  /// Load cached incidents from Hive
  Future<List<Map<String, dynamic>>> _loadCachedIncidents() async {
    try {
      final box = await Hive.openBox('cached_incidents');
      return box.values.cast<Map<String, dynamic>>().toList();
    } catch (e) {
      return [];
    }
  }

  /// Store draft incident locally when offline
  Future<void> _storeDraftLocally(CreateIncidentEvent event) async {
    try {
      final box = await Hive.openBox('incident_drafts');
      final draft = {
        'incident_type': event.incidentType,
        'location_gate_id': event.locationGateId,
        'location_property_id': event.locationPropertyId,
        'description': event.description,
        'severity': event.severity,
        'photo_urls': event.photoUrls,
        'video_urls': event.videoUrls,
        'gps_coordinates': event.gpsCoordinates,
        'involved_parties': event.involvedParties,
        'created_at': DateTime.now().toIso8601String(),
      };
      await box.add(draft);
    } catch (e) {
      // Silently fail draft storage
    }
  }

  /// Send critical incident alert to admin
  Future<void> _sendCriticalIncidentAlert(String incidentId, String description) async {
    try {
      // This will trigger the database trigger for critical incidents
      // Additional notification logic can be added here if needed
      // For now, the trigger handles it
    } catch (e) {
      // Silently fail alerts
    }
  }
}

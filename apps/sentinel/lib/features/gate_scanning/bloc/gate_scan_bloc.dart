/**
 * Gate Scan BLoC for Sentinel app
 * Manages RFID scanning, sticker validation, offline cache checks, and entry logging
 */

import 'package:bloc/bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'gate_scan_event.dart';
import 'gate_scan_state.dart';

class GateScanBloc extends Bloc<GateScanEvent, GateScanState> {
  final SupabaseClient _supabase;

  GateScanBloc({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client,
        super(const GateScanIdle()) {
    on<RfidScanned>(_onRfidScanned);
    on<ManualEntryRequested>(_onManualEntryRequested);
    on<CurfewOverrideRequested>(_onCurfewOverrideRequested);
    on<ScanReset>(_onScanReset);
  }

  Future<void> _onRfidScanned(
    RfidScanned event,
    Emitter<GateScanState> emit,
  ) async {
    emit(const GateScanProcessing());

    try {
      // Step 1: Fetch sticker information with household and resident details
      final stickerResponse = await _supabase
          .from('vehicle_stickers')
          .select('''
            id,
            rfid_serial,
            vehicle_plate,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            sticker_type,
            status,
            expiration_date,
            household_id,
            households!inner(
              id,
              property_id,
              properties!inner(
                address
              ),
              user_profiles!inner(
                first_name,
                last_name,
                phone
              )
            )
          ''')
          .eq('rfid_serial', event.rfidSerial)
          .maybeSingle();

      // Step 2: Validate sticker exists
      if (stickerResponse == null) {
        emit(const GateScanError(
          message: 'Invalid RFID sticker. Please contact admin.',
          errorType: ScanErrorType.invalidSticker,
        ));
        return;
      }

      // Step 3: Check sticker status
      final status = stickerResponse['status'] as String;
      if (status != 'active') {
        emit(GateScanError(
          message: 'Sticker is $status. Access denied.',
          errorType: ScanErrorType.inactiveSticker,
        ));
        return;
      }

      // Step 4: Check expiration
      final expirationDate = DateTime.parse(stickerResponse['expiration_date'] as String);
      if (expirationDate.isBefore(DateTime.now())) {
        emit(GateScanError(
          message: 'Sticker expired on ${expirationDate.toLocal().toString().substring(0, 10)}. Please renew.',
          errorType: ScanErrorType.expiredSticker,
        ));
        return;
      }

      // Step 4.5: Check curfew rules
      final curfewViolation = await _checkCurfewViolation();
      if (curfewViolation != null) {
        // Extract resident info early for curfew warning
        final household = stickerResponse['households'] as Map<String, dynamic>;
        final property = household['properties'] as Map<String, dynamic>;
        final userProfile = household['user_profiles'] as Map<String, dynamic>;

        final residentInfo = {
          'name': '${userProfile['first_name']} ${userProfile['last_name']}',
          'phone': userProfile['phone'],
          'address': property['address'],
          'household_id': household['id'],
        };

        final stickerInfo = {
          'id': stickerResponse['id'],
          'rfid_serial': stickerResponse['rfid_serial'],
          'vehicle_plate': stickerResponse['vehicle_plate'],
          'vehicle_make': stickerResponse['vehicle_make'],
          'vehicle_model': stickerResponse['vehicle_model'],
          'vehicle_color': stickerResponse['vehicle_color'],
          'sticker_type': stickerResponse['sticker_type'],
        };

        emit(GateScanCurfewWarning(
          stickerInfo: stickerInfo,
          residentInfo: residentInfo,
          curfewRule: curfewViolation,
          rfidSerial: event.rfidSerial,
          gateId: event.gateId,
        ));
        return;
      }

      // Step 5: Log entry
      final logResponse = await _supabase
          .from('entry_exit_logs')
          .insert({
            'gate_id': event.gateId,
            'entry_type': 'resident',
            'direction': 'entry',
            'timestamp': DateTime.now().toIso8601String(),
            'sticker_id': stickerResponse['id'],
            'guard_on_duty_id': _supabase.auth.currentUser?.id,
            'vehicle_plate': stickerResponse['vehicle_plate'],
          })
          .select()
          .single();

      // Step 6: Extract resident info
      final household = stickerResponse['households'] as Map<String, dynamic>;
      final property = household['properties'] as Map<String, dynamic>;
      final userProfile = household['user_profiles'] as Map<String, dynamic>;

      final residentInfo = {
        'name': '${userProfile['first_name']} ${userProfile['last_name']}',
        'phone': userProfile['phone'],
        'address': property['address'],
        'household_id': household['id'],
      };

      // Step 7: Emit success state
      emit(GateScanSuccess(
        stickerInfo: {
          'id': stickerResponse['id'],
          'rfid_serial': stickerResponse['rfid_serial'],
          'vehicle_plate': stickerResponse['vehicle_plate'],
          'vehicle_make': stickerResponse['vehicle_make'],
          'vehicle_model': stickerResponse['vehicle_model'],
          'vehicle_color': stickerResponse['vehicle_color'],
          'sticker_type': stickerResponse['sticker_type'],
        },
        residentInfo: residentInfo,
        logId: logResponse['id'] as String,
        timestamp: DateTime.parse(logResponse['timestamp'] as String),
      ));
    } on PostgrestException catch (e) {
      emit(GateScanError(
        message: 'Database error: ${e.message}',
        errorType: ScanErrorType.networkError,
      ));
    } catch (e) {
      emit(GateScanError(
        message: 'Error processing scan: ${e.toString()}',
        errorType: ScanErrorType.unknown,
      ));
    }
  }

  Future<void> _onManualEntryRequested(
    ManualEntryRequested event,
    Emitter<GateScanState> emit,
  ) async {
    emit(const GateScanProcessing());

    try {
      // Look up sticker by vehicle plate
      final stickerResponse = await _supabase
          .from('vehicle_stickers')
          .select('''
            id,
            rfid_serial,
            vehicle_plate,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            sticker_type,
            status,
            expiration_date,
            household_id,
            households!inner(
              id,
              property_id,
              properties!inner(
                address
              ),
              user_profiles!inner(
                first_name,
                last_name,
                phone
              )
            )
          ''')
          .eq('vehicle_plate', event.vehiclePlate)
          .eq('status', 'active')
          .maybeSingle();

      if (stickerResponse == null) {
        emit(const GateScanError(
          message: 'No active sticker found for this vehicle plate',
          errorType: ScanErrorType.invalidSticker,
        ));
        return;
      }

      // Check expiration
      final expirationDate = DateTime.parse(stickerResponse['expiration_date'] as String);
      if (expirationDate.isBefore(DateTime.now())) {
        emit(const GateScanError(
          message: 'Vehicle sticker has expired',
          errorType: ScanErrorType.expiredSticker,
        ));
        return;
      }

      // Log manual entry
      final logResponse = await _supabase
          .from('entry_exit_logs')
          .insert({
            'gate_id': event.gateId,
            'entry_type': 'resident',
            'direction': 'entry',
            'timestamp': DateTime.now().toIso8601String(),
            'sticker_id': stickerResponse['id'],
            'guard_on_duty_id': _supabase.auth.currentUser?.id,
            'vehicle_plate': event.vehiclePlate,
            'purpose': event.purpose,
            'notes': 'Manual entry - RFID scan failed',
          })
          .select()
          .single();

      // Extract resident info
      final household = stickerResponse['households'] as Map<String, dynamic>;
      final property = household['properties'] as Map<String, dynamic>;
      final userProfile = household['user_profiles'] as Map<String, dynamic>;

      final residentInfo = {
        'name': '${userProfile['first_name']} ${userProfile['last_name']}',
        'phone': userProfile['phone'],
        'address': property['address'],
        'household_id': household['id'],
      };

      emit(GateScanSuccess(
        stickerInfo: {
          'id': stickerResponse['id'],
          'rfid_serial': stickerResponse['rfid_serial'],
          'vehicle_plate': stickerResponse['vehicle_plate'],
          'vehicle_make': stickerResponse['vehicle_make'],
          'vehicle_model': stickerResponse['vehicle_model'],
          'vehicle_color': stickerResponse['vehicle_color'],
          'sticker_type': stickerResponse['sticker_type'],
        },
        residentInfo: residentInfo,
        logId: logResponse['id'] as String,
        timestamp: DateTime.parse(logResponse['timestamp'] as String),
      ));
    } catch (e) {
      emit(GateScanError(
        message: 'Error processing manual entry: ${e.toString()}',
        errorType: ScanErrorType.unknown,
      ));
    }
  }

  void _onScanReset(
    ScanReset event,
    Emitter<GateScanState> emit,
  ) {
    emit(const GateScanIdle());
  }

  /// Check if current time violates curfew rules
  /// Returns the rule description if violation found, null otherwise
  Future<String?> _checkCurfewViolation() async {
    try {
      final now = DateTime.now();
      final currentTime = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:00';

      // Fetch active curfew rules
      final curfewRules = await _supabase
          .from('village_rules')
          .select('title, description')
          .eq('category', 'curfew')
          .not('published_at', 'is', null)
          .lte('effective_date', now.toIso8601String().substring(0, 10))
          .limit(1)
          .maybeSingle();

      if (curfewRules == null) {
        return null; // No curfew rules in effect
      }

      // Parse curfew hours from description (assuming format like "22:00-06:00")
      // For production, you might want to add specific time columns to the rules table
      final description = curfewRules['description'] as String;
      final timePattern = RegExp(r'(\d{2}:\d{2})-(\d{2}:\d{2})');
      final match = timePattern.firstMatch(description);

      if (match != null) {
        final startTime = match.group(1)!;
        final endTime = match.group(2)!;

        // Check if current time is within curfew hours
        if (_isTimeBetween(currentTime, startTime, endTime)) {
          return '${curfewRules['title']}: $description';
        }
      }

      return null;
    } catch (e) {
      // If error checking curfew, allow entry (fail open)
      return null;
    }
  }

  /// Helper to check if current time is between start and end times
  /// Handles overnight ranges (e.g., 22:00-06:00)
  bool _isTimeBetween(String current, String start, String end) {
    final currentMinutes = _timeToMinutes(current);
    final startMinutes = _timeToMinutes(start);
    final endMinutes = _timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 08:00-17:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00-06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /// Convert time string (HH:MM:SS) to minutes since midnight
  int _timeToMinutes(String time) {
    final parts = time.split(':');
    return int.parse(parts[0]) * 60 + int.parse(parts[1]);
  }

  /// Handle curfew override with justification
  Future<void> _onCurfewOverrideRequested(
    CurfewOverrideRequested event,
    Emitter<GateScanState> emit,
  ) async {
    emit(const GateScanProcessing());

    try {
      // Log entry with curfew override
      final logResponse = await _supabase
          .from('entry_exit_logs')
          .insert({
            'gate_id': event.gateId,
            'entry_type': 'resident',
            'direction': 'entry',
            'timestamp': DateTime.now().toIso8601String(),
            'sticker_id': event.stickerInfo['id'],
            'guard_on_duty_id': _supabase.auth.currentUser?.id,
            'vehicle_plate': event.stickerInfo['vehicle_plate'],
            'notes': 'CURFEW OVERRIDE: ${event.overrideReason}',
            'override_reason': event.overrideReason,
          })
          .select()
          .single();

      // Log curfew violation alert
      await _supabase
          .from('incidents')
          .insert({
            'tenant_id': _supabase.auth.currentUser?.userMetadata?['tenant_id'],
            'reported_by_security_id': _supabase.auth.currentUser?.id,
            'incident_type': 'other',
            'location_gate_id': event.gateId,
            'description': 'Curfew override granted for ${event.residentInfo['name']} (${event.stickerInfo['vehicle_plate']}). Reason: ${event.overrideReason}',
            'severity': 'low',
            'status': 'reported',
          });

      emit(GateScanSuccess(
        stickerInfo: event.stickerInfo,
        residentInfo: event.residentInfo,
        logId: logResponse['id'] as String,
        timestamp: DateTime.parse(logResponse['timestamp'] as String),
      ));
    } catch (e) {
      emit(GateScanError(
        message: 'Error processing curfew override: ${e.toString()}',
        errorType: ScanErrorType.unknown,
      ));
    }
  }
}

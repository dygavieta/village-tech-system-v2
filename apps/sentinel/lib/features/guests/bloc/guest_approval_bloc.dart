/**
 * Guest Approval BLoC
 * Manages walk-in visitor approval requests with realtime subscriptions
 */

import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'guest_approval_event.dart';
import 'guest_approval_state.dart';

class GuestApprovalBloc extends Bloc<GuestApprovalEvent, GuestApprovalState> {
  final SupabaseClient _supabase;
  RealtimeChannel? _channel;
  Timer? _timeoutTimer;
  Timer? _countdownTimer;
  int _remainingSeconds = 120;

  GuestApprovalBloc({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client,
        super(const ApprovalIdle()) {
    on<ApprovalRequested>(_onApprovalRequested);
    on<ApprovalReset>(_onApprovalReset);
  }

  Future<void> _onApprovalRequested(
    ApprovalRequested event,
    Emitter<GuestApprovalState> emit,
  ) async {
    try {
      // Call Edge Function to create approval request
      final response = await _supabase.functions.invoke(
        'request-guest-approval',
        body: {
          'household_id': event.householdId,
          'guest_name': event.guestName,
          'vehicle_plate': event.vehiclePlate,
          'gate_id': event.gateId,
        },
      );

      if (response.status != 202) {
        emit(ApprovalError(message: 'Failed to send approval request'));
        return;
      }

      final data = response.data as Map<String, dynamic>;
      final requestId = data['approval_request_id'] as String;

      // Start realtime subscription
      _subscribeToApproval(requestId, event.guestName, emit);

      // Start timeout (2 minutes)
      _remainingSeconds = 120;
      emit(ApprovalWaiting(
        requestId: requestId,
        guestName: event.guestName,
        remainingSeconds: _remainingSeconds,
      ));

      // Countdown timer
      _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        _remainingSeconds--;
        if (state is ApprovalWaiting) {
          emit(ApprovalWaiting(
            requestId: requestId,
            guestName: event.guestName,
            remainingSeconds: _remainingSeconds,
          ));
        }
      });

      // Timeout timer
      _timeoutTimer = Timer(const Duration(minutes: 2), () {
        if (state is ApprovalWaiting) {
          _cleanup();
          emit(ApprovalTimeout(guestName: event.guestName));
        }
      });
    } catch (e) {
      emit(ApprovalError(message: e.toString()));
    }
  }

  void _subscribeToApproval(
    String requestId,
    String guestName,
    Emitter<GuestApprovalState> emit,
  ) {
    _channel = _supabase
        .channel('guest_approval_$requestId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'guest_approval_requests',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: requestId,
          ),
          callback: (payload) {
            final newRecord = payload.newRecord;
            final status = newRecord['status'] as String;

            if (status == 'approved') {
              _cleanup();
              emit(ApprovalApproved(
                guestName: guestName,
                response: newRecord['response'] as String?,
              ));
            } else if (status == 'rejected') {
              _cleanup();
              emit(ApprovalRejected(
                guestName: guestName,
                reason: newRecord['response'] as String?,
              ));
            } else if (status == 'timeout') {
              _cleanup();
              emit(ApprovalTimeout(guestName: guestName));
            }
          },
        )
        .subscribe();
  }

  void _onApprovalReset(
    ApprovalReset event,
    Emitter<GuestApprovalState> emit,
  ) {
    _cleanup();
    emit(const ApprovalIdle());
  }

  void _cleanup() {
    _timeoutTimer?.cancel();
    _countdownTimer?.cancel();
    _channel?.unsubscribe();
    _timeoutTimer = null;
    _countdownTimer = null;
    _channel = null;
  }

  @override
  Future<void> close() {
    _cleanup();
    return super.close();
  }
}

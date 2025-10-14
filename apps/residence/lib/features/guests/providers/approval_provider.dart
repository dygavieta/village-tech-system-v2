// Residence App - Guest Approval Provider
// User Story 4: Security Officer Manages Gate Entry/Exit (Residence side)
// Purpose: Subscribe to realtime guest approval requests and handle notifications

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/notifications/notification_service.dart';

// Guest approval request model
class GuestApprovalRequest {
  final String id;
  final String householdId;
  final String guestName;
  final String? vehiclePlate;
  final String gateId;
  final DateTime timeoutAt;
  final String status;

  GuestApprovalRequest({
    required this.id,
    required this.householdId,
    required this.guestName,
    this.vehiclePlate,
    required this.gateId,
    required this.timeoutAt,
    required this.status,
  });

  factory GuestApprovalRequest.fromJson(Map<String, dynamic> json) {
    return GuestApprovalRequest(
      id: json['id'] as String,
      householdId: json['household_id'] as String,
      guestName: json['guest_name'] as String,
      vehiclePlate: json['vehicle_plate'] as String?,
      gateId: json['gate_id'] as String,
      timeoutAt: DateTime.parse(json['timeout_at'] as String),
      status: json['status'] as String,
    );
  }
}

// Provider for listening to approval requests
final guestApprovalStreamProvider = StreamProvider<GuestApprovalRequest?>((ref) {
  final supabase = Supabase.instance.client;
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    return Stream.value(null);
  }

  // Subscribe to guest_approval_requests for this household
  final channel = supabase
      .channel('guest_approvals_$userId')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'guest_approval_requests',
        callback: (payload) {
          final newRecord = payload.newRecord;

          // Show notification
          NotificationService.showLocalNotification(
            title: 'Guest Approval Request',
            body: '${newRecord['guest_name']} is at the gate',
            payload: newRecord['id'] as String,
          );
        },
      )
      .subscribe();

  return Stream.empty(); // Return empty stream for now
});

// Provider for responding to approval requests
final approvalResponseProvider = Provider((ref) => ApprovalResponseService());

class ApprovalResponseService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<void> approveGuest(String requestId, {String? response}) async {
    await _supabase
        .from('guest_approval_requests')
        .update({
          'status': 'approved',
          'response': response,
          'responded_at': DateTime.now().toIso8601String(),
        })
        .eq('id', requestId);
  }

  Future<void> rejectGuest(String requestId, {String? reason}) async {
    await _supabase
        .from('guest_approval_requests')
        .update({
          'status': 'rejected',
          'response': reason,
          'responded_at': DateTime.now().toIso8601String(),
        })
        .eq('id', requestId);
  }

  Future<List<GuestApprovalRequest>> getPendingRequests(String householdId) async {
    final response = await _supabase
        .from('guest_approval_requests')
        .select()
        .eq('household_id', householdId)
        .eq('status', 'pending')
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => GuestApprovalRequest.fromJson(json))
        .toList();
  }
}

/**
 * Permit Verification BLoC for Sentinel app
 * Manages construction permit validation and worker verification
 */

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// Events
abstract class PermitVerificationEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class PermitSearchRequested extends PermitVerificationEvent {
  final String address;
  PermitSearchRequested(this.address);
  @override
  List<Object?> get props => [address];
}

class WorkerVerificationRequested extends PermitVerificationEvent {
  final String permitId;
  final String workerName;
  WorkerVerificationRequested(this.permitId, this.workerName);
  @override
  List<Object?> get props => [permitId, workerName];
}

// States
abstract class PermitVerificationState extends Equatable {
  @override
  List<Object?> get props => [];
}

class PermitIdle extends PermitVerificationState {}

class PermitLoading extends PermitVerificationState {}

class PermitsFound extends PermitVerificationState {
  final List<Map<String, dynamic>> permits;
  PermitsFound(this.permits);
  @override
  List<Object?> get props => [permits];
}

class WorkerVerified extends PermitVerificationState {
  final String workerName;
  final bool isValid;
  WorkerVerified(this.workerName, this.isValid);
  @override
  List<Object?> get props => [workerName, isValid];
}

class PermitError extends PermitVerificationState {
  final String message;
  PermitError(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class PermitVerificationBloc extends Bloc<PermitVerificationEvent, PermitVerificationState> {
  final SupabaseClient _supabase;

  PermitVerificationBloc({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client,
        super(PermitIdle()) {
    on<PermitSearchRequested>(_onPermitSearchRequested);
    on<WorkerVerificationRequested>(_onWorkerVerificationRequested);
  }

  Future<void> _onPermitSearchRequested(
    PermitSearchRequested event,
    Emitter<PermitVerificationState> emit,
  ) async {
    emit(PermitLoading());

    try {
      final response = await _supabase
          .from('construction_permits')
          .select('''
            *,
            households!inner(
              properties!inner(address),
              user_profiles!inner(first_name, last_name)
            )
          ''')
          .eq('permit_status', 'approved')
          .gte('start_date', DateTime.now().subtract(const Duration(days: 30)).toIso8601String());

      final permits = List<Map<String, dynamic>>.from(response);
      final searchTerm = event.address.toLowerCase();
      final filtered = permits.where((p) {
        final household = p['households'] as Map<String, dynamic>;
        final property = household['properties'] as Map<String, dynamic>;
        final address = (property['address'] as String).toLowerCase();
        return address.contains(searchTerm);
      }).toList();

      emit(PermitsFound(filtered));
    } catch (e) {
      emit(PermitError(e.toString()));
    }
  }

  Future<void> _onWorkerVerificationRequested(
    WorkerVerificationRequested event,
    Emitter<PermitVerificationState> emit,
  ) async {
    emit(PermitLoading());

    try {
      final response = await _supabase
          .from('construction_permits')
          .select('worker_list')
          .eq('id', event.permitId)
          .single();

      final workerList = response['worker_list'] as List?;
      final isValid = workerList?.any((w) {
            final name = (w['name'] as String).toLowerCase();
            return name.contains(event.workerName.toLowerCase());
          }) ??
          false;

      emit(WorkerVerified(event.workerName, isValid));
    } catch (e) {
      emit(PermitError(e.toString()));
    }
  }
}

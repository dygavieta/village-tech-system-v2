// Residence App - Fee Provider (T165)
// Phase 7 User Story 5: Residence Mobile App - Association Fees Module
// Purpose: Riverpod providers for association fees and payments

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../models/association_fee.dart';

/// Provider for all fees for the current household
final feesProvider = StreamProvider.autoDispose<List<AssociationFee>>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentUser?.id;

  if (userId == null) {
    return Stream.value([]);
  }

  // First, get the household_id for the current user
  return supabase
      .from('household_members')
      .stream(primaryKey: ['id'])
      .eq('user_id', userId)
      .map((members) {
        if (members.isEmpty) return <AssociationFee>[];

        final householdId = members.first['household_id'] as String;

        // Then get fees for this household
        return supabase
            .from('association_fees')
            .stream(primaryKey: ['id'])
            .eq('household_id', householdId)
            .order('due_date', ascending: false)
            .map((data) {
              return data.map((json) => AssociationFee.fromJson(json)).toList();
            });
      })
      .asyncExpand((stream) => stream);
});

/// Provider for unpaid fees
final unpaidFeesProvider = StreamProvider.autoDispose<List<AssociationFee>>((ref) {
  final feesAsync = ref.watch(feesProvider);

  return feesAsync.when(
    data: (fees) {
      final unpaid = fees.where((f) => !f.isPaid).toList();
      return Stream.value(unpaid);
    },
    loading: () => Stream.value([]),
    error: (err, stack) => Stream.value([]),
  );
});

/// Provider for overdue fees
final overdueFeesProvider = StreamProvider.autoDispose<List<AssociationFee>>((ref) {
  final feesAsync = ref.watch(feesProvider);

  return feesAsync.when(
    data: (fees) {
      final overdue = fees.where((f) => f.isOverdue).toList();
      return Stream.value(overdue);
    },
    loading: () => Stream.value([]),
    error: (err, stack) => Stream.value([]),
  );
});

/// Provider for paid fees
final paidFeesProvider = StreamProvider.autoDispose<List<AssociationFee>>((ref) {
  final feesAsync = ref.watch(feesProvider);

  return feesAsync.when(
    data: (fees) {
      final paid = fees.where((f) => f.isPaid).toList();
      return Stream.value(paid);
    },
    loading: () => Stream.value([]),
    error: (err, stack) => Stream.value([]),
  );
});

/// Provider for total amount due
final totalAmountDueProvider = StreamProvider.autoDispose<double>((ref) {
  final unpaidAsync = ref.watch(unpaidFeesProvider);

  return unpaidAsync.when(
    data: (fees) {
      final total = fees.fold<double>(0, (sum, fee) => sum + fee.totalAmount);
      return Stream.value(total);
    },
    loading: () => Stream.value(0),
    error: (err, stack) => Stream.value(0),
  );
});

/// Provider for single fee detail
final feeDetailProvider =
    StreamProvider.autoDispose.family<AssociationFee?, String>((ref, feeId) {
  final supabase = ref.watch(supabaseClientProvider);

  return supabase
      .from('association_fees')
      .stream(primaryKey: ['id'])
      .eq('id', feeId)
      .map((data) {
        if (data.isEmpty) return null;
        return AssociationFee.fromJson(data.first);
      });
});

/// Provider for fee statistics
final feeStatisticsProvider = StreamProvider.autoDispose<FeeStatistics>((ref) {
  final feesAsync = ref.watch(feesProvider);

  return feesAsync.when(
    data: (fees) {
      final unpaid = fees.where((f) => !f.isPaid).length;
      final overdue = fees.where((f) => f.isOverdue).length;
      final paid = fees.where((f) => f.isPaid).length;
      final totalDue = fees
          .where((f) => !f.isPaid)
          .fold<double>(0, (sum, fee) => sum + fee.totalAmount);

      return Stream.value(FeeStatistics(
        totalFees: fees.length,
        unpaidCount: unpaid,
        overdueCount: overdue,
        paidCount: paid,
        totalAmountDue: totalDue,
      ));
    },
    loading: () => Stream.value(FeeStatistics.empty()),
    error: (err, stack) => Stream.value(FeeStatistics.empty()),
  );
});

/// Notifier for fee payment actions
class FeeNotifier extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {
    // No initial build needed
  }

  /// Create Stripe payment intent
  Future<String> createPaymentIntent(String feeId, double amount) async {
    state = const AsyncLoading();

    try {
      final supabase = ref.read(supabaseClientProvider);

      // Call edge function to create payment intent
      final response = await supabase.functions.invoke(
        'create-payment-intent',
        body: {
          'fee_id': feeId,
          'amount': (amount * 100).toInt(), // Convert to cents
        },
      );

      final data = response.data as Map<String, dynamic>;
      final clientSecret = data['client_secret'] as String;

      state = const AsyncData(null);
      return clientSecret;
    } catch (e, stack) {
      state = AsyncError(e, stack);
      rethrow;
    }
  }

  /// Confirm payment after Stripe success
  /// T177: Optimistic update - marks fee as paid immediately
  Future<void> confirmPayment({
    required String feeId,
    required String paymentIntentId,
    required double paidAmount,
  }) async {
    state = const AsyncLoading();

    try {
      final supabase = ref.read(supabaseClientProvider);

      // Optimistic update happens at the stream provider level
      // The fee will automatically update via Supabase realtime
      await supabase.from('association_fees').update({
        'status': 'paid',
        'paid_amount': paidAmount,
        'paid_date': DateTime.now().toIso8601String(),
        'payment_intent_id': paymentIntentId,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', feeId);

      state = const AsyncData(null);
    } catch (e, stack) {
      state = AsyncError(e, stack);
      rethrow;
    }
  }

  /// Get payment receipt URL
  Future<String?> getReceiptUrl(String paymentIntentId) async {
    try {
      final supabase = ref.read(supabaseClientProvider);

      final response = await supabase.functions.invoke(
        'get-payment-receipt',
        body: {'payment_intent_id': paymentIntentId},
      );

      final data = response.data as Map<String, dynamic>;
      return data['receipt_url'] as String?;
    } catch (e) {
      return null;
    }
  }

  /// Download receipt
  Future<void> downloadReceipt(String receiptUrl) async {
    // TODO: Implement receipt download
    // This would typically use url_launcher or similar package
    throw UnimplementedError('Receipt download not yet implemented');
  }
}

final feeNotifierProvider = AutoDisposeAsyncNotifierProvider<FeeNotifier, void>(
  FeeNotifier.new,
);

/// Fee statistics model
class FeeStatistics {
  final int totalFees;
  final int unpaidCount;
  final int overdueCount;
  final int paidCount;
  final double totalAmountDue;

  FeeStatistics({
    required this.totalFees,
    required this.unpaidCount,
    required this.overdueCount,
    required this.paidCount,
    required this.totalAmountDue,
  });

  factory FeeStatistics.empty() {
    return FeeStatistics(
      totalFees: 0,
      unpaidCount: 0,
      overdueCount: 0,
      paidCount: 0,
      totalAmountDue: 0,
    );
  }
}

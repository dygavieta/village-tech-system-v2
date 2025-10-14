// Residence App - Fee Payment Screen (T164)
// Phase 7 User Story 5: Residence Mobile App - Fee Payment with Stripe
// Purpose: Pay association fees using Stripe payment sheet

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_stripe/flutter_stripe.dart' hide Card;
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/association_fee.dart';
import '../providers/fee_provider.dart';

class FeePaymentScreen extends ConsumerStatefulWidget {
  final String feeId;

  const FeePaymentScreen({
    super.key,
    required this.feeId,
  });

  @override
  ConsumerState<FeePaymentScreen> createState() => _FeePaymentScreenState();
}

class _FeePaymentScreenState extends ConsumerState<FeePaymentScreen> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final feeAsync = ref.watch(feeDetailProvider(widget.feeId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pay Fee'),
      ),
      body: feeAsync.when(
        data: (fee) {
          if (fee == null) {
            return _buildNotFoundState();
          }

          if (fee.isPaid) {
            return _buildAlreadyPaidState(fee);
          }

          return _buildPaymentForm(fee);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(error),
      ),
    );
  }

  Widget _buildPaymentForm(AssociationFee fee) {
    final dateFormat = DateFormat('MMMM dd, yyyy');
    final currencyFormat = NumberFormat.currency(symbol: '\$');

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Fee details header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).colorScheme.primary,
                  width: 2,
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fee.feeTypeDisplay,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  fee.description,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Due: ${dateFormat.format(fee.dueDate)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onPrimaryContainer,
                          ),
                    ),
                  ],
                ),
                if (fee.isOverdue) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.warning, size: 16, color: Colors.red),
                        const SizedBox(width: 8),
                        Text(
                          '${fee.daysOverdue} days overdue',
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Payment breakdown
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Payment Breakdown',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),

                // Base amount
                _buildAmountRow(
                  'Base Amount',
                  currencyFormat.format(fee.baseAmount),
                ),
                const SizedBox(height: 12),

                // Late fee (if applicable)
                if (fee.lateFeeAmount != null && fee.lateFeeAmount! > 0) ...[
                  _buildAmountRow(
                    'Late Fee',
                    currencyFormat.format(fee.lateFeeAmount),
                    isNegative: true,
                  ),
                  const SizedBox(height: 12),
                ],

                const Divider(height: 32),

                // Total amount
                _buildAmountRow(
                  'Total Amount',
                  currencyFormat.format(fee.totalAmount),
                  isTotal: true,
                ),
              ],
            ),
          ),

          // Payment information
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Card(
              color: Colors.blue.withOpacity(0.1),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Colors.blue[700],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Payment Information',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue[700],
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Your payment will be processed securely through Stripe. You will receive a receipt via email after successful payment.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Notes (if any)
          if (fee.notes != null && fee.notes!.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Additional Notes',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outline,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      fee.notes!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Pay button
          Padding(
            padding: const EdgeInsets.all(24),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isProcessing ? null : () => _initiatePayment(fee),
                icon: _isProcessing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.payment),
                label: Text(
                  _isProcessing
                      ? 'Processing...'
                      : 'Pay ${currencyFormat.format(fee.totalAmount)}',
                ),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ),

          // Powered by Stripe
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Secured by',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Stripe',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmountRow(String label, String amount,
      {bool isNegative = false, bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              ),
        ),
        Text(
          amount,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
                color: isNegative ? Colors.red : null,
                fontSize: isTotal ? 20 : null,
              ),
        ),
      ],
    );
  }

  Widget _buildAlreadyPaidState(AssociationFee fee) {
    final dateFormat = DateFormat('MMMM dd, yyyy \'at\' hh:mm a');
    final currencyFormat = NumberFormat.currency(symbol: '\$');

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle,
              size: 80,
              color: Colors.green[600],
            ),
            const SizedBox(height: 24),
            Text(
              'Already Paid',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.green[700],
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              fee.description,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Amount Paid:'),
                      Text(
                        currencyFormat.format(fee.paidAmount),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Payment Date:'),
                      Text(
                        dateFormat.format(fee.paidDate!),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (fee.receiptUrl != null)
              FilledButton.icon(
                onPressed: () {
                  // TODO: Download receipt
                },
                icon: const Icon(Icons.receipt),
                label: const Text('Download Receipt'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotFoundState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'Fee Not Found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'This fee does not exist or has been removed',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Error Loading Fee',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error.toString(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _initiatePayment(AssociationFee fee) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      // Step 1: Create payment intent
      final clientSecret = await ref
          .read(feeNotifierProvider.notifier)
          .createPaymentIntent(fee.id, fee.totalAmount);

      // Step 2: Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Village Association',
          style: Theme.of(context).brightness == Brightness.dark
              ? ThemeMode.dark
              : ThemeMode.light,
        ),
      );

      // Step 3: Present payment sheet
      await Stripe.instance.presentPaymentSheet();

      // Step 4: Payment successful - confirm in backend
      if (mounted) {
        await _confirmPayment(fee);
      }
    } on StripeException catch (e) {
      if (mounted) {
        String message = 'Payment failed';

        switch (e.error.code) {
          case FailureCode.Canceled:
            message = 'Payment cancelled';
            break;
          case FailureCode.Failed:
            message = 'Payment failed. Please try again.';
            break;
          case FailureCode.Timeout:
            message = 'Payment timed out. Please try again.';
            break;
          default:
            message = e.error.localizedMessage ?? 'Payment failed';
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('An error occurred: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  Future<void> _confirmPayment(AssociationFee fee) async {
    try {
      // Get payment intent ID from Stripe
      // Note: In production, this should be retrieved from the payment result
      final paymentIntentId = 'pi_${DateTime.now().millisecondsSinceEpoch}';

      await ref.read(feeNotifierProvider.notifier).confirmPayment(
            feeId: fee.id,
            paymentIntentId: paymentIntentId,
            paidAmount: fee.totalAmount,
          );

      if (mounted) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful!'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate back to fees list
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to confirm payment: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}

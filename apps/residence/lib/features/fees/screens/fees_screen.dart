// Residence App - Fees Screen (T163)
// Phase 7 User Story 5: Residence Mobile App - Association Fees Module
// Purpose: Display list of fees with filters and payment status

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/association_fee.dart';
import '../providers/fee_provider.dart';

enum FeeFilter {
  all,
  unpaid,
  overdue,
  paid,
}

class FeesScreen extends ConsumerStatefulWidget {
  const FeesScreen({super.key});

  @override
  ConsumerState<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends ConsumerState<FeesScreen> {
  FeeFilter _selectedFilter = FeeFilter.all;

  @override
  Widget build(BuildContext context) {
    final feesAsync = _getFeesForFilter();
    final statisticsAsync = ref.watch(feeStatisticsProvider);
    final totalDueAsync = ref.watch(totalAmountDueProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Association Fees'),
      ),
      body: Column(
        children: [
          // Statistics card
          _buildStatisticsCard(statisticsAsync, totalDueAsync),
          const Divider(height: 1),

          // Filter tabs
          _buildFilterTabs(),
          const Divider(height: 1),

          // Fees list
          Expanded(
            child: feesAsync.when(
              data: (fees) {
                if (fees.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(feesProvider);
                    await Future.delayed(const Duration(milliseconds: 500));
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: fees.length,
                    itemBuilder: (context, index) {
                      final fee = fees[index];
                      return _buildFeeCard(fee);
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => _buildErrorState(error),
            ),
          ),
        ],
      ),
    );
  }

  AsyncValue<List<AssociationFee>> _getFeesForFilter() {
    switch (_selectedFilter) {
      case FeeFilter.all:
        return ref.watch(feesProvider);
      case FeeFilter.unpaid:
        return ref.watch(unpaidFeesProvider);
      case FeeFilter.overdue:
        return ref.watch(overdueFeesProvider);
      case FeeFilter.paid:
        return ref.watch(paidFeesProvider);
    }
  }

  Widget _buildStatisticsCard(
    AsyncValue<dynamic> statisticsAsync,
    AsyncValue<double> totalDueAsync,
  ) {
    return statisticsAsync.when(
      data: (stats) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Theme.of(context).colorScheme.primaryContainer,
                Theme.of(context).colorScheme.primaryContainer.withOpacity(0.7),
              ],
            ),
          ),
          child: Column(
            children: [
              Text(
                'Total Amount Due',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
              ),
              const SizedBox(height: 8),
              totalDueAsync.when(
                data: (total) => Text(
                  '\$${total.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                ),
                loading: () => const CircularProgressIndicator(),
                error: (_, __) => const Text('\$0.00'),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatItem(
                    'Unpaid',
                    stats.unpaidCount.toString(),
                    Icons.pending_actions,
                    Colors.orange,
                  ),
                  _buildStatItem(
                    'Overdue',
                    stats.overdueCount.toString(),
                    Icons.warning,
                    Colors.red,
                  ),
                  _buildStatItem(
                    'Paid',
                    stats.paidCount.toString(),
                    Icons.check_circle,
                    Colors.green,
                  ),
                ],
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox(height: 150),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildFilterTabs() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: FeeFilter.values.map((filter) {
          final isSelected = _selectedFilter == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(_getFilterLabel(filter)),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedFilter = filter;
                });
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFeeCard(AssociationFee fee) {
    final dateFormat = DateFormat('MMM dd, yyyy');
    final currencyFormat = NumberFormat.currency(symbol: '\$');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: fee.isPaid
            ? null
            : () {
                context.push('/fees/payment/${fee.id}');
              },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row with status
              Row(
                children: [
                  _buildStatusBadge(fee.status),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      fee.feeTypeDisplay,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                  ),
                  if (fee.isOverdue)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.warning, size: 14, color: Colors.red),
                          const SizedBox(width: 4),
                          Text(
                            '${fee.daysOverdue} days overdue',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.red,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                fee.description,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),

              // Amount breakdown
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Base Amount',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                        ),
                        Text(
                          currencyFormat.format(fee.baseAmount),
                          style:
                              Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  if (fee.lateFeeAmount != null && fee.lateFeeAmount! > 0) ...[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Late Fee',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Colors.red,
                                ),
                          ),
                          Text(
                            currencyFormat.format(fee.lateFeeAmount),
                            style: Theme.of(context)
                                .textTheme
                                .bodyLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),

              // Total amount
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: fee.isPaid
                      ? Colors.green.withOpacity(0.1)
                      : Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      fee.isPaid ? 'Paid Amount' : 'Total Due',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      currencyFormat.format(
                        fee.isPaid ? fee.paidAmount! : fee.totalAmount,
                      ),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: fee.isPaid ? Colors.green[700] : null,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Footer with date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        fee.isPaid ? Icons.check_circle : Icons.calendar_today,
                        size: 14,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        fee.isPaid
                            ? 'Paid: ${dateFormat.format(fee.paidDate!)}'
                            : 'Due: ${dateFormat.format(fee.dueDate)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                  if (!fee.isPaid)
                    FilledButton(
                      onPressed: () {
                        context.push('/fees/payment/${fee.id}');
                      },
                      child: const Text('Pay Now'),
                    ),
                  if (fee.isPaid && fee.receiptUrl != null)
                    TextButton.icon(
                      onPressed: () {
                        // TODO: Download receipt
                      },
                      icon: const Icon(Icons.receipt, size: 16),
                      label: const Text('Receipt'),
                    ),
                ],
              ),

              // Days until due (for unpaid fees)
              if (!fee.isPaid && !fee.isOverdue) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getDaysUntilDueColor(fee.daysUntilDue)
                        .withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.schedule,
                        size: 14,
                        color: _getDaysUntilDueColor(fee.daysUntilDue),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${fee.daysUntilDue} days remaining',
                        style: TextStyle(
                          fontSize: 11,
                          color: _getDaysUntilDueColor(fee.daysUntilDue),
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
      ),
    );
  }

  Widget _buildStatusBadge(FeeStatus status) {
    Color color;
    IconData icon;

    switch (status) {
      case FeeStatus.paid:
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case FeeStatus.overdue:
        color = Colors.red;
        icon = Icons.warning;
        break;
      case FeeStatus.unpaid:
        color = Colors.orange;
        icon = Icons.pending;
        break;
      case FeeStatus.partial:
        color = Colors.blue;
        icon = Icons.pie_chart;
        break;
      case FeeStatus.waived:
        color = Colors.grey;
        icon = Icons.remove_circle;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            _getStatusLabel(status),
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getDaysUntilDueColor(int days) {
    if (days <= 3) return Colors.red;
    if (days <= 7) return Colors.orange;
    return Colors.blue;
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.account_balance_wallet_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'No Fees Found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            _getEmptyStateMessage(),
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
            'Error Loading Fees',
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
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {
              ref.invalidate(feesProvider);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  String _getFilterLabel(FeeFilter filter) {
    switch (filter) {
      case FeeFilter.all:
        return 'All';
      case FeeFilter.unpaid:
        return 'Unpaid';
      case FeeFilter.overdue:
        return 'Overdue';
      case FeeFilter.paid:
        return 'Paid';
    }
  }

  String _getStatusLabel(FeeStatus status) {
    switch (status) {
      case FeeStatus.paid:
        return 'PAID';
      case FeeStatus.overdue:
        return 'OVERDUE';
      case FeeStatus.unpaid:
        return 'UNPAID';
      case FeeStatus.partial:
        return 'PARTIAL';
      case FeeStatus.waived:
        return 'WAIVED';
    }
  }

  String _getEmptyStateMessage() {
    switch (_selectedFilter) {
      case FeeFilter.all:
        return 'You have no association fees';
      case FeeFilter.unpaid:
        return 'You have no unpaid fees';
      case FeeFilter.overdue:
        return 'You have no overdue fees';
      case FeeFilter.paid:
        return 'You have no paid fees';
    }
  }
}

// Residence App - Curfew Screen
// Purpose: Display curfew hours and schedules

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/curfew.dart';
import '../providers/announcement_provider.dart';

class CurfewScreen extends ConsumerWidget {
  const CurfewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final curfewsAsync = ref.watch(curfewsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Curfew Hours'),
      ),
      body: curfewsAsync.when(
        data: (curfews) {
          if (curfews.isEmpty) {
            return _buildEmptyState(context);
          }

          // Find currently active curfew
          final activeCurfew = curfews.firstWhere(
            (c) => c.isCurrentlyActive,
            orElse: () => curfews.first,
          );

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(curfewsProvider);
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Current status card
                _buildCurrentStatusCard(context, activeCurfew),
                const SizedBox(height: 24),

                // All curfews section
                Text(
                  'All Curfew Schedules',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),

                ...curfews.map((curfew) => _buildCurfewCard(context, curfew)),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(context, error, ref),
      ),
    );
  }

  Widget _buildCurrentStatusCard(BuildContext context, Curfew curfew) {
    final isActive = curfew.isCurrentlyActive;

    return Card(
      color: isActive
          ? Theme.of(context).colorScheme.errorContainer
          : Theme.of(context).colorScheme.primaryContainer,
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isActive ? Icons.block : Icons.check_circle,
                  color: isActive
                      ? Theme.of(context).colorScheme.onErrorContainer
                      : Theme.of(context).colorScheme.onPrimaryContainer,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isActive ? 'Curfew Active' : 'No Curfew',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isActive
                                      ? Theme.of(context)
                                          .colorScheme
                                          .onErrorContainer
                                      : Theme.of(context)
                                          .colorScheme
                                          .onPrimaryContainer,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isActive
                            ? 'Access to the community is restricted'
                            : 'Community access is open',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: isActive
                                  ? Theme.of(context)
                                      .colorScheme
                                      .onErrorContainer
                                  : Theme.of(context)
                                      .colorScheme
                                      .onPrimaryContainer,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (isActive) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    color: Theme.of(context).colorScheme.onErrorContainer,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Current Hours: ${curfew.startTime.substring(0, 5)} - ${curfew.endTime.substring(0, 5)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color:
                              Theme.of(context).colorScheme.onErrorContainer,
                        ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCurfewCard(BuildContext context, Curfew curfew) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: Icon(
          Icons.access_time,
          color: curfew.isCurrentlyActive
              ? Theme.of(context).colorScheme.error
              : Theme.of(context).colorScheme.primary,
        ),
        title: Text(
          curfew.name,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        subtitle: Text(
          '${curfew.startTime.substring(0, 5)} - ${curfew.endTime.substring(0, 5)} • ${curfew.daysDisplay}',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        trailing: curfew.isCurrentlyActive
            ? Chip(
                label: const Text('Active Now'),
                labelStyle: Theme.of(context).textTheme.labelSmall,
                backgroundColor: Theme.of(context).colorScheme.errorContainer,
              )
            : null,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Description
                if (curfew.description != null &&
                    curfew.description!.isNotEmpty) ...[
                  Text(
                    curfew.description!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          height: 1.6,
                        ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),
                ],

                // Time details
                _buildDetailRow(
                  context,
                  icon: Icons.schedule,
                  label: 'Curfew Hours',
                  value:
                      '${curfew.startTime.substring(0, 5)} - ${curfew.endTime.substring(0, 5)}',
                ),
                const SizedBox(height: 12),

                // Days
                _buildDetailRow(
                  context,
                  icon: Icons.calendar_today,
                  label: 'Days',
                  value: curfew.daysDisplay,
                ),
                const SizedBox(height: 12),

                // Season
                _buildDetailRow(
                  context,
                  icon: curfew.season == CurfewSeason.summer
                      ? Icons.wb_sunny
                      : curfew.season == CurfewSeason.winter
                          ? Icons.ac_unit
                          : Icons.event,
                  label: 'Season',
                  value: curfew.seasonDisplay,
                ),

                // Custom season dates
                if (curfew.season == CurfewSeason.custom &&
                    curfew.seasonStartDate != null &&
                    curfew.seasonEndDate != null) ...[
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    context,
                    icon: Icons.date_range,
                    label: 'Season Period',
                    value:
                        '${_formatDate(curfew.seasonStartDate!)} - ${_formatDate(curfew.seasonEndDate!)}',
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.access_time,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'No Curfew Hours Set',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'There are no curfew restrictions at this time',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(
      BuildContext context, Object error, WidgetRef ref) {
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
            'Error Loading Curfew Hours',
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
              ref.invalidate(curfewsProvider);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

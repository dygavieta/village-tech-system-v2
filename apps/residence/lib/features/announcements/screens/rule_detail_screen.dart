// Residence App - Rule Detail Screen
// Purpose: Display detailed information about a specific village rule

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/village_rule.dart';
import '../providers/announcement_provider.dart';

class RuleDetailScreen extends ConsumerWidget {
  final String ruleId;

  const RuleDetailScreen({
    super.key,
    required this.ruleId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ruleAsync = ref.watch(villageRuleByIdProvider(ruleId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rule Details'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: ruleAsync.when(
        data: (rule) {
          if (rule == null) {
            return _buildNotFoundState(context);
          }
          return _buildRuleDetail(context, rule);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(context, error),
      ),
    );
  }

  Widget _buildRuleDetail(BuildContext context, VillageRule rule) {
    final dateFormat = DateFormat('yyyy-MM-dd');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category badge
          _buildCategoryBadge(context, rule.category),
          const SizedBox(height: 12),

          // Title
          Text(
            rule.title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),

          // Effective date
          Text(
            'Effective Date: ${dateFormat.format(rule.effectiveDate)}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 24),

          // Description/Content
          Text(
            rule.description,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.7,
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withOpacity(0.8),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBadge(BuildContext context, RuleCategory category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        _getCategoryLabel(category),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildNotFoundState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.menu_book_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'Rule Not Found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'This rule may have been removed or is no longer available',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
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
              'Error Loading Rule',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  String _getCategoryLabel(RuleCategory category) {
    switch (category) {
      case RuleCategory.general:
        return 'General';
      case RuleCategory.parking:
        return 'Parking & Vehicles';
      case RuleCategory.noise:
        return 'Noise & Disturbance';
      case RuleCategory.pets:
        return 'Pets';
      case RuleCategory.construction:
        return 'Construction';
      case RuleCategory.visitors:
        return 'Visitors';
    }
  }
}

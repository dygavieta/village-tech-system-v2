// Residence App - Village Rules Screen (T162)
// Phase 7 User Story 5: Residence Mobile App - Village Rules Module
// Purpose: Display village rules grouped by category

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/village_rule.dart';
import '../providers/announcement_provider.dart';

class VillageRulesScreen extends ConsumerStatefulWidget {
  const VillageRulesScreen({super.key});

  @override
  ConsumerState<VillageRulesScreen> createState() => _VillageRulesScreenState();
}

class _VillageRulesScreenState extends ConsumerState<VillageRulesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> _categories = [
    'All',
    'General',
    'Parking & Vehicles',
    'Noise & Disturbance',
    'Pets',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rulesGroupedAsync = ref.watch(rulesGroupedByCategoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rule Book'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Category tabs
          Container(
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).colorScheme.outlineVariant,
                ),
              ),
            ),
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              indicatorColor: Theme.of(context).colorScheme.primary,
              indicatorWeight: 2,
              labelColor: Theme.of(context).colorScheme.primary,
              unselectedLabelColor:
                  Theme.of(context).colorScheme.onSurfaceVariant,
              labelStyle: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              unselectedLabelStyle: const TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
              tabAlignment: TabAlignment.start,
              tabs: _categories.map((category) => Tab(text: category)).toList(),
            ),
          ),

          // Rules list
          Expanded(
            child: rulesGroupedAsync.when(
              data: (rulesGrouped) {
                if (rulesGrouped.isEmpty) {
                  return _buildEmptyState();
                }

                // Flatten all rules into a single list
                final allRules = <VillageRule>[];
                for (final rules in rulesGrouped.values) {
                  allRules.addAll(rules);
                }

                return TabBarView(
                  controller: _tabController,
                  children: _categories.map((category) {
                    List<VillageRule> filteredRules;
                    if (category == 'All') {
                      filteredRules = allRules;
                    } else {
                      filteredRules = _filterRulesByCategory(rulesGrouped, category);
                    }

                    if (filteredRules.isEmpty) {
                      return _buildEmptyState();
                    }

                    return ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: filteredRules.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final rule = filteredRules[index];
                        return _buildRuleListTile(rule);
                      },
                    );
                  }).toList(),
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

  List<VillageRule> _filterRulesByCategory(
    Map<RuleCategory, List<VillageRule>> rulesGrouped,
    String categoryName,
  ) {
    // Map category name to RuleCategory enum
    RuleCategory? targetCategory;
    switch (categoryName) {
      case 'General':
        targetCategory = RuleCategory.general;
        break;
      case 'Parking & Vehicles':
        targetCategory = RuleCategory.parking;
        break;
      case 'Noise & Disturbance':
        targetCategory = RuleCategory.noise;
        break;
      case 'Pets':
        targetCategory = RuleCategory.pets;
        break;
    }

    if (targetCategory == null) return [];
    return rulesGrouped[targetCategory] ?? [];
  }

  Widget _buildRuleListTile(VillageRule rule) {
    final dateFormat = DateFormat('yyyy-MM-dd');

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      title: Text(
        rule.title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          'Effective Date: ${dateFormat.format(rule.effectiveDate)}',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
      onTap: () {
        context.push('/rule-detail/${rule.id}');
      },
    );
  }

  Widget _buildEmptyState() {
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
              'No Rules Available',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'There are no village rules in this category',
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

  Widget _buildErrorState(Object error) {
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
              'Error Loading Rules',
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
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {
                ref.invalidate(villageRulesProvider);
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

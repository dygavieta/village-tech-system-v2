// Residence App - Village Rules Screen (T162)
// Phase 7 User Story 5: Residence Mobile App - Village Rules Module
// Purpose: Display village rules grouped by category with search

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

class _VillageRulesScreenState extends ConsumerState<VillageRulesScreen> {
  String _searchQuery = '';
  RuleCategory? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    final rulesGroupedAsync = ref.watch(rulesGroupedByCategoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Village Rules'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: SearchBar(
              hintText: 'Search rules...',
              leading: const Icon(Icons.search),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value.toLowerCase();
                });
              },
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Category filter
          _buildCategoryFilter(),
          const Divider(height: 1),

          // Rules list
          Expanded(
            child: rulesGroupedAsync.when(
              data: (rulesGrouped) {
                if (rulesGrouped.isEmpty) {
                  return _buildEmptyState();
                }

                final filteredGroups = _filterRules(rulesGrouped);

                if (filteredGroups.isEmpty) {
                  return _buildNoResultsState();
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    await Future.delayed(const Duration(milliseconds: 500));
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredGroups.length,
                    itemBuilder: (context, index) {
                      final category = filteredGroups.keys.elementAt(index);
                      final rules = filteredGroups[category]!;
                      return _buildRuleCategorySection(category, rules);
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

  Widget _buildCategoryFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          FilterChip(
            label: const Text('All'),
            selected: _selectedCategory == null,
            onSelected: (selected) {
              setState(() {
                _selectedCategory = null;
              });
            },
          ),
          const SizedBox(width: 8),
          ...RuleCategory.values.map((category) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_getCategoryLabel(category)),
                selected: _selectedCategory == category,
                onSelected: (selected) {
                  setState(() {
                    _selectedCategory = selected ? category : null;
                  });
                },
              ),
            );
          }),
        ],
      ),
    );
  }

  Map<RuleCategory, List<VillageRule>> _filterRules(
    Map<RuleCategory, List<VillageRule>> rulesGrouped,
  ) {
    var filtered = rulesGrouped;

    // Filter by category
    if (_selectedCategory != null) {
      filtered = {
        _selectedCategory!: rulesGrouped[_selectedCategory!] ?? [],
      };
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      final searchFiltered = <RuleCategory, List<VillageRule>>{};
      for (final entry in filtered.entries) {
        final matchingRules = entry.value.where((rule) {
          return rule.title.toLowerCase().contains(_searchQuery) ||
              rule.description.toLowerCase().contains(_searchQuery);
        }).toList();
        if (matchingRules.isNotEmpty) {
          searchFiltered[entry.key] = matchingRules;
        }
      }
      return searchFiltered;
    }

    return filtered;
  }

  Widget _buildRuleCategorySection(RuleCategory category, List<VillageRule> rules) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Icon(
                _getCategoryIcon(category),
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Text(
                _getCategoryLabel(category),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${rules.length}',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                ),
              ),
            ],
          ),
        ),

        // Rules in this category
        ...rules.map((rule) => _buildRuleCard(rule)),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildRuleCard(VillageRule rule) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: rule.needsAcknowledgment
            ? Icon(
                Icons.assignment_turned_in,
                color: Theme.of(context).colorScheme.error,
              )
            : const Icon(Icons.gavel),
        title: Text(
          rule.title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              'Effective: ${dateFormat.format(rule.effectiveDate)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            if (rule.version != null) ...[
              const SizedBox(height: 2),
              Text(
                'Version: ${rule.version}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ],
        ),
        trailing: rule.needsAcknowledgment
            ? Chip(
                label: const Text('Action Required'),
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
                Text(
                  rule.description,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        height: 1.6,
                      ),
                ),
                if (rule.needsAcknowledgment) ...[
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () {
                        context.push(
                          '/announcements/rules/acknowledge/${rule.id}',
                        );
                      },
                      icon: const Icon(Icons.edit_note),
                      label: const Text('Acknowledge Rule'),
                    ),
                  ),
                ],
                if (rule.isAcknowledged && rule.acknowledgedAt != null) ...[
                  const SizedBox(height: 16),
                  Card(
                    color: Colors.green.withOpacity(0.1),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Icon(Icons.check_circle, color: Colors.green[700]),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Acknowledged',
                                  style: TextStyle(
                                    color: Colors.green[700],
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  dateFormat.format(rule.acknowledgedAt!),
                                  style: TextStyle(
                                    color: Colors.green[700],
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.gavel,
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
            'There are no village rules at this time',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoResultsState() {
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
            'No Rules Found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or filters',
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
            'Error Loading Rules',
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
              ref.invalidate(villageRulesProvider);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  String _getCategoryLabel(RuleCategory category) {
    switch (category) {
      case RuleCategory.general:
        return 'General';
      case RuleCategory.parking:
        return 'Parking';
      case RuleCategory.noise:
        return 'Noise';
      case RuleCategory.pets:
        return 'Pets';
      case RuleCategory.construction:
        return 'Construction';
      case RuleCategory.safety:
        return 'Safety';
      case RuleCategory.amenities:
        return 'Amenities';
      case RuleCategory.other:
        return 'Other';
    }
  }

  IconData _getCategoryIcon(RuleCategory category) {
    switch (category) {
      case RuleCategory.general:
        return Icons.rule;
      case RuleCategory.parking:
        return Icons.local_parking;
      case RuleCategory.noise:
        return Icons.volume_down;
      case RuleCategory.pets:
        return Icons.pets;
      case RuleCategory.construction:
        return Icons.construction;
      case RuleCategory.safety:
        return Icons.security;
      case RuleCategory.amenities:
        return Icons.pool;
      case RuleCategory.other:
        return Icons.more_horiz;
    }
  }
}

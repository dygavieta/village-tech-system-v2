/**
 * Household profile screen for Residence app
 * Displays household information, property address, members, and contact details
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/household_provider.dart';
import '../models/household.dart';
import '../models/household_member.dart';
import 'add_member_screen.dart';

class HouseholdProfileScreen extends ConsumerWidget {
  const HouseholdProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final householdAsync = ref.watch(householdProfileProvider);
    final membersAsync = ref.watch(householdMembersProvider);
    final statsAsync = ref.watch(householdStatsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Household'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/services'),
        ),
      ),
      body: householdAsync.when(
        data: (household) {
          if (household == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.home_outlined, size: 80, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No Household Found',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Please contact the administrator',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[500],
                        ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(householdProfileProvider);
              ref.invalidate(householdMembersProvider);
              ref.invalidate(householdStatsProvider);
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Combined household head + property card
                  _buildHouseholdInfoCard(context, household),
                  const SizedBox(height: 32),

                  // Household members card
                  membersAsync.when(
                    data: (members) => _buildMembersCard(context, ref, members),
                    loading: () => const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                    ),
                    error: (error, stack) => Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text('Error loading members: $error'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Quick stats card
                  statsAsync.when(
                    data: (stats) => _buildStatsCard(context, stats),
                    loading: () => const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                    ),
                    error: (error, stack) => Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text('Error loading stats: $error'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(householdProfileProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHouseholdInfoCard(BuildContext context, Household household) {
    final head = household.householdHead;
    final property = household.property;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Household head section (centered)
            if (head != null) ...[
              CircleAvatar(
                radius: 40,
                backgroundColor:
                    Theme.of(context).colorScheme.primary.withOpacity(0.1),
                child: Icon(
                  Icons.person,
                  size: 40,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                head.fullName,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                'Household Head',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                textAlign: TextAlign.center,
              ),
              if (head.phoneNumber != null) ...[
                const SizedBox(height: 8),
                Text(
                  head.phoneNumber!,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 24),
            ],

            // Property info section
            _buildPropertyInfoSection(context, household, property),
          ],
        ),
      ),
    );
  }

  Widget _buildPropertyInfoSection(
      BuildContext context, Household household, dynamic property) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (property != null) ...[
          _buildInfoField(
            context,
            label: 'Property Address',
            value: property.formattedLocation,
          ),
          const SizedBox(height: 16),
        ],
        if (household.moveInDate != null) ...[
          _buildInfoField(
            context,
            label: 'Move-in Date',
            value: DateFormat('MMMM d, yyyy').format(household.moveInDate!),
          ),
          const SizedBox(height: 16),
        ],
        _buildInfoField(
          context,
          label: 'Ownership Status',
          value: household.ownershipTypeDisplay,
        ),
      ],
    );
  }

  Widget _buildInfoField(
    BuildContext context, {
    required String label,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }

  Widget _buildMembersCard(BuildContext context, WidgetRef ref, List<HouseholdMember> members) {
    return Column(
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Household Members',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            TextButton.icon(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AddMemberScreen(),
                  ),
                );
                if (result == true) {
                  ref.invalidate(householdMembersProvider);
                }
              },
              icon: Icon(
                Icons.add_circle,
                color: Theme.of(context).colorScheme.primary,
              ),
              label: Text(
                'Add Member',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Members list card
        if (members.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Center(
                child: Text(
                  'No members added yet',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ),
            ),
          )
        else
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: members.asMap().entries.map((entry) {
                final index = entry.key;
                final member = entry.value;
                return Column(
                  children: [
                    if (index > 0)
                      const Divider(
                        height: 1,
                        indent: 16,
                        endIndent: 16,
                      ),
                    _buildMemberTile(context, member: member),
                  ],
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildStatsCard(BuildContext context, HouseholdStats stats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Stats',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatItem(
                context,
                icon: Icons.directions_car,
                label: 'Vehicle Stickers',
                value: '${stats.activeStickers}/${stats.totalStickers}',
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatItem(
                context,
                icon: Icons.construction,
                label: 'Permits',
                value: '${stats.activePermits}',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMemberTile(
    BuildContext context, {
    required HouseholdMember member,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor:
                Theme.of(context).colorScheme.primary.withOpacity(0.1),
            child: Icon(
              _getMemberIcon(member.relationship),
              size: 24,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  member.fullName,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  _capitalizeFirst(member.relationship),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            onPressed: () {
              // TODO: Show member options menu
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 28,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getMemberIcon(String relationship) {
    switch (relationship.toLowerCase()) {
      case 'spouse':
      case 'wife':
      case 'husband':
        return Icons.woman;
      case 'son':
        return Icons.boy;
      case 'daughter':
        return Icons.girl;
      default:
        return Icons.person;
    }
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }
}

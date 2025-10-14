// Residence App - Announcements Screen (T159)
// Phase 7 User Story 5: Residence Mobile App - Announcements Module
// Purpose: Display list of announcements with filters and realtime updates

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../models/announcement.dart';
import '../providers/announcement_provider.dart';

class AnnouncementsScreen extends ConsumerStatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  ConsumerState<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends ConsumerState<AnnouncementsScreen> {
  AnnouncementCategory? _selectedCategory;

  @override
  void initState() {
    super.initState();
    // Setup realtime listener when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(announcementNotifierProvider.notifier).setupRealtimeListener();
    });
  }

  @override
  Widget build(BuildContext context) {
    final announcementsAsync = _selectedCategory == null
        ? ref.watch(announcementsProvider)
        : ref.watch(filteredAnnouncementsProvider(_selectedCategory));
    final unreadCount = ref.watch(unreadAnnouncementsCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcements'),
        actions: [
          // Unread count badge
          unreadCount.when(
            data: (count) => count > 0
                ? Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: Center(
                      child: Badge(
                        label: Text('$count'),
                        child: const Icon(Icons.notifications),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          IconButton(
            icon: const Icon(Icons.menu_book),
            tooltip: 'Village Rules',
            onPressed: () => context.push('/announcements/rules'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Category filter chips
          _buildCategoryFilter(),
          const Divider(height: 1),

          // Announcements list
          Expanded(
            child: announcementsAsync.when(
              data: (announcements) {
                if (announcements.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    // Refresh will happen automatically via stream
                    await Future.delayed(const Duration(milliseconds: 500));
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: announcements.length,
                    itemBuilder: (context, index) {
                      final announcement = announcements[index];
                      return _buildAnnouncementCard(announcement);
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
          ...AnnouncementCategory.values.map((category) {
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

  Widget _buildAnnouncementCard(Announcement announcement) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          context.push('/announcements/detail/${announcement.id}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row with urgency badge
              Row(
                children: [
                  _buildUrgencyBadge(announcement.urgency),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      announcement.categoryDisplay,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                  ),
                  if (!announcement.isRead)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),

              // Title
              Text(
                announcement.title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: announcement.isRead
                          ? FontWeight.normal
                          : FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),

              // Content preview
              Text(
                announcement.content,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 12),

              // Footer
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 14,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    dateFormat.format(announcement.publishDate),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const Spacer(),
                  if (announcement.requiresAcknowledgment &&
                      !announcement.isAcknowledged)
                    Chip(
                      label: const Text('Action Required'),
                      labelStyle: Theme.of(context).textTheme.labelSmall,
                      padding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                    ),
                  if (announcement.attachmentUrls?.isNotEmpty ?? false)
                    Icon(
                      Icons.attach_file,
                      size: 16,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUrgencyBadge(AnnouncementUrgency urgency) {
    Color color;
    IconData icon;

    switch (urgency) {
      case AnnouncementUrgency.urgent:
        color = Colors.red;
        icon = Icons.priority_high;
        break;
      case AnnouncementUrgency.high:
        color = Colors.orange;
        icon = Icons.warning_amber;
        break;
      case AnnouncementUrgency.medium:
        color = Colors.blue;
        icon = Icons.info;
        break;
      case AnnouncementUrgency.low:
        color = Colors.grey;
        icon = Icons.info_outline;
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
            _getUrgencyLabel(urgency),
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.announcement_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'No Announcements',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'There are no announcements at this time',
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
            'Error Loading Announcements',
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
              ref.invalidate(announcementsProvider);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  String _getCategoryLabel(AnnouncementCategory category) {
    switch (category) {
      case AnnouncementCategory.event:
        return 'Events';
      case AnnouncementCategory.maintenance:
        return 'Maintenance';
      case AnnouncementCategory.security:
        return 'Security';
      case AnnouncementCategory.policy:
        return 'Policy';
    }
  }

  String _getUrgencyLabel(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.urgent:
        return 'URGENT';
      case AnnouncementUrgency.high:
        return 'HIGH';
      case AnnouncementUrgency.medium:
        return 'MEDIUM';
      case AnnouncementUrgency.low:
        return 'LOW';
    }
  }
}

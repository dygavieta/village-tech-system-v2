// Residence App - Announcement Detail Screen (T160)
// Phase 7 User Story 5: Residence Mobile App - Announcements Module
// Purpose: View full announcement with rich text and attachments

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../models/announcement.dart';
import '../providers/announcement_provider.dart';

class AnnouncementDetailScreen extends ConsumerStatefulWidget {
  final String announcementId;

  const AnnouncementDetailScreen({
    super.key,
    required this.announcementId,
  });

  @override
  ConsumerState<AnnouncementDetailScreen> createState() =>
      _AnnouncementDetailScreenState();
}

class _AnnouncementDetailScreenState
    extends ConsumerState<AnnouncementDetailScreen> {
  @override
  void initState() {
    super.initState();
    // Mark as read when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(announcementNotifierProvider.notifier)
          .markAsRead(widget.announcementId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final announcementAsync =
        ref.watch(announcementDetailProvider(widget.announcementId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Announcement'),
        actions: [
          announcementAsync.when(
            data: (announcement) {
              if (announcement == null) return const SizedBox.shrink();
              return IconButton(
                icon: const Icon(Icons.share),
                tooltip: 'Share',
                onPressed: () => _shareAnnouncement(announcement),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: announcementAsync.when(
        data: (announcement) {
          if (announcement == null) {
            return _buildNotFoundState();
          }
          return _buildAnnouncementDetail(announcement);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(error),
      ),
    );
  }

  Widget _buildAnnouncementDetail(Announcement announcement) {
    final dateFormat = DateFormat('MMMM dd, yyyy \'at\' hh:mm a');

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: _getUrgencyColor(announcement.urgency).withOpacity(0.1),
              border: Border(
                bottom: BorderSide(
                  color: _getUrgencyColor(announcement.urgency),
                  width: 3,
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category and urgency badges
                Row(
                  children: [
                    Chip(
                      label: Text(announcement.categoryDisplay),
                      backgroundColor:
                          Theme.of(context).colorScheme.primaryContainer,
                    ),
                    const SizedBox(width: 8),
                    _buildUrgencyBadge(announcement.urgency),
                  ],
                ),
                const SizedBox(height: 16),

                // Title
                Text(
                  announcement.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),

                // Date
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      dateFormat.format(announcement.publishDate),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Content section
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Content
                Text(
                  announcement.content,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        height: 1.6,
                      ),
                ),
                const SizedBox(height: 24),

                // Attachments
                if (announcement.attachmentUrls?.isNotEmpty ?? false) ...[
                  const Divider(),
                  const SizedBox(height: 16),
                  Text(
                    'Attachments',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ...announcement.attachmentUrls!.map((url) {
                    return _buildAttachmentCard(url);
                  }),
                  const SizedBox(height: 24),
                ],

                // Expiry date
                if (announcement.expiryDate != null) ...[
                  const Divider(),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(
                        Icons.event_busy,
                        size: 20,
                        color: Theme.of(context).colorScheme.error,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Expires on: ${dateFormat.format(announcement.expiryDate!)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.error,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],

                // Acknowledgment section
                if (announcement.requiresAcknowledgment) ...[
                  const Divider(),
                  const SizedBox(height: 16),
                  _buildAcknowledgmentSection(announcement),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUrgencyBadge(AnnouncementUrgency urgency) {
    final color = _getUrgencyColor(urgency);
    final icon = _getUrgencyIcon(urgency);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            _getUrgencyLabel(urgency),
            style: TextStyle(
              fontSize: 13,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentCard(String url) {
    final fileName = url.split('/').last;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.attach_file),
        title: Text(fileName),
        trailing: IconButton(
          icon: const Icon(Icons.download),
          onPressed: () => _downloadAttachment(url),
        ),
      ),
    );
  }

  Widget _buildAcknowledgmentSection(Announcement announcement) {
    final notifier = ref.watch(announcementNotifierProvider);

    if (announcement.isAcknowledged) {
      return Card(
        color: Colors.green.withOpacity(0.1),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green[700]),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'You have acknowledged this announcement',
                  style: TextStyle(
                    color: Colors.green[700],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.assignment_turned_in,
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Acknowledgment Required',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Please confirm that you have read and understood this announcement.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: notifier.isLoading
                    ? null
                    : () => _acknowledgeAnnouncement(announcement.id),
                icon: notifier.isLoading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.check),
                label: const Text('Acknowledge'),
              ),
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
            Icons.announcement_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'Announcement Not Found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'This announcement may have been removed',
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
            'Error Loading Announcement',
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

  Color _getUrgencyColor(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.urgent:
        return Colors.red;
      case AnnouncementUrgency.high:
        return Colors.orange;
      case AnnouncementUrgency.medium:
        return Colors.blue;
      case AnnouncementUrgency.low:
        return Colors.grey;
    }
  }

  IconData _getUrgencyIcon(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.urgent:
        return Icons.priority_high;
      case AnnouncementUrgency.high:
        return Icons.warning_amber;
      case AnnouncementUrgency.medium:
        return Icons.info;
      case AnnouncementUrgency.low:
        return Icons.info_outline;
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

  Future<void> _acknowledgeAnnouncement(String announcementId) async {
    try {
      await ref
          .read(announcementNotifierProvider.notifier)
          .acknowledgeAnnouncement(announcementId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Announcement acknowledged successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to acknowledge: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _shareAnnouncement(Announcement announcement) {
    Share.share(
      '${announcement.title}\n\n${announcement.content}',
      subject: announcement.title,
    );
  }

  void _downloadAttachment(String url) {
    // TODO: Implement download functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Download started...')),
    );
  }
}

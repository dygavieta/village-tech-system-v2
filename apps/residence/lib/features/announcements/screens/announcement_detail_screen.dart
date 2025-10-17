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
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
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
    final dateFormat = DateFormat('MMMM dd, yyyy - hh:mm a');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category and urgency badges
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildCategoryBadge(announcement.category),
              _buildUrgencyBadge(announcement.urgency),
            ],
          ),
          const SizedBox(height: 16),

          // Title
          Text(
            announcement.title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  height: 1.2,
                ),
          ),
          const SizedBox(height: 8),

          // Date
          Text(
            dateFormat.format(announcement.effectiveStart),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 24),

          // Content
          Text(
            announcement.content,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.7,
                  color: Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withOpacity(0.8),
                ),
          ),
          const SizedBox(height: 32),

          // Attachments
          if (announcement.attachmentUrls?.isNotEmpty ?? false) ...[
            Text(
              'Attachments',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1,
              ),
              itemCount: announcement.attachmentUrls!.length,
              itemBuilder: (context, index) {
                return _buildAttachmentItem(
                    announcement.attachmentUrls![index]);
              },
            ),
            const SizedBox(height: 32),
          ],

          // Expiry date
          if (announcement.effectiveEnd != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.event_busy,
                    size: 20,
                    color: Theme.of(context).colorScheme.error,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Expires on: ${dateFormat.format(announcement.effectiveEnd!)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.error,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Acknowledgment section
          if (announcement.requiresAcknowledgment) ...[
            _buildAcknowledgmentSection(announcement),
          ],

          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildCategoryBadge(AnnouncementCategory category) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.info,
            size: 16,
            color: Colors.blue.shade800,
          ),
          const SizedBox(width: 6),
          Text(
            _getCategoryLabel(category),
            style: TextStyle(
              fontSize: 14,
              color: Colors.blue.shade800,
              fontWeight: FontWeight.w600,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            _getUrgencyLabel(urgency),
            style: TextStyle(
              fontSize: 14,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentItem(String url) {
    final fileName = url.split('/').last;
    final isImage = url.toLowerCase().endsWith('.png') ||
        url.toLowerCase().endsWith('.jpg') ||
        url.toLowerCase().endsWith('.jpeg');

    return InkWell(
      onTap: () => _downloadAttachment(url),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: isImage ? Colors.transparent : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
          image: isImage
              ? DecorationImage(
                  image: NetworkImage(url),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        child: isImage
            ? Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.3),
                    ],
                  ),
                ),
              )
            : Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.description,
                      size: 48,
                      color: Colors.grey.shade600,
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text(
                        fileName,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  String _getCategoryLabel(AnnouncementCategory category) {
    switch (category) {
      case AnnouncementCategory.event:
        return 'Event';
      case AnnouncementCategory.maintenance:
        return 'Maintenance';
      case AnnouncementCategory.security:
        return 'Security';
      case AnnouncementCategory.policy:
        return 'Policy';
      case AnnouncementCategory.general:
        return 'General';
    }
  }

  Widget _buildAcknowledgmentSection(Announcement announcement) {
    final notifier = ref.watch(announcementNotifierProvider);

    if (announcement.isAcknowledged) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green[700], size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'You have acknowledged this announcement',
                style: TextStyle(
                  color: Colors.green[800],
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.assignment_turned_in,
                color: Theme.of(context).colorScheme.onPrimaryContainer,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Acknowledgment Required',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
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
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check),
              label: const Text('Acknowledge'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
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
      case AnnouncementUrgency.critical:
        return Colors.red;
      case AnnouncementUrgency.important:
        return Colors.orange;
      case AnnouncementUrgency.info:
        return Colors.blue;
    }
  }

  IconData _getUrgencyIcon(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.critical:
        return Icons.priority_high;
      case AnnouncementUrgency.important:
        return Icons.warning_amber;
      case AnnouncementUrgency.info:
        return Icons.info;
    }
  }

  String _getUrgencyLabel(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.critical:
        return 'CRITICAL';
      case AnnouncementUrgency.important:
        return 'IMPORTANT';
      case AnnouncementUrgency.info:
        return 'INFO';
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

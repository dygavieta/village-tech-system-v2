/**
 * Announcements Screen for Sentinel app
 * Displays security announcements with urgency-based color coding
 */

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../bloc/announcement_bloc.dart';
import '../bloc/announcement_event.dart';
import '../bloc/announcement_state.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({Key? key}) : super(key: key);

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<AnnouncementBloc>().add(const LoadAnnouncementsEvent());
  }

  Color _getUrgencyColor(String urgency) {
    switch (urgency) {
      case 'critical':
        return Colors.red;
      case 'important':
        return Colors.orange;
      case 'info':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getUrgencyIcon(String urgency) {
    switch (urgency) {
      case 'critical':
        return Icons.error;
      case 'important':
        return Icons.warning;
      case 'info':
        return Icons.info;
      default:
        return Icons.announcement;
    }
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'event':
        return 'Event';
      case 'maintenance':
        return 'Maintenance';
      case 'security':
        return 'Security';
      case 'policy':
        return 'Policy';
      case 'general':
        return 'General';
      default:
        return category;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'event':
        return Icons.event;
      case 'maintenance':
        return Icons.build;
      case 'security':
        return Icons.security;
      case 'policy':
        return Icons.gavel;
      case 'general':
        return Icons.announcement;
      default:
        return Icons.announcement;
    }
  }

  void _showAnnouncementDetails(Map<String, dynamic> announcement) {
    // Mark as read when viewed
    if (!(announcement['is_read'] as bool)) {
      context.read<AnnouncementBloc>().add(
        MarkAnnouncementReadEvent(announcementId: announcement['id']),
      );
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(
                          _getUrgencyIcon(announcement['urgency']),
                          color: _getUrgencyColor(announcement['urgency']),
                          size: 28,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            announcement['title'],
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 8),

              // Urgency and Category badges
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getUrgencyColor(announcement['urgency']).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _getUrgencyColor(announcement['urgency']),
                      ),
                    ),
                    child: Text(
                      announcement['urgency'].toString().toUpperCase(),
                      style: TextStyle(
                        color: _getUrgencyColor(announcement['urgency']),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _getCategoryIcon(announcement['category']),
                          size: 14,
                          color: Colors.grey[700],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _getCategoryLabel(announcement['category']),
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Posted by and date
              Row(
                children: [
                  Icon(Icons.person, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    'Posted by ${announcement['user_profiles']['first_name']} ${announcement['user_profiles']['last_name']}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('MMMM dd, yyyy HH:mm')
                        .format(DateTime.parse(announcement['created_at'])),
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Effective dates
              if (announcement['effective_end'] != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue[200]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.schedule, size: 18, color: Colors.blue[700]),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Valid until ${DateFormat('MMMM dd, yyyy').format(DateTime.parse(announcement['effective_end']))}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.blue[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Content
              Text(
                'Message',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                announcement['content'],
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 16),

              // Attachments
              if (announcement['attachment_urls'] != null &&
                  (announcement['attachment_urls'] as List).isNotEmpty) ...[
                Text(
                  'Attachments',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                ...(announcement['attachment_urls'] as List).map((url) {
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.attach_file),
                      title: Text(url.split('/').last),
                      trailing: const Icon(Icons.download),
                      onTap: () {
                        // Handle attachment download/view
                      },
                    ),
                  );
                }).toList(),
                const SizedBox(height: 16),
              ],

              // Acknowledgment required
              if (announcement['requires_acknowledgment'] == true) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber[300]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_outline,
                          size: 18, color: Colors.amber[900]),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Acknowledgment required',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.amber[900],
                            fontWeight: FontWeight.w500,
                          ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Security Announcements'),
        elevation: 2,
        actions: [
          BlocBuilder<AnnouncementBloc, AnnouncementState>(
            builder: (context, state) {
              if (state is AnnouncementLoaded && state.unreadCount > 0) {
                return Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${state.unreadCount} new',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: BlocBuilder<AnnouncementBloc, AnnouncementState>(
        builder: (context, state) {
          if (state is AnnouncementLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is AnnouncementError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<AnnouncementBloc>().add(const LoadAnnouncementsEvent());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is AnnouncementLoaded) {
            final announcements = state.announcements;

            if (announcements.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.announcement, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'No announcements yet',
                      style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<AnnouncementBloc>().add(const RefreshAnnouncementsEvent());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: announcements.length,
                itemBuilder: (context, index) {
                  final announcement = announcements[index];
                  final urgencyColor = _getUrgencyColor(announcement['urgency']);
                  final isRead = announcement['is_read'] as bool;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: isRead ? 1 : 3,
                    color: isRead ? null : Colors.white,
                    child: InkWell(
                      onTap: () => _showAnnouncementDetails(announcement),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border(
                            left: BorderSide(
                              color: urgencyColor,
                              width: 4,
                            ),
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header row
                              Row(
                                children: [
                                  Icon(
                                    _getUrgencyIcon(announcement['urgency']),
                                    color: urgencyColor,
                                    size: 24,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      announcement['title'],
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (!isRead)
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 8),

                              // Content preview
                              Text(
                                announcement['content'],
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Footer row
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        _getCategoryIcon(announcement['category']),
                                        size: 14,
                                        color: Colors.grey[600],
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _getCategoryLabel(announcement['category']),
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    DateFormat('MMM dd, HH:mm')
                                        .format(DateTime.parse(announcement['created_at'])),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}

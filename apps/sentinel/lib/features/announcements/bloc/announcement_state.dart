/**
 * Announcement states for Sentinel app
 */

import 'package:equatable/equatable.dart';

abstract class AnnouncementState extends Equatable {
  const AnnouncementState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class AnnouncementInitial extends AnnouncementState {
  const AnnouncementInitial();
}

/// Loading state
class AnnouncementLoading extends AnnouncementState {
  const AnnouncementLoading();
}

/// Announcements loaded successfully
class AnnouncementLoaded extends AnnouncementState {
  final List<Map<String, dynamic>> announcements;
  final int unreadCount;
  final DateTime loadedAt;

  const AnnouncementLoaded({
    required this.announcements,
    required this.unreadCount,
    required this.loadedAt,
  });

  @override
  List<Object?> get props => [announcements, unreadCount, loadedAt];
}

/// Announcement marked as read
class AnnouncementMarkedRead extends AnnouncementState {
  final String announcementId;

  const AnnouncementMarkedRead({required this.announcementId});

  @override
  List<Object?> get props => [announcementId];
}

/// Error state
class AnnouncementError extends AnnouncementState {
  final String message;

  const AnnouncementError({required this.message});

  @override
  List<Object?> get props => [message];
}

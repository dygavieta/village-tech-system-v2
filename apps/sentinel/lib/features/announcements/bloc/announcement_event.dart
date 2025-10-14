/**
 * Announcement events for Sentinel app
 * Handles loading security announcements
 */

import 'package:equatable/equatable.dart';

abstract class AnnouncementEvent extends Equatable {
  const AnnouncementEvent();

  @override
  List<Object?> get props => [];
}

/// Event to load all security announcements
class LoadAnnouncementsEvent extends AnnouncementEvent {
  const LoadAnnouncementsEvent();
}

/// Event to mark announcement as read
class MarkAnnouncementReadEvent extends AnnouncementEvent {
  final String announcementId;

  const MarkAnnouncementReadEvent({required this.announcementId});

  @override
  List<Object?> get props => [announcementId];
}

/// Event to refresh announcements
class RefreshAnnouncementsEvent extends AnnouncementEvent {
  const RefreshAnnouncementsEvent();
}

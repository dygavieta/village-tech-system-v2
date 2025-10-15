// Residence App - Announcement Model
// Phase 7 User Story 5: Residence Mobile App - Announcements Module
// Purpose: Model for announcements and village communications

enum AnnouncementCategory {
  event,
  maintenance,
  security,
  policy,
  general,
}

enum AnnouncementUrgency {
  critical,
  important,
  info,
}

class Announcement {
  final String id;
  final String tenantId;
  final String createdByAdminId;
  final String title;
  final String content;
  final AnnouncementCategory category;
  final AnnouncementUrgency urgency;
  final String targetAudience;
  final List<String>? specificHouseholdIds;
  final DateTime effectiveStart;
  final DateTime? effectiveEnd;
  final bool requiresAcknowledgment;
  final List<String>? attachmentUrls;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Local state (not from DB)
  final bool isRead;
  final bool isAcknowledged;

  Announcement({
    required this.id,
    required this.tenantId,
    required this.createdByAdminId,
    required this.title,
    required this.content,
    required this.category,
    required this.urgency,
    required this.targetAudience,
    this.specificHouseholdIds,
    required this.effectiveStart,
    this.effectiveEnd,
    required this.requiresAcknowledgment,
    this.attachmentUrls,
    required this.createdAt,
    required this.updatedAt,
    this.isRead = false,
    this.isAcknowledged = false,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      createdByAdminId: json['created_by_admin_id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      category: _parseCategory(json['category'] as String),
      urgency: _parseUrgency(json['urgency'] as String),
      targetAudience: json['target_audience'] as String,
      specificHouseholdIds: json['specific_household_ids'] != null
          ? List<String>.from(json['specific_household_ids'] as List)
          : null,
      effectiveStart: DateTime.parse(json['effective_start'] as String),
      effectiveEnd: json['effective_end'] != null
          ? DateTime.parse(json['effective_end'] as String)
          : null,
      requiresAcknowledgment: json['requires_acknowledgment'] as bool? ?? false,
      attachmentUrls: json['attachment_urls'] != null
          ? List<String>.from(json['attachment_urls'] as List)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      isRead: json['is_read'] as bool? ?? false,
      isAcknowledged: json['is_acknowledged'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'created_by_admin_id': createdByAdminId,
      'title': title,
      'content': content,
      'category': categoryToString(category),
      'urgency': urgencyToString(urgency),
      'target_audience': targetAudience,
      'specific_household_ids': specificHouseholdIds,
      'effective_start': effectiveStart.toIso8601String(),
      'effective_end': effectiveEnd?.toIso8601String(),
      'requires_acknowledgment': requiresAcknowledgment,
      'attachment_urls': attachmentUrls,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static AnnouncementCategory _parseCategory(String category) {
    switch (category.toLowerCase()) {
      case 'event':
        return AnnouncementCategory.event;
      case 'maintenance':
        return AnnouncementCategory.maintenance;
      case 'security':
        return AnnouncementCategory.security;
      case 'policy':
        return AnnouncementCategory.policy;
      case 'general':
        return AnnouncementCategory.general;
      default:
        return AnnouncementCategory.general;
    }
  }

  static AnnouncementUrgency _parseUrgency(String urgency) {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return AnnouncementUrgency.critical;
      case 'important':
        return AnnouncementUrgency.important;
      case 'info':
        return AnnouncementUrgency.info;
      default:
        return AnnouncementUrgency.info;
    }
  }

  static String categoryToString(AnnouncementCategory category) {
    switch (category) {
      case AnnouncementCategory.event:
        return 'event';
      case AnnouncementCategory.maintenance:
        return 'maintenance';
      case AnnouncementCategory.security:
        return 'security';
      case AnnouncementCategory.policy:
        return 'policy';
      case AnnouncementCategory.general:
        return 'general';
    }
  }

  static String urgencyToString(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.critical:
        return 'critical';
      case AnnouncementUrgency.important:
        return 'important';
      case AnnouncementUrgency.info:
        return 'info';
    }
  }

  String get categoryDisplay {
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

  String get urgencyDisplay {
    switch (urgency) {
      case AnnouncementUrgency.critical:
        return 'Critical';
      case AnnouncementUrgency.important:
        return 'Important';
      case AnnouncementUrgency.info:
        return 'Info';
    }
  }

  bool get isExpired {
    if (effectiveEnd == null) return false;
    return DateTime.now().isAfter(effectiveEnd!);
  }

  bool get isActive {
    return !isExpired && DateTime.now().isAfter(effectiveStart);
  }

  Announcement copyWith({
    bool? isRead,
    bool? isAcknowledged,
  }) {
    return Announcement(
      id: id,
      tenantId: tenantId,
      createdByAdminId: createdByAdminId,
      title: title,
      content: content,
      category: category,
      urgency: urgency,
      targetAudience: targetAudience,
      specificHouseholdIds: specificHouseholdIds,
      effectiveStart: effectiveStart,
      effectiveEnd: effectiveEnd,
      requiresAcknowledgment: requiresAcknowledgment,
      attachmentUrls: attachmentUrls,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isRead: isRead ?? this.isRead,
      isAcknowledged: isAcknowledged ?? this.isAcknowledged,
    );
  }
}

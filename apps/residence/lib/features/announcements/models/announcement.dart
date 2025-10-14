// Residence App - Announcement Model
// Phase 7 User Story 5: Residence Mobile App - Announcements Module
// Purpose: Model for announcements and village communications

enum AnnouncementCategory {
  event,
  maintenance,
  security,
  policy,
}

enum AnnouncementUrgency {
  low,
  medium,
  high,
  urgent,
}

class Announcement {
  final String id;
  final String tenantId;
  final String title;
  final String content;
  final AnnouncementCategory category;
  final AnnouncementUrgency urgency;
  final bool requiresAcknowledgment;
  final List<String>? attachmentUrls;
  final DateTime publishDate;
  final DateTime? expiryDate;
  final String? targetAudience;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Local state (not from DB)
  final bool isRead;
  final bool isAcknowledged;

  Announcement({
    required this.id,
    required this.tenantId,
    required this.title,
    required this.content,
    required this.category,
    required this.urgency,
    required this.requiresAcknowledgment,
    this.attachmentUrls,
    required this.publishDate,
    this.expiryDate,
    this.targetAudience,
    required this.createdAt,
    required this.updatedAt,
    this.isRead = false,
    this.isAcknowledged = false,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      category: _parseCategory(json['category'] as String),
      urgency: _parseUrgency(json['urgency'] as String),
      requiresAcknowledgment: json['requires_acknowledgment'] as bool? ?? false,
      attachmentUrls: json['attachment_urls'] != null
          ? List<String>.from(json['attachment_urls'] as List)
          : null,
      publishDate: DateTime.parse(json['publish_date'] as String),
      expiryDate: json['expiry_date'] != null
          ? DateTime.parse(json['expiry_date'] as String)
          : null,
      targetAudience: json['target_audience'] as String?,
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
      'title': title,
      'content': content,
      'category': categoryToString(category),
      'urgency': urgencyToString(urgency),
      'requires_acknowledgment': requiresAcknowledgment,
      'attachment_urls': attachmentUrls,
      'publish_date': publishDate.toIso8601String(),
      'expiry_date': expiryDate?.toIso8601String(),
      'target_audience': targetAudience,
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
      default:
        return AnnouncementCategory.event;
    }
  }

  static AnnouncementUrgency _parseUrgency(String urgency) {
    switch (urgency.toLowerCase()) {
      case 'low':
        return AnnouncementUrgency.low;
      case 'medium':
        return AnnouncementUrgency.medium;
      case 'high':
        return AnnouncementUrgency.high;
      case 'urgent':
        return AnnouncementUrgency.urgent;
      default:
        return AnnouncementUrgency.medium;
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
    }
  }

  static String urgencyToString(AnnouncementUrgency urgency) {
    switch (urgency) {
      case AnnouncementUrgency.low:
        return 'low';
      case AnnouncementUrgency.medium:
        return 'medium';
      case AnnouncementUrgency.high:
        return 'high';
      case AnnouncementUrgency.urgent:
        return 'urgent';
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
    }
  }

  String get urgencyDisplay {
    switch (urgency) {
      case AnnouncementUrgency.low:
        return 'Low';
      case AnnouncementUrgency.medium:
        return 'Medium';
      case AnnouncementUrgency.high:
        return 'High';
      case AnnouncementUrgency.urgent:
        return 'Urgent';
    }
  }

  bool get isExpired {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  bool get isActive {
    return !isExpired && DateTime.now().isAfter(publishDate);
  }

  Announcement copyWith({
    bool? isRead,
    bool? isAcknowledged,
  }) {
    return Announcement(
      id: id,
      tenantId: tenantId,
      title: title,
      content: content,
      category: category,
      urgency: urgency,
      requiresAcknowledgment: requiresAcknowledgment,
      attachmentUrls: attachmentUrls,
      publishDate: publishDate,
      expiryDate: expiryDate,
      targetAudience: targetAudience,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isRead: isRead ?? this.isRead,
      isAcknowledged: isAcknowledged ?? this.isAcknowledged,
    );
  }
}

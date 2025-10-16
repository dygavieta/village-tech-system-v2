// Residence App - Village Rule Model
// Phase 7 User Story 5: Residence Mobile App - Village Rules Module
// Purpose: Model for village rules and regulations

enum RuleCategory {
  general,
  parking,
  noise,
  pets,
  construction,
  visitors,
}

class VillageRule {
  final String id;
  final String tenantId;
  final String createdByAdminId;
  final RuleCategory category;
  final String title;
  final String description;
  final int version;
  final DateTime effectiveDate;
  final DateTime? publishedAt;
  final bool requiresAcknowledgment;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Local state (not from DB)
  final bool isAcknowledged;
  final DateTime? acknowledgedAt;

  VillageRule({
    required this.id,
    required this.tenantId,
    required this.createdByAdminId,
    required this.category,
    required this.title,
    required this.description,
    required this.version,
    required this.effectiveDate,
    this.publishedAt,
    required this.requiresAcknowledgment,
    required this.createdAt,
    required this.updatedAt,
    this.isAcknowledged = false,
    this.acknowledgedAt,
  });

  factory VillageRule.fromJson(Map<String, dynamic> json) {
    return VillageRule(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      createdByAdminId: json['created_by_admin_id'] as String,
      category: _parseCategory(json['category'] as String),
      title: json['title'] as String,
      description: json['description'] as String,
      version: json['version'] as int,
      effectiveDate: DateTime.parse(json['effective_date'] as String),
      publishedAt: json['published_at'] != null
          ? DateTime.parse(json['published_at'] as String)
          : null,
      requiresAcknowledgment: json['requires_acknowledgment'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      isAcknowledged: json['is_acknowledged'] as bool? ?? false,
      acknowledgedAt: json['acknowledged_at'] != null
          ? DateTime.parse(json['acknowledged_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'created_by_admin_id': createdByAdminId,
      'category': categoryToString(category),
      'title': title,
      'description': description,
      'version': version,
      'effective_date': effectiveDate.toIso8601String().split('T')[0], // DATE format
      'published_at': publishedAt?.toIso8601String(),
      'requires_acknowledgment': requiresAcknowledgment,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static RuleCategory _parseCategory(String category) {
    switch (category.toLowerCase()) {
      case 'general':
        return RuleCategory.general;
      case 'parking':
        return RuleCategory.parking;
      case 'noise':
        return RuleCategory.noise;
      case 'pets':
        return RuleCategory.pets;
      case 'construction':
        return RuleCategory.construction;
      case 'visitors':
        return RuleCategory.visitors;
      default:
        return RuleCategory.general;
    }
  }

  static String categoryToString(RuleCategory category) {
    switch (category) {
      case RuleCategory.general:
        return 'general';
      case RuleCategory.parking:
        return 'parking';
      case RuleCategory.noise:
        return 'noise';
      case RuleCategory.pets:
        return 'pets';
      case RuleCategory.construction:
        return 'construction';
      case RuleCategory.visitors:
        return 'visitors';
    }
  }

  String get categoryDisplay {
    switch (category) {
      case RuleCategory.general:
        return 'General';
      case RuleCategory.parking:
        return 'Parking & Vehicles';
      case RuleCategory.noise:
        return 'Noise & Disturbance';
      case RuleCategory.pets:
        return 'Pets & Animals';
      case RuleCategory.construction:
        return 'Construction & Renovation';
      case RuleCategory.visitors:
        return 'Visitors & Guests';
    }
  }

  bool get needsAcknowledgment {
    return requiresAcknowledgment && !isAcknowledged;
  }

  VillageRule copyWith({
    bool? isAcknowledged,
    DateTime? acknowledgedAt,
  }) {
    return VillageRule(
      id: id,
      tenantId: tenantId,
      createdByAdminId: createdByAdminId,
      category: category,
      title: title,
      description: description,
      version: version,
      effectiveDate: effectiveDate,
      publishedAt: publishedAt,
      requiresAcknowledgment: requiresAcknowledgment,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isAcknowledged: isAcknowledged ?? this.isAcknowledged,
      acknowledgedAt: acknowledgedAt ?? this.acknowledgedAt,
    );
  }
}

// Residence App - Village Rule Model
// Phase 7 User Story 5: Residence Mobile App - Village Rules Module
// Purpose: Model for village rules and regulations

enum RuleCategory {
  general,
  parking,
  noise,
  pets,
  construction,
  safety,
  amenities,
  other,
}

class VillageRule {
  final String id;
  final String tenantId;
  final String title;
  final String description;
  final RuleCategory category;
  final bool requiresAcknowledgment;
  final DateTime effectiveDate;
  final String? version;
  final int displayOrder;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Local state (not from DB)
  final bool isAcknowledged;
  final DateTime? acknowledgedAt;

  VillageRule({
    required this.id,
    required this.tenantId,
    required this.title,
    required this.description,
    required this.category,
    required this.requiresAcknowledgment,
    required this.effectiveDate,
    this.version,
    required this.displayOrder,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.isAcknowledged = false,
    this.acknowledgedAt,
  });

  factory VillageRule.fromJson(Map<String, dynamic> json) {
    return VillageRule(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      category: _parseCategory(json['category'] as String),
      requiresAcknowledgment: json['requires_acknowledgment'] as bool? ?? false,
      effectiveDate: DateTime.parse(json['effective_date'] as String),
      version: json['version'] as String?,
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
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
      'title': title,
      'description': description,
      'category': categoryToString(category),
      'requires_acknowledgment': requiresAcknowledgment,
      'effective_date': effectiveDate.toIso8601String(),
      'version': version,
      'display_order': displayOrder,
      'is_active': isActive,
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
      case 'safety':
        return RuleCategory.safety;
      case 'amenities':
        return RuleCategory.amenities;
      case 'other':
        return RuleCategory.other;
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
      case RuleCategory.safety:
        return 'safety';
      case RuleCategory.amenities:
        return 'amenities';
      case RuleCategory.other:
        return 'other';
    }
  }

  String get categoryDisplay {
    switch (category) {
      case RuleCategory.general:
        return 'General';
      case RuleCategory.parking:
        return 'Parking';
      case RuleCategory.noise:
        return 'Noise';
      case RuleCategory.pets:
        return 'Pets';
      case RuleCategory.construction:
        return 'Construction';
      case RuleCategory.safety:
        return 'Safety';
      case RuleCategory.amenities:
        return 'Amenities';
      case RuleCategory.other:
        return 'Other';
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
      title: title,
      description: description,
      category: category,
      requiresAcknowledgment: requiresAcknowledgment,
      effectiveDate: effectiveDate,
      version: version,
      displayOrder: displayOrder,
      isActive: isActive,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isAcknowledged: isAcknowledged ?? this.isAcknowledged,
      acknowledgedAt: acknowledgedAt ?? this.acknowledgedAt,
    );
  }
}

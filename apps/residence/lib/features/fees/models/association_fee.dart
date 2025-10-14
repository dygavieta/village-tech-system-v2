// Residence App - Association Fee Model
// Phase 7 User Story 5: Residence Mobile App - Association Fees Module
// Purpose: Model for association fees and payments

enum FeeStatus {
  unpaid,
  paid,
  overdue,
  partial,
  waived,
}

enum FeeType {
  monthly,
  quarterly,
  annual,
  oneTime,
  special,
}

class AssociationFee {
  final String id;
  final String householdId;
  final String tenantId;
  final String description;
  final FeeType feeType;
  final double baseAmount;
  final double? lateFeeAmount;
  final double? paidAmount;
  final FeeStatus status;
  final DateTime dueDate;
  final DateTime? paidDate;
  final String? paymentIntentId;
  final String? receiptUrl;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  AssociationFee({
    required this.id,
    required this.householdId,
    required this.tenantId,
    required this.description,
    required this.feeType,
    required this.baseAmount,
    this.lateFeeAmount,
    this.paidAmount,
    required this.status,
    required this.dueDate,
    this.paidDate,
    this.paymentIntentId,
    this.receiptUrl,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AssociationFee.fromJson(Map<String, dynamic> json) {
    return AssociationFee(
      id: json['id'] as String,
      householdId: json['household_id'] as String,
      tenantId: json['tenant_id'] as String,
      description: json['description'] as String,
      feeType: _parseFeeType(json['fee_type'] as String),
      baseAmount: (json['base_amount'] as num).toDouble(),
      lateFeeAmount: json['late_fee_amount'] != null
          ? (json['late_fee_amount'] as num).toDouble()
          : null,
      paidAmount: json['paid_amount'] != null
          ? (json['paid_amount'] as num).toDouble()
          : null,
      status: _parseStatus(json['status'] as String),
      dueDate: DateTime.parse(json['due_date'] as String),
      paidDate: json['paid_date'] != null
          ? DateTime.parse(json['paid_date'] as String)
          : null,
      paymentIntentId: json['payment_intent_id'] as String?,
      receiptUrl: json['receipt_url'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'household_id': householdId,
      'tenant_id': tenantId,
      'description': description,
      'fee_type': feeTypeToString(feeType),
      'base_amount': baseAmount,
      'late_fee_amount': lateFeeAmount,
      'paid_amount': paidAmount,
      'status': statusToString(status),
      'due_date': dueDate.toIso8601String(),
      'paid_date': paidDate?.toIso8601String(),
      'payment_intent_id': paymentIntentId,
      'receipt_url': receiptUrl,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  static FeeType _parseFeeType(String type) {
    switch (type.toLowerCase()) {
      case 'monthly':
        return FeeType.monthly;
      case 'quarterly':
        return FeeType.quarterly;
      case 'annual':
        return FeeType.annual;
      case 'one_time':
        return FeeType.oneTime;
      case 'special':
        return FeeType.special;
      default:
        return FeeType.monthly;
    }
  }

  static FeeStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'unpaid':
        return FeeStatus.unpaid;
      case 'paid':
        return FeeStatus.paid;
      case 'overdue':
        return FeeStatus.overdue;
      case 'partial':
        return FeeStatus.partial;
      case 'waived':
        return FeeStatus.waived;
      default:
        return FeeStatus.unpaid;
    }
  }

  static String feeTypeToString(FeeType type) {
    switch (type) {
      case FeeType.monthly:
        return 'monthly';
      case FeeType.quarterly:
        return 'quarterly';
      case FeeType.annual:
        return 'annual';
      case FeeType.oneTime:
        return 'one_time';
      case FeeType.special:
        return 'special';
    }
  }

  static String statusToString(FeeStatus status) {
    switch (status) {
      case FeeStatus.unpaid:
        return 'unpaid';
      case FeeStatus.paid:
        return 'paid';
      case FeeStatus.overdue:
        return 'overdue';
      case FeeStatus.partial:
        return 'partial';
      case FeeStatus.waived:
        return 'waived';
    }
  }

  String get feeTypeDisplay {
    switch (feeType) {
      case FeeType.monthly:
        return 'Monthly';
      case FeeType.quarterly:
        return 'Quarterly';
      case FeeType.annual:
        return 'Annual';
      case FeeType.oneTime:
        return 'One-time';
      case FeeType.special:
        return 'Special';
    }
  }

  String get statusDisplay {
    switch (status) {
      case FeeStatus.unpaid:
        return 'Unpaid';
      case FeeStatus.paid:
        return 'Paid';
      case FeeStatus.overdue:
        return 'Overdue';
      case FeeStatus.partial:
        return 'Partially Paid';
      case FeeStatus.waived:
        return 'Waived';
    }
  }

  double get totalAmount {
    return baseAmount + (lateFeeAmount ?? 0);
  }

  double get remainingAmount {
    return totalAmount - (paidAmount ?? 0);
  }

  bool get isOverdue {
    return status == FeeStatus.overdue ||
        (status == FeeStatus.unpaid && DateTime.now().isAfter(dueDate));
  }

  bool get isPaid {
    return status == FeeStatus.paid || status == FeeStatus.waived;
  }

  int get daysUntilDue {
    return dueDate.difference(DateTime.now()).inDays;
  }

  int get daysOverdue {
    if (!isOverdue) return 0;
    return DateTime.now().difference(dueDate).inDays;
  }

  AssociationFee copyWith({
    FeeStatus? status,
    double? paidAmount,
    DateTime? paidDate,
    String? paymentIntentId,
    String? receiptUrl,
  }) {
    return AssociationFee(
      id: id,
      householdId: householdId,
      tenantId: tenantId,
      description: description,
      feeType: feeType,
      baseAmount: baseAmount,
      lateFeeAmount: lateFeeAmount,
      paidAmount: paidAmount ?? this.paidAmount,
      status: status ?? this.status,
      dueDate: dueDate,
      paidDate: paidDate ?? this.paidDate,
      paymentIntentId: paymentIntentId ?? this.paymentIntentId,
      receiptUrl: receiptUrl ?? this.receiptUrl,
      notes: notes,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

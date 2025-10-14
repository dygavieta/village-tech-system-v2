enum PermitStatus {
  pendingApproval,
  approved,
  active,
  onHold,
  completed,
  rejected,
}

class ConstructionPermit {
  final String id;
  final String householdId;
  final String projectType;
  final String description;
  final DateTime startDate;
  final int durationDays;
  final String? contractorName;
  final String? contractorLicenseUrl;
  final int numWorkers;
  final String? materialsDescription;
  final double roadFeeAmount;
  final String paymentStatus;
  final PermitStatus permitStatus;
  final String? approvedByAdminId;
  final DateTime? approvedAt;
  final DateTime createdAt;

  ConstructionPermit({
    required this.id,
    required this.householdId,
    required this.projectType,
    required this.description,
    required this.startDate,
    required this.durationDays,
    this.contractorName,
    this.contractorLicenseUrl,
    required this.numWorkers,
    this.materialsDescription,
    required this.roadFeeAmount,
    required this.paymentStatus,
    required this.permitStatus,
    this.approvedByAdminId,
    this.approvedAt,
    required this.createdAt,
  });

  factory ConstructionPermit.fromJson(Map<String, dynamic> json) {
    return ConstructionPermit(
      id: json['id'] as String,
      householdId: json['household_id'] as String,
      projectType: json['project_type'] as String,
      description: json['description'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      durationDays: json['duration_days'] as int,
      contractorName: json['contractor_name'] as String?,
      contractorLicenseUrl: json['contractor_license_url'] as String?,
      numWorkers: json['num_workers'] as int? ?? 1,
      materialsDescription: json['materials_description'] as String?,
      roadFeeAmount: (json['road_fee_amount'] as num?)?.toDouble() ?? 0.0,
      paymentStatus: json['payment_status'] as String? ?? 'pending',
      permitStatus: _parseStatus(json['permit_status'] as String? ?? 'pending_approval'),
      approvedByAdminId: json['approved_by_admin_id'] as String?,
      approvedAt: json['approved_at'] != null ? DateTime.parse(json['approved_at'] as String) : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'household_id': householdId,
      'project_type': projectType,
      'description': description,
      'start_date': startDate.toIso8601String().split('T')[0],
      'duration_days': durationDays,
      'contractor_name': contractorName,
      'contractor_license_url': contractorLicenseUrl,
      'num_workers': numWorkers,
      'materials_description': materialsDescription,
    };
  }

  static PermitStatus _parseStatus(String status) {
    switch (status) {
      case 'pending_approval':
        return PermitStatus.pendingApproval;
      case 'approved':
        return PermitStatus.approved;
      case 'active':
        return PermitStatus.active;
      case 'on_hold':
        return PermitStatus.onHold;
      case 'completed':
        return PermitStatus.completed;
      case 'rejected':
        return PermitStatus.rejected;
      default:
        return PermitStatus.pendingApproval;
    }
  }

  String get permitStatusDisplay {
    switch (permitStatus) {
      case PermitStatus.pendingApproval:
        return 'Pending Approval';
      case PermitStatus.approved:
        return 'Approved';
      case PermitStatus.active:
        return 'Active';
      case PermitStatus.onHold:
        return 'On Hold';
      case PermitStatus.completed:
        return 'Completed';
      case PermitStatus.rejected:
        return 'Rejected';
    }
  }

  String get paymentStatusDisplay {
    switch (paymentStatus) {
      case 'pending':
        return 'Payment Pending';
      case 'paid':
        return 'Paid';
      case 'refunded':
        return 'Refunded';
      default:
        return 'Unknown';
    }
  }
}

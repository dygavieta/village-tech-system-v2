enum StickerStatus {
  pending,
  approved,
  readyForPickup,
  issued,
  expired,
  lost,
  deactivated,
}

class VehicleSticker {
  final String id;
  final String householdId;
  final String? rfidSerial;
  final String vehiclePlate;
  final String? vehicleMake;
  final String? vehicleColor;
  final String stickerType;
  final StickerStatus status;
  final DateTime? issueDate;
  final DateTime? expiryDate;
  final String? orCrDocumentUrl;
  final DateTime createdAt;

  VehicleSticker({
    required this.id,
    required this.householdId,
    this.rfidSerial,
    required this.vehiclePlate,
    this.vehicleMake,
    this.vehicleColor,
    required this.stickerType,
    required this.status,
    this.issueDate,
    this.expiryDate,
    this.orCrDocumentUrl,
    required this.createdAt,
  });

  factory VehicleSticker.fromJson(Map<String, dynamic> json) {
    return VehicleSticker(
      id: json['id'] as String,
      householdId: json['household_id'] as String,
      rfidSerial: json['rfid_serial'] as String?,
      vehiclePlate: json['vehicle_plate'] as String,
      vehicleMake: json['vehicle_make'] as String?,
      vehicleColor: json['vehicle_color'] as String?,
      stickerType: json['sticker_type'] as String,
      status: _parseStatus(json['status'] as String),
      issueDate: json['issue_date'] != null
          ? DateTime.parse(json['issue_date'] as String)
          : null,
      expiryDate: json['expiry_date'] != null
          ? DateTime.parse(json['expiry_date'] as String)
          : null,
      orCrDocumentUrl: json['or_cr_document_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'household_id': householdId,
      'vehicle_plate': vehiclePlate,
      'vehicle_make': vehicleMake,
      'vehicle_color': vehicleColor,
      'sticker_type': stickerType,
      'or_cr_document_url': orCrDocumentUrl,
    };
  }

  static StickerStatus _parseStatus(String status) {
    switch (status) {
      case 'pending':
        return StickerStatus.pending;
      case 'approved':
        return StickerStatus.approved;
      case 'ready_for_pickup':
        return StickerStatus.readyForPickup;
      case 'issued':
        return StickerStatus.issued;
      case 'expired':
        return StickerStatus.expired;
      case 'lost':
        return StickerStatus.lost;
      case 'deactivated':
        return StickerStatus.deactivated;
      default:
        return StickerStatus.pending;
    }
  }

  String get statusDisplay {
    switch (status) {
      case StickerStatus.pending:
        return 'Pending';
      case StickerStatus.approved:
        return 'Approved';
      case StickerStatus.readyForPickup:
        return 'Ready for Pickup';
      case StickerStatus.issued:
        return 'Active';
      case StickerStatus.expired:
        return 'Expired';
      case StickerStatus.lost:
        return 'Lost';
      case StickerStatus.deactivated:
        return 'Deactivated';
    }
  }
}

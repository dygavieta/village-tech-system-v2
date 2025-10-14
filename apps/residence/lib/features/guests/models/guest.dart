enum GuestStatus {
  preRegistered,
  arrived,
  departed,
  overstayed,
  rejected,
}

class Guest {
  final String id;
  final String householdId;
  final String guestName;
  final String? phoneNumber;
  final String? vehiclePlate;
  final String visitType;
  final DateTime visitDate;
  final String? expectedArrivalTime;
  final DateTime? actualArrivalTime;
  final DateTime? checkoutDate;
  final DateTime? actualDepartureTime;
  final GuestStatus status;
  final bool approvedByHousehold;
  final DateTime createdAt;

  Guest({
    required this.id,
    required this.householdId,
    required this.guestName,
    this.phoneNumber,
    this.vehiclePlate,
    required this.visitType,
    required this.visitDate,
    this.expectedArrivalTime,
    this.actualArrivalTime,
    this.checkoutDate,
    this.actualDepartureTime,
    required this.status,
    required this.approvedByHousehold,
    required this.createdAt,
  });

  factory Guest.fromJson(Map<String, dynamic> json) {
    return Guest(
      id: json['id'] as String,
      householdId: json['household_id'] as String,
      guestName: json['guest_name'] as String,
      phoneNumber: json['phone_number'] as String?,
      vehiclePlate: json['vehicle_plate'] as String?,
      visitType: json['visit_type'] as String,
      visitDate: DateTime.parse(json['visit_date'] as String),
      expectedArrivalTime: json['expected_arrival_time'] as String?,
      actualArrivalTime: json['actual_arrival_time'] != null
          ? DateTime.parse(json['actual_arrival_time'] as String)
          : null,
      checkoutDate: json['checkout_date'] != null
          ? DateTime.parse(json['checkout_date'] as String)
          : null,
      actualDepartureTime: json['actual_departure_time'] != null
          ? DateTime.parse(json['actual_departure_time'] as String)
          : null,
      status: _parseStatus(json['status'] as String),
      approvedByHousehold: json['approved_by_household'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'household_id': householdId,
      'guest_name': guestName,
      'phone_number': phoneNumber,
      'vehicle_plate': vehiclePlate,
      'visit_type': visitType,
      'visit_date': visitDate.toIso8601String().split('T')[0],
      'expected_arrival_time': expectedArrivalTime,
      'checkout_date': checkoutDate?.toIso8601String().split('T')[0],
      'approved_by_household': true,
    };
  }

  static GuestStatus _parseStatus(String status) {
    switch (status) {
      case 'pre_registered':
        return GuestStatus.preRegistered;
      case 'arrived':
        return GuestStatus.arrived;
      case 'departed':
        return GuestStatus.departed;
      case 'overstayed':
        return GuestStatus.overstayed;
      case 'rejected':
        return GuestStatus.rejected;
      default:
        return GuestStatus.preRegistered;
    }
  }

  String get statusDisplay {
    switch (status) {
      case GuestStatus.preRegistered:
        return 'Pre-registered';
      case GuestStatus.arrived:
        return 'Arrived';
      case GuestStatus.departed:
        return 'Departed';
      case GuestStatus.overstayed:
        return 'Overstayed';
      case GuestStatus.rejected:
        return 'Rejected';
    }
  }

  bool get isUpcoming => visitDate.isAfter(DateTime.now()) && status == GuestStatus.preRegistered;
  bool get isPast => status == GuestStatus.departed || visitDate.isBefore(DateTime.now().subtract(const Duration(days: 1)));
}

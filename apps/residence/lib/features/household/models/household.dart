class Household {
  final String id;
  final String tenantId;
  final String propertyId;
  final String householdHeadId;
  final DateTime? moveInDate;
  final String ownershipType;
  final int stickerAllocation;
  final DateTime createdAt;
  final Property? property;
  final HouseholdHead? householdHead;

  Household({
    required this.id,
    required this.tenantId,
    required this.propertyId,
    required this.householdHeadId,
    this.moveInDate,
    required this.ownershipType,
    required this.stickerAllocation,
    required this.createdAt,
    this.property,
    this.householdHead,
  });

  factory Household.fromJson(Map<String, dynamic> json) {
    return Household(
      id: json['id'] as String,
      tenantId: json['tenant_id'] as String,
      propertyId: json['property_id'] as String,
      householdHeadId: json['household_head_id'] as String,
      moveInDate: json['move_in_date'] != null
          ? DateTime.parse(json['move_in_date'] as String)
          : null,
      ownershipType: json['ownership_type'] as String,
      stickerAllocation: json['sticker_allocation'] as int? ?? 3,
      createdAt: DateTime.parse(json['created_at'] as String),
      property: json['property'] != null
          ? Property.fromJson(json['property'] as Map<String, dynamic>)
          : null,
      householdHead: json['household_head'] != null
          ? HouseholdHead.fromJson(json['household_head'] as Map<String, dynamic>)
          : null,
    );
  }

  String get ownershipTypeDisplay {
    switch (ownershipType) {
      case 'owner':
        return 'Owner';
      case 'renter':
        return 'Renter';
      default:
        return ownershipType;
    }
  }
}

class Property {
  final String id;
  final String address;
  final String? phase;
  final String? block;
  final String? lot;
  final String? unit;
  final String propertyType;
  final double? propertySizeSqm;
  final double? lotSizeSqm;
  final int? bedrooms;
  final int? bathrooms;
  final int parkingSlots;

  Property({
    required this.id,
    required this.address,
    this.phase,
    this.block,
    this.lot,
    this.unit,
    required this.propertyType,
    this.propertySizeSqm,
    this.lotSizeSqm,
    this.bedrooms,
    this.bathrooms,
    required this.parkingSlots,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] as String,
      address: json['address'] as String,
      phase: json['phase'] as String?,
      block: json['block'] as String?,
      lot: json['lot'] as String?,
      unit: json['unit'] as String?,
      propertyType: json['property_type'] as String,
      propertySizeSqm: (json['property_size_sqm'] as num?)?.toDouble(),
      lotSizeSqm: (json['lot_size_sqm'] as num?)?.toDouble(),
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      parkingSlots: json['parking_slots'] as int? ?? 0,
    );
  }

  String get formattedLocation {
    final parts = <String>[];
    if (phase != null) parts.add('Phase $phase');
    if (block != null) parts.add('Block $block');
    if (lot != null) parts.add('Lot $lot');
    if (unit != null) parts.add('Unit $unit');
    return parts.isEmpty ? address : parts.join(', ');
  }
}

class HouseholdHead {
  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phoneNumber;

  HouseholdHead({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phoneNumber,
  });

  factory HouseholdHead.fromJson(Map<String, dynamic> json) {
    return HouseholdHead(
      id: json['id'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      email: json['email'] as String?,
      phoneNumber: json['phone_number'] as String?,
    );
  }

  String get fullName => '$firstName $lastName';
}

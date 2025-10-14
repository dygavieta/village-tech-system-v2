class HouseholdMember {
  final String id;
  final String householdId;
  final String? userId;
  final String firstName;
  final String lastName;
  final String relationship;
  final int? age;
  final bool isMinor;
  final DateTime createdAt;

  HouseholdMember({
    required this.id,
    required this.householdId,
    this.userId,
    required this.firstName,
    required this.lastName,
    required this.relationship,
    this.age,
    required this.isMinor,
    required this.createdAt,
  });

  factory HouseholdMember.fromJson(Map<String, dynamic> json) {
    return HouseholdMember(
      id: json['id'] as String,
      householdId: json['household_id'] as String,
      userId: json['user_id'] as String?,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      relationship: json['relationship'] as String,
      age: json['age'] as int?,
      isMinor: json['is_minor'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'household_id': householdId,
      'user_id': userId,
      'first_name': firstName,
      'last_name': lastName,
      'relationship': relationship,
      'age': age,
      'is_minor': isMinor,
    };
  }

  String get fullName => '$firstName $lastName';
}

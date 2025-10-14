// Sentinel App - Pre-Registered Guests Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: List today's expected guests and enable check-in

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

class GuestsScreen extends StatefulWidget {
  const GuestsScreen({super.key});

  @override
  State<GuestsScreen> createState() => _GuestsScreenState();
}

class _GuestsScreenState extends State<GuestsScreen> {
  final SupabaseClient _supabase = Supabase.instance.client;
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _guests = [];
  List<Map<String, dynamic>> _filteredGuests = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadTodaysGuests();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTodaysGuests() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final today = DateTime.now();
      final startOfDay = DateTime(today.year, today.month, today.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final response = await _supabase
          .from('guests')
          .select('''
            id,
            guest_name,
            phone_number,
            vehicle_plate,
            visit_type,
            visit_date,
            expected_arrival_time,
            status,
            household_id,
            households!inner(
              property_id,
              properties!inner(
                address
              ),
              user_profiles!inner(
                first_name,
                last_name,
                phone
              )
            )
          ''')
          .gte('visit_date', startOfDay.toIso8601String())
          .lt('visit_date', endOfDay.toIso8601String())
          .inFilter('status', ['pending', 'checked_in'])
          .order('expected_arrival_time');

      setState(() {
        _guests = List<Map<String, dynamic>>.from(response);
        _filteredGuests = _guests;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading guests: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  void _filterGuests(String query) {
    if (query.isEmpty) {
      setState(() {
        _filteredGuests = _guests;
      });
      return;
    }

    final searchTerm = query.toLowerCase();
    setState(() {
      _filteredGuests = _guests.where((guest) {
        final guestName = (guest['guest_name'] as String).toLowerCase();
        final vehiclePlate = (guest['vehicle_plate'] as String?)?.toLowerCase() ?? '';
        final household = guest['households'] as Map<String, dynamic>;
        final property = household['properties'] as Map<String, dynamic>;
        final address = (property['address'] as String).toLowerCase();

        return guestName.contains(searchTerm) ||
            vehiclePlate.contains(searchTerm) ||
            address.contains(searchTerm);
      }).toList();
    });
  }

  Future<void> _checkInGuest(String guestId, Map<String, dynamic> guest) async {
    try {
      // Update guest status
      await _supabase
          .from('guests')
          .update({'status': 'checked_in'})
          .eq('id', guestId);

      // Log entry
      await _supabase.from('entry_exit_logs').insert({
        'gate_id': 'CURRENT_GATE', // TODO: Get from gate selection
        'entry_type': 'guest',
        'direction': 'entry',
        'timestamp': DateTime.now().toIso8601String(),
        'guest_id': guestId,
        'guard_on_duty_id': _supabase.auth.currentUser?.id,
        'vehicle_plate': guest['vehicle_plate'],
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${guest['guest_name']} checked in successfully'),
            backgroundColor: Colors.green,
          ),
        );
        _loadTodaysGuests();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error checking in guest: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Expected Guests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTodaysGuests,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Search',
                hintText: 'Guest name, plate, or address',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _filterGuests('');
                        },
                      )
                    : null,
              ),
              onChanged: _filterGuests,
            ),
          ),

          // Stats banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.blue[50],
            child: Text(
              'Today\'s guests: ${_filteredGuests.length}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.blue[900],
              ),
            ),
          ),

          // Guest list
          Expanded(
            child: _buildGuestList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Navigate to walk-in visitor approval screen
          Navigator.of(context).pushNamed('/visitor-approval');
        },
        icon: const Icon(Icons.person_add),
        label: const Text('Walk-in Visitor'),
      ),
    );
  }

  Widget _buildGuestList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (_filteredGuests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No guests expected today',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadTodaysGuests,
      child: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: _filteredGuests.length,
        itemBuilder: (context, index) {
          final guest = _filteredGuests[index];
          return _buildGuestCard(guest);
        },
      ),
    );
  }

  Widget _buildGuestCard(Map<String, dynamic> guest) {
    final household = guest['households'] as Map<String, dynamic>;
    final property = household['properties'] as Map<String, dynamic>;
    final userProfile = household['user_profiles'] as Map<String, dynamic>;
    final status = guest['status'] as String;
    final isCheckedIn = status == 'checked_in';

    return Card(
      margin: const EdgeInsets.only(bottom: 12.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: isCheckedIn
                      ? Colors.green[100]
                      : Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(
                    isCheckedIn ? Icons.check : Icons.person_outline,
                    color: isCheckedIn
                        ? Colors.green[700]
                        : Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        guest['guest_name'] as String,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Visiting: ${userProfile['first_name']} ${userProfile['last_name']}',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                if (isCheckedIn)
                  Chip(
                    label: const Text('Checked In'),
                    backgroundColor: Colors.green[100],
                    labelStyle: TextStyle(
                      color: Colors.green[700],
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.location_on, property['address'] as String),
            if (guest['vehicle_plate'] != null)
              _buildInfoRow(Icons.directions_car, guest['vehicle_plate'] as String),
            if (guest['expected_arrival_time'] != null)
              _buildInfoRow(
                Icons.access_time,
                'Expected: ${guest['expected_arrival_time']}',
              ),
            _buildInfoRow(
              Icons.category,
              (guest['visit_type'] as String).replaceAll('_', ' ').toUpperCase(),
            ),
            if (!isCheckedIn) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => _checkInGuest(guest['id'] as String, guest),
                  icon: const Icon(Icons.login),
                  label: const Text('Check In'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[700],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

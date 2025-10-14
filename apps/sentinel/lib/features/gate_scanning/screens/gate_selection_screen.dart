// Sentinel App - Gate Selection Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Allow security officer to select active gate for their shift

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_state.dart';

class GateSelectionScreen extends StatefulWidget {
  const GateSelectionScreen({super.key});

  @override
  State<GateSelectionScreen> createState() => _GateSelectionScreenState();
}

class _GateSelectionScreenState extends State<GateSelectionScreen> {
  final SupabaseClient _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _gates = [];
  bool _isLoading = true;
  String? _error;
  String? _selectedGateId;

  @override
  void initState() {
    super.initState();
    _loadGates();
  }

  Future<void> _loadGates() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch all gates for the tenant
      final response = await _supabase
          .from('gates')
          .select('id, name, gate_type, operational_status, operating_hours, gps_coordinates')
          .eq('operational_status', 'active')
          .order('name');

      setState(() {
        _gates = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _formatOperatingHours(Map<String, dynamic>? hours) {
    if (hours == null) return '24/7';

    final openTime = hours['open'] as String?;
    final closeTime = hours['close'] as String?;

    if (openTime != null && closeTime != null) {
      return '$openTime - $closeTime';
    }

    return '24/7';
  }

  void _selectGate(String gateId, String gateName) {
    setState(() {
      _selectedGateId = gateId;
    });

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Gate Selection'),
        content: Text(
          'You are about to start your shift at $gateName. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _startShift(gateId, gateName);
            },
            child: const Text('Start Shift'),
          ),
        ],
      ),
    );
  }

  void _startShift(String gateId, String gateName) {
    // TODO: Save selected gate to local storage/state management
    // TODO: Log shift start event

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Shift started at $gateName'),
        backgroundColor: Colors.green,
      ),
    );

    // Navigate back or to scanning screen
    Navigator.of(context).pop(gateId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Gate'),
      ),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, authState) {
          if (_isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (_error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading gates',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: TextStyle(color: Colors.grey[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _loadGates,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (_gates.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.sensor_door,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No gates available',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Please contact your administrator',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          // Show assigned gate if available
          if (authState is AuthAuthenticated && authState.gateAssignment != null) {
            return Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16.0),
                  color: Colors.blue[50],
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue[700]),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'You are assigned to Gate ${authState.gateAssignment}',
                          style: TextStyle(
                            color: Colors.blue[900],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(child: _buildGateList()),
              ],
            );
          }

          return _buildGateList();
        },
      ),
    );
  }

  Widget _buildGateList() {
    return RefreshIndicator(
      onRefresh: _loadGates,
      child: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: _gates.length,
        itemBuilder: (context, index) {
          final gate = _gates[index];
          final gateId = gate['id'] as String;
          final gateName = gate['name'] as String;
          final gateType = gate['gate_type'] as String;
          final status = gate['operational_status'] as String;
          final operatingHours = gate['operating_hours'] as Map<String, dynamic>?;

          final isSelected = _selectedGateId == gateId;

          return Card(
            elevation: isSelected ? 4 : 1,
            margin: const EdgeInsets.only(bottom: 12.0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: isSelected
                  ? BorderSide(
                      color: Theme.of(context).colorScheme.primary,
                      width: 2,
                    )
                  : BorderSide.none,
            ),
            child: InkWell(
              onTap: () => _selectGate(gateId, gateName),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.sensor_door,
                          size: 32,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                gateName,
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                gateType.replaceAll('_', ' ').toUpperCase(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey[600],
                                    ),
                              ),
                            ],
                          ),
                        ),
                        if (status == 'active')
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 14,
                                  color: Colors.green[700],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Active',
                                  style: TextStyle(
                                    color: Colors.green[700],
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                        Text(
                          'Operating Hours:',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatOperatingHours(operatingHours),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

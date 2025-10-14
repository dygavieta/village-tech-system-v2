// Sentinel App - Walk-In Visitor Approval Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Request household approval for unregistered visitors with 2-minute timeout

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../bloc/guest_approval_bloc.dart';
import '../bloc/guest_approval_event.dart';
import '../bloc/guest_approval_state.dart';

class VisitorApprovalScreen extends StatefulWidget {
  const VisitorApprovalScreen({super.key});

  @override
  State<VisitorApprovalScreen> createState() => _VisitorApprovalScreenState();
}

class _VisitorApprovalScreenState extends State<VisitorApprovalScreen> {
  final _formKey = GlobalKey<FormState>();
  final _guestNameController = TextEditingController();
  final _vehiclePlateController = TextEditingController();
  final _searchController = TextEditingController();

  String? _selectedHouseholdId;
  Map<String, dynamic>? _selectedHousehold;
  List<Map<String, dynamic>> _households = [];
  bool _isLoadingHouseholds = false;

  @override
  void dispose() {
    _guestNameController.dispose();
    _vehiclePlateController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchHouseholds(String query) async {
    if (query.trim().isEmpty) return;

    setState(() => _isLoadingHouseholds = true);

    try {
      final response = await Supabase.instance.client
          .from('households')
          .select('''
            id,
            property_id,
            properties!inner(address),
            user_profiles!inner(first_name, last_name, phone)
          ''');

      final searchTerm = query.toLowerCase();
      final filtered = response.where((h) {
        final prop = h['properties'] as Map<String, dynamic>;
        final user = h['user_profiles'] as Map<String, dynamic>;
        final address = (prop['address'] as String).toLowerCase();
        final name = '${user['first_name']} ${user['last_name']}'.toLowerCase();
        return address.contains(searchTerm) || name.contains(searchTerm);
      }).toList();

      setState(() {
        _households = List<Map<String, dynamic>>.from(filtered);
        _isLoadingHouseholds = false;
      });
    } catch (e) {
      setState(() => _isLoadingHouseholds = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _requestApproval() {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedHouseholdId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a household')),
      );
      return;
    }

    context.read<GuestApprovalBloc>().add(
          ApprovalRequested(
            householdId: _selectedHouseholdId!,
            guestName: _guestNameController.text.trim(),
            vehiclePlate: _vehiclePlateController.text.trim().isNotEmpty
                ? _vehiclePlateController.text.trim()
                : null,
            gateId: 'CURRENT_GATE', // TODO: Get from context
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Walk-In Visitor'),
      ),
      body: BlocConsumer<GuestApprovalBloc, GuestApprovalState>(
        listener: (context, state) {
          if (state is ApprovalApproved) {
            Navigator.of(context).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Approved: ${state.guestName} may enter'),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is ApprovalRejected) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Rejected: ${state.reason ?? 'Access denied'}'),
                backgroundColor: Colors.red,
              ),
            );
          } else if (state is ApprovalTimeout) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Request timed out - No response from household'),
                backgroundColor: Colors.orange,
              ),
            );
          } else if (state is ApprovalError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Error: ${state.message}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          final isWaiting = state is ApprovalWaiting;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Visitor info
                  Text(
                    'Visitor Information',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _guestNameController,
                    decoration: InputDecoration(
                      labelText: 'Guest Name *',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
                    enabled: !isWaiting,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _vehiclePlateController,
                    decoration: InputDecoration(
                      labelText: 'Vehicle Plate (Optional)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    enabled: !isWaiting,
                  ),
                  const SizedBox(height: 24),

                  // Household search
                  Text(
                    'Visiting Household',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      labelText: 'Search Address or Name',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onSubmitted: _searchHouseholds,
                    enabled: !isWaiting,
                  ),
                  const SizedBox(height: 16),

                  if (_isLoadingHouseholds)
                    const Center(child: CircularProgressIndicator())
                  else if (_selectedHousehold != null)
                    Card(
                      child: ListTile(
                        leading: const CircleAvatar(child: Icon(Icons.home)),
                        title: Text(
                          (_selectedHousehold!['properties'] as Map)['address'] as String,
                        ),
                        subtitle: Text(
                          '${(_selectedHousehold!['user_profiles'] as Map)['first_name']} ${(_selectedHousehold!['user_profiles'] as Map)['last_name']}',
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () => setState(() {
                            _selectedHousehold = null;
                            _selectedHouseholdId = null;
                          }),
                        ),
                      ),
                    )
                  else if (_households.isNotEmpty)
                    ...List.generate(
                      _households.length.clamp(0, 5),
                      (i) {
                        final h = _households[i];
                        return Card(
                          child: ListTile(
                            leading: const CircleAvatar(child: Icon(Icons.home)),
                            title: Text((h['properties'] as Map)['address'] as String),
                            subtitle: Text(
                              '${(h['user_profiles'] as Map)['first_name']} ${(h['user_profiles'] as Map)['last_name']}',
                            ),
                            onTap: () => setState(() {
                              _selectedHousehold = h;
                              _selectedHouseholdId = h['id'] as String;
                            }),
                          ),
                        );
                      },
                    ),

                  const SizedBox(height: 32),

                  // Status display
                  if (isWaiting) ...[
                    Card(
                      color: Colors.blue[50],
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            const CircularProgressIndicator(),
                            const SizedBox(height: 16),
                            Text(
                              'Waiting for household approval...',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Colors.blue[900],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Timeout in ${state.remainingSeconds}s',
                              style: TextStyle(color: Colors.blue[700]),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Request button
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: isWaiting ? null : _requestApproval,
                      icon: const Icon(Icons.send),
                      label: const Text('Request Approval'),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(0, 54),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

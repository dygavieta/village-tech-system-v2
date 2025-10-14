// Sentinel App - Construction Worker Verification
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Verify construction workers against active permits

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class WorkerVerificationScreen extends StatefulWidget {
  const WorkerVerificationScreen({super.key});

  @override
  State<WorkerVerificationScreen> createState() => _WorkerVerificationScreenState();
}

class _WorkerVerificationScreenState extends State<WorkerVerificationScreen> {
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> _permits = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchPermits(String query) async {
    if (query.trim().isEmpty) return;

    setState(() => _isLoading = true);

    try {
      final response = await Supabase.instance.client
          .from('construction_permits')
          .select('''
            *,
            households!inner(
              properties!inner(address),
              user_profiles!inner(first_name, last_name)
            )
          ''')
          .eq('permit_status', 'approved')
          .gte('start_date', DateTime.now().toIso8601String());

      setState(() {
        _permits = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Workers')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Search Address',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: _searchPermits,
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: _permits.length,
                    itemBuilder: (context, index) {
                      final permit = _permits[index];
                      final household = permit['households'] as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: const Icon(Icons.construction),
                          title: Text((household['properties'] as Map)['address'] as String),
                          subtitle: Text(permit['project_type'] as String),
                          trailing: Text('${permit['num_workers']} workers'),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

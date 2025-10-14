// Sentinel App - Delivery Management Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Track delivery arrivals and alert on overstay

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DeliveriesScreen extends StatefulWidget {
  const DeliveriesScreen({super.key});

  @override
  State<DeliveriesScreen> createState() => _DeliveriesScreenState();
}

class _DeliveriesScreenState extends State<DeliveriesScreen> {
  final SupabaseClient _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _deliveries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadActiveDeliveries();
  }

  Future<void> _loadActiveDeliveries() async {
    setState(() => _isLoading = true);

    try {
      final response = await _supabase
          .from('deliveries')
          .select('''
            *,
            households!inner(
              properties!inner(address),
              user_profiles!inner(first_name, last_name, phone)
            )
          ''')
          .inFilter('status', ['pending', 'in_community'])
          .order('created_at', ascending: false);

      setState(() {
        _deliveries = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Deliveries'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadActiveDeliveries,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _deliveries.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.local_shipping_outlined, size: 80, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No active deliveries',
                        style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadActiveDeliveries,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _deliveries.length,
                    itemBuilder: (context, index) => _buildDeliveryCard(_deliveries[index]),
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).pushNamed('/delivery-checkin'),
        icon: const Icon(Icons.add),
        label: const Text('New Delivery'),
      ),
    );
  }

  Widget _buildDeliveryCard(Map<String, dynamic> delivery) {
    final household = delivery['households'] as Map<String, dynamic>;
    final property = household['properties'] as Map<String, dynamic>;
    final status = delivery['status'] as String;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.local_shipping, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        delivery['delivery_company'] as String? ?? 'Unknown Courier',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        delivery['driver_name'] as String,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(status.toUpperCase()),
                  backgroundColor: status == 'in_community' ? Colors.orange[100] : Colors.blue[100],
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildInfoRow(Icons.location_on, property['address'] as String),
            if (delivery['vehicle_plate'] != null)
              _buildInfoRow(Icons.directions_car, delivery['vehicle_plate'] as String),
            if (delivery['package_description'] != null)
              _buildInfoRow(Icons.inventory_2, delivery['package_description'] as String),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: TextStyle(fontSize: 13, color: Colors.grey[700]))),
        ],
      ),
    );
  }
}

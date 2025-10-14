// Sentinel App - Delivery Check-In Form
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Log delivery arrival and notify household

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DeliveryCheckinScreen extends StatefulWidget {
  const DeliveryCheckinScreen({super.key});

  @override
  State<DeliveryCheckinScreen> createState() => _DeliveryCheckinScreenState();
}

class _DeliveryCheckinScreenState extends State<DeliveryCheckinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _deliveryCompanyController = TextEditingController();
  final _driverNameController = TextEditingController();
  final _vehiclePlateController = TextEditingController();
  final _packageDescController = TextEditingController();

  String? _selectedHouseholdId;
  bool _isProcessing = false;

  @override
  void dispose() {
    _deliveryCompanyController.dispose();
    _driverNameController.dispose();
    _vehiclePlateController.dispose();
    _packageDescController.dispose();
    super.dispose();
  }

  Future<void> _submitDelivery() async {
    if (!_formKey.currentState!.validate() || _selectedHouseholdId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Create delivery record
      await Supabase.instance.client.from('deliveries').insert({
        'household_id': _selectedHouseholdId,
        'delivery_company': _deliveryCompanyController.text.trim(),
        'driver_name': _driverNameController.text.trim(),
        'vehicle_plate': _vehiclePlateController.text.trim(),
        'package_description': _packageDescController.text.trim(),
        'status': 'pending',
      });

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Delivery logged'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Log Delivery')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _deliveryCompanyController,
                decoration: const InputDecoration(labelText: 'Delivery Company'),
                validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _driverNameController,
                decoration: const InputDecoration(labelText: 'Driver Name *'),
                validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _vehiclePlateController,
                decoration: const InputDecoration(labelText: 'Vehicle Plate'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _packageDescController,
                decoration: const InputDecoration(labelText: 'Package Description'),
                maxLines: 2,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isProcessing ? null : _submitDelivery,
                  child: _isProcessing
                      ? const CircularProgressIndicator()
                      : const Text('Submit'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

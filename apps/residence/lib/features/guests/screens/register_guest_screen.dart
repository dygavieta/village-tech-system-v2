import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/guest.dart';
import '../providers/guest_provider.dart';
import '../../household/providers/member_provider.dart';

class RegisterGuestScreen extends ConsumerStatefulWidget {
  const RegisterGuestScreen({super.key});

  @override
  ConsumerState<RegisterGuestScreen> createState() => _RegisterGuestScreenState();
}

class _RegisterGuestScreenState extends ConsumerState<RegisterGuestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _plateController = TextEditingController();
  final _timeController = TextEditingController();

  String _visitType = 'day_trip';
  DateTime _visitDate = DateTime.now();
  DateTime? _checkoutDate;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _plateController.dispose();
    _timeController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isCheckout) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isCheckout ? _checkoutDate ?? DateTime.now().add(const Duration(days: 1)) : _visitDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        if (isCheckout) {
          _checkoutDate = picked;
        } else {
          _visitDate = picked;
        }
      });
    }
  }

  Future<void> _saveGuest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_visitType == 'multi_day' && _checkoutDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select checkout date for multi-day visit'), backgroundColor: Colors.orange),
      );
      return;
    }

    final householdId = await ref.read(currentHouseholdIdProvider.future);

    final guest = Guest(
      id: '',
      householdId: householdId,
      guestName: _nameController.text.trim(),
      phoneNumber: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
      vehiclePlate: _plateController.text.trim().toUpperCase().isNotEmpty ? _plateController.text.trim().toUpperCase() : null,
      visitType: _visitType,
      visitDate: _visitDate,
      expectedArrivalTime: _timeController.text.trim().isNotEmpty ? _timeController.text.trim() : null,
      checkoutDate: _checkoutDate,
      status: GuestStatus.preRegistered,
      approvedByHousehold: true,
      createdAt: DateTime.now(),
    );

    await ref.read(guestNotifierProvider.notifier).registerGuest(guest);

    if (!mounted) return;

    final state = ref.read(guestNotifierProvider);

    state.when(
      data: (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Guest registered successfully'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true);
      },
      loading: () {},
      error: (error, _) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $error'), backgroundColor: Colors.red),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final guestState = ref.watch(guestNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Register Guest'), elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Guest Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Guest Name', prefixIcon: Icon(Icons.person), border: OutlineInputBorder()),
                validator: (value) => value == null || value.trim().isEmpty ? 'Please enter guest name' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone Number (Optional)', prefixIcon: Icon(Icons.phone), border: OutlineInputBorder()),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _plateController,
                decoration: const InputDecoration(labelText: 'Vehicle Plate (Optional)', prefixIcon: Icon(Icons.directions_car), border: OutlineInputBorder()),
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _visitType,
                decoration: const InputDecoration(labelText: 'Visit Type', prefixIcon: Icon(Icons.event), border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'day_trip', child: Text('Day Trip')),
                  DropdownMenuItem(value: 'multi_day', child: Text('Multi-day Stay')),
                ],
                onChanged: (value) => setState(() => _visitType = value!),
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Visit Date'),
                subtitle: Text(_formatDate(_visitDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () => _selectDate(context, false),
                tileColor: Colors.grey[100],
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              if (_visitType == 'multi_day') ...[
                const SizedBox(height: 16),
                ListTile(
                  title: const Text('Checkout Date'),
                  subtitle: Text(_checkoutDate != null ? _formatDate(_checkoutDate!) : 'Not selected'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () => _selectDate(context, true),
                  tileColor: Colors.grey[100],
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ],
              const SizedBox(height: 16),
              TextFormField(
                controller: _timeController,
                decoration: const InputDecoration(labelText: 'Expected Arrival Time (Optional)', hintText: '14:00', prefixIcon: Icon(Icons.access_time), border: OutlineInputBorder()),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: guestState.isLoading ? null : _saveGuest,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: guestState.isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                    : const Text('Register Guest', style: TextStyle(fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

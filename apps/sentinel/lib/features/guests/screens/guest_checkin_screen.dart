// Sentinel App - Guest Check-In Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Verify guest ID, take photo, log entry, send arrival notification

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class GuestCheckinScreen extends StatefulWidget {
  final String guestId;
  final Map<String, dynamic> guestData;

  const GuestCheckinScreen({
    super.key,
    required this.guestId,
    required this.guestData,
  });

  @override
  State<GuestCheckinScreen> createState() => _GuestCheckinScreenState();
}

class _GuestCheckinScreenState extends State<GuestCheckinScreen> {
  final SupabaseClient _supabase = Supabase.instance.client;
  final TextEditingController _notesController = TextEditingController();

  bool _isProcessing = false;
  String? _photoPath;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    // TODO: Implement camera integration
    setState(() {
      _photoPath = 'temp/guest_photo_${DateTime.now().millisecondsSinceEpoch}.jpg';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Photo captured (demo mode)')),
    );
  }

  Future<void> _completeCheckIn() async {
    setState(() => _isProcessing = true);

    try {
      // Update guest status
      await _supabase
          .from('guests')
          .update({
            'status': 'checked_in',
            'actual_arrival_time': DateTime.now().toIso8601String(),
          })
          .eq('id', widget.guestId);

      // Log entry
      await _supabase.from('entry_exit_logs').insert({
        'gate_id': 'CURRENT_GATE', // TODO: Get from context
        'entry_type': 'guest',
        'direction': 'entry',
        'timestamp': DateTime.now().toIso8601String(),
        'guest_id': widget.guestId,
        'guard_on_duty_id': _supabase.auth.currentUser?.id,
        'vehicle_plate': widget.guestData['vehicle_plate'],
        'notes': _notesController.text.isNotEmpty ? _notesController.text : null,
      });

      // Send notification to household (placeholder)
      // TODO: Implement push notification

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.guestData['guest_name']} checked in successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
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
        title: const Text('Guest Check-In'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Guest info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.guestData['guest_name'] as String,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow('Phone', widget.guestData['phone_number'] as String?),
                    _buildInfoRow('Vehicle', widget.guestData['vehicle_plate'] as String?),
                    _buildInfoRow('Type', (widget.guestData['visit_type'] as String).toUpperCase()),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Photo section
            Text(
              'Guest Photo',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            if (_photoPath == null)
              OutlinedButton.icon(
                onPressed: _takePhoto,
                icon: const Icon(Icons.camera_alt),
                label: const Text('Take Photo'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
              )
            else
              Stack(
                children: [
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Icon(Icons.person, size: 80, color: Colors.grey),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: IconButton(
                      icon: const Icon(Icons.close),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white,
                      ),
                      onPressed: () => setState(() => _photoPath = null),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 24),

            // Notes
            Text(
              'Notes (Optional)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: InputDecoration(
                hintText: 'Any additional notes...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              maxLines: 3,
              enabled: !_isProcessing,
            ),
            const SizedBox(height: 32),

            // Check-in button
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isProcessing ? null : _completeCheckIn,
                icon: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.login),
                label: const Text('Complete Check-In'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 54),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String? value) {
    if (value == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

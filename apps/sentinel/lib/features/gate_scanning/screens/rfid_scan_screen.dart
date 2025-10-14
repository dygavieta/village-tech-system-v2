// Sentinel App - RFID Scanning Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Scan RFID stickers, display resident info, and auto-log entry/exit

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_state.dart';

class RfidScanScreen extends StatefulWidget {
  final String? gateId;

  const RfidScanScreen({super.key, this.gateId});

  @override
  State<RfidScanScreen> createState() => _RfidScanScreenState();
}

class _RfidScanScreenState extends State<RfidScanScreen> {
  final TextEditingController _rfidController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  bool _isScanning = false;
  bool _isProcessing = false;
  Map<String, dynamic>? _lastScanResult;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Auto-focus the RFID input field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _rfidController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _handleRfidScan(String rfidSerial) async {
    if (_isProcessing || rfidSerial.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
      _lastScanResult = null;
    });

    try {
      // Fetch sticker information
      final stickerResponse = await supabase
          .from('vehicle_stickers')
          .select('''
            id,
            rfid_serial,
            vehicle_plate,
            vehicle_make,
            vehicle_model,
            vehicle_color,
            sticker_type,
            status,
            expiration_date,
            household_id,
            households!inner(
              id,
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
          .eq('rfid_serial', rfidSerial)
          .eq('status', 'active')
          .maybeSingle();

      if (stickerResponse == null) {
        setState(() {
          _errorMessage = 'Invalid or inactive RFID sticker';
          _isProcessing = false;
        });
        _playErrorSound();
        return;
      }

      // Check expiration
      final expirationDate = DateTime.parse(stickerResponse['expiration_date'] as String);
      if (expirationDate.isBefore(DateTime.now())) {
        setState(() {
          _errorMessage = 'Sticker has expired';
          _isProcessing = false;
        });
        _playErrorSound();
        return;
      }

      // Log entry
      final authState = context.read<AuthBloc>().state;
      String? guardId;
      if (authState is AuthAuthenticated) {
        guardId = authState.user.id;
      }

      final logResponse = await supabase
          .from('entry_exit_logs')
          .insert({
            'gate_id': widget.gateId,
            'entry_type': 'resident',
            'direction': 'entry',
            'timestamp': DateTime.now().toIso8601String(),
            'sticker_id': stickerResponse['id'],
            'guard_on_duty_id': guardId,
            'vehicle_plate': stickerResponse['vehicle_plate'],
          })
          .select()
          .single();

      setState(() {
        _lastScanResult = {
          ...stickerResponse,
          'log_id': logResponse['id'],
          'log_timestamp': logResponse['timestamp'],
        };
        _isProcessing = false;
      });

      _playSuccessSound();

      // Clear input and refocus after 2 seconds
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _lastScanResult = null;
          });
          _rfidController.clear();
          _focusNode.requestFocus();
        }
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error processing scan: ${e.toString()}';
        _isProcessing = false;
      });
      _playErrorSound();
    }
  }

  void _playSuccessSound() {
    // TODO: Implement success sound/haptic feedback
    HapticFeedback.mediumImpact();
  }

  void _playErrorSound() {
    // TODO: Implement error sound/haptic feedback
    HapticFeedback.vibrate();
  }

  void _manualBarrierControl() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Manual Barrier Control'),
        content: const Text('Open the barrier manually?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Integrate with barrier control system
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Barrier opened manually'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Open Barrier'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RFID Scanning'),
        actions: [
          IconButton(
            icon: const Icon(Icons.door_front_door),
            onPressed: _manualBarrierControl,
            tooltip: 'Manual Barrier Control',
          ),
        ],
      ),
      body: Column(
        children: [
          // Gate info banner
          if (widget.gateId != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12.0),
              color: Theme.of(context).colorScheme.primaryContainer,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.location_on,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Gate ${widget.gateId}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                  ),
                ],
              ),
            ),

          // RFID input (hidden from user, for scanner input)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _rfidController,
              focusNode: _focusNode,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'RFID Serial',
                hintText: 'Scan RFID sticker or enter manually',
                prefixIcon: const Icon(Icons.qr_code_scanner),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                suffixIcon: _isProcessing
                    ? const Padding(
                        padding: EdgeInsets.all(12.0),
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : IconButton(
                        icon: const Icon(Icons.search),
                        onPressed: () => _handleRfidScan(_rfidController.text),
                      ),
              ),
              onSubmitted: _handleRfidScan,
              enabled: !_isProcessing,
            ),
          ),

          // Status display
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: _buildStatusDisplay(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusDisplay() {
    if (_errorMessage != null) {
      return _buildErrorCard();
    }

    if (_lastScanResult != null) {
      return _buildSuccessCard();
    }

    return _buildIdleState();
  }

  Widget _buildIdleState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.qr_code_scanner,
            size: 120,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 24),
          Text(
            'Ready to Scan',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.grey[700],
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            'Scan RFID sticker to log entry',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Card(
      color: Colors.red[50],
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.red[700],
            ),
            const SizedBox(height: 16),
            Text(
              'Access Denied',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.red[900],
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: TextStyle(
                color: Colors.red[800],
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {
                setState(() {
                  _errorMessage = null;
                });
                _rfidController.clear();
                _focusNode.requestFocus();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Scan Again'),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red[700],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessCard() {
    final household = _lastScanResult!['households'] as Map<String, dynamic>;
    final property = household['properties'] as Map<String, dynamic>;
    final userProfile = household['user_profiles'] as Map<String, dynamic>;

    return Card(
      color: Colors.green[50],
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(
              Icons.check_circle,
              size: 80,
              color: Colors.green[700],
            ),
            const SizedBox(height: 16),
            Text(
              'Access Granted',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.green[900],
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 24),
            _buildInfoRow('Resident', '${userProfile['first_name']} ${userProfile['last_name']}'),
            _buildInfoRow('Address', property['address'] as String),
            _buildInfoRow('Vehicle', '${_lastScanResult!['vehicle_make']} ${_lastScanResult!['vehicle_model']}'),
            _buildInfoRow('Plate', _lastScanResult!['vehicle_plate'] as String),
            _buildInfoRow('Sticker Type', (_lastScanResult!['sticker_type'] as String).toUpperCase()),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.schedule, size: 16, color: Colors.green[900]),
                  const SizedBox(width: 8),
                  Text(
                    'Entry logged at ${DateTime.parse(_lastScanResult!['log_timestamp'] as String).toLocal().toString().substring(11, 19)}',
                    style: TextStyle(
                      color: Colors.green[900],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Residence App - Guest Approval Dialog
// User Story 4: Security Officer Manages Gate Entry/Exit (Residence side)
// Purpose: Display visitor info with approve/reject buttons and timeout countdown

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../providers/approval_provider.dart';

class GuestApprovalDialog extends ConsumerStatefulWidget {
  final GuestApprovalRequest request;

  const GuestApprovalDialog({
    super.key,
    required this.request,
  });

  @override
  ConsumerState<GuestApprovalDialog> createState() => _GuestApprovalDialogState();
}

class _GuestApprovalDialogState extends ConsumerState<GuestApprovalDialog> {
  late int _remainingSeconds;
  Timer? _countdownTimer;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _calculateRemainingTime();
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _calculateRemainingTime() {
    final now = DateTime.now();
    final diff = widget.request.timeoutAt.difference(now);
    _remainingSeconds = diff.inSeconds.clamp(0, 120);
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _remainingSeconds--;
        if (_remainingSeconds <= 0) {
          timer.cancel();
          Navigator.of(context).pop();
        }
      });
    });
  }

  Future<void> _approve() async {
    setState(() => _isProcessing = true);

    try {
      await ref.read(approvalResponseProvider).approveGuest(widget.request.id);

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.request.guestName} approved for entry'),
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

  Future<void> _reject() async {
    setState(() => _isProcessing = true);

    try {
      await ref.read(approvalResponseProvider).rejectGuest(
            widget.request.id,
            reason: 'Not expecting this visitor',
          );

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Guest entry rejected'),
            backgroundColor: Colors.orange,
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
    return AlertDialog(
      title: Row(
        children: [
          const Icon(Icons.person_add, color: Colors.blue),
          const SizedBox(width: 12),
          const Expanded(child: Text('Guest Approval Request')),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Guest info
          Card(
            color: Colors.blue[50],
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.request.guestName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (widget.request.vehiclePlate != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.directions_car, size: 16),
                        const SizedBox(width: 8),
                        Text(widget.request.vehiclePlate!),
                      ],
                    ),
                    const SizedBox(height: 4),
                  ],
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16),
                      const SizedBox(width: 8),
                      Text('At Gate ${widget.request.gateId}'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Countdown
          Center(
            child: Column(
              children: [
                Text(
                  'Time remaining: ${_remainingSeconds}s',
                  style: TextStyle(
                    color: _remainingSeconds < 30 ? Colors.red : Colors.orange,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: _remainingSeconds / 120,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _remainingSeconds < 30 ? Colors.red : Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        if (_isProcessing)
          const Center(child: CircularProgressIndicator())
        else ...[
          OutlinedButton(
            onPressed: _reject,
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Reject'),
          ),
          FilledButton(
            onPressed: _approve,
            child: const Text('Approve Entry'),
          ),
        ],
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/permit_provider.dart';
import '../models/construction_permit.dart';
import 'request_permit_screen.dart';

class PermitsScreen extends ConsumerWidget {
  const PermitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permitsAsync = ref.watch(permitsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Construction Permits'), elevation: 0),
      body: permitsAsync.when(
        data: (permits) {
          if (permits.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.construction, size: 80, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text('No permits yet', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.grey[600])),
                  const SizedBox(height: 8),
                  Text('Request a construction permit', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[500])),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: permits.length,
            itemBuilder: (context, index) {
              final permit = permits[index];
              return _PermitCard(permit: permit);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error: $error'),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.refresh(permitsProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const RequestPermitScreen()),
          );
          if (result == true) {
            ref.refresh(permitsProvider);
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Request Permit'),
      ),
    );
  }
}

class _PermitCard extends StatelessWidget {
  final ConstructionPermit permit;

  const _PermitCard({required this.permit});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(_capitalizeFirst(permit.projectType), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                _buildStatusChip(permit.permitStatus),
              ],
            ),
            const SizedBox(height: 8),
            Text(permit.description, style: TextStyle(color: Colors.grey[700])),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text('Start: ${_formatDate(permit.startDate)}', style: TextStyle(color: Colors.grey[600])),
                const SizedBox(width: 16),
                const Icon(Icons.timelapse, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text('${permit.durationDays} days', style: TextStyle(color: Colors.grey[600])),
              ],
            ),
            if (permit.contractorName != null) ...[
              const SizedBox(height: 4),
              Text('Contractor: ${permit.contractorName}', style: TextStyle(color: Colors.grey[600])),
            ],
            if (permit.roadFeeAmount > 0) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Road Fee: ₱${permit.roadFeeAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(permit.paymentStatusDisplay, style: TextStyle(color: permit.paymentStatus == 'paid' ? Colors.green : Colors.orange)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(PermitStatus status) {
    Color color;
    switch (status) {
      case PermitStatus.pendingApproval:
        color = Colors.orange;
        break;
      case PermitStatus.approved:
      case PermitStatus.active:
        color = Colors.green;
        break;
      case PermitStatus.completed:
        color = Colors.blue;
        break;
      case PermitStatus.onHold:
        color = Colors.grey;
        break;
      case PermitStatus.rejected:
        color = Colors.red;
        break;
    }

    return Chip(
      label: Text(permit.permitStatusDisplay, style: const TextStyle(fontSize: 12)),
      backgroundColor: color.withOpacity(0.1),
      labelStyle: TextStyle(color: color),
    );
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text.split('_').map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

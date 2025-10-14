import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/sticker_provider.dart';
import '../models/vehicle_sticker.dart';
import 'request_sticker_screen.dart';

class StickersScreen extends ConsumerWidget {
  const StickersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stickersAsync = ref.watch(vehicleStickersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicle Stickers'),
        elevation: 0,
      ),
      body: stickersAsync.when(
        data: (stickers) {
          if (stickers.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.directions_car_outlined, size: 80, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text('No vehicle stickers yet', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.grey[600])),
                  const SizedBox(height: 8),
                  Text('Request your first vehicle sticker', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[500])),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: stickers.length,
            itemBuilder: (context, index) {
              final sticker = stickers[index];
              return _StickerCard(sticker: sticker);
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
                onPressed: () => ref.refresh(vehicleStickersProvider),
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
            MaterialPageRoute(builder: (context) => const RequestStickerScreen()),
          );
          if (result == true) {
            ref.refresh(vehicleStickersProvider);
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Request Sticker'),
      ),
    );
  }
}

class _StickerCard extends StatelessWidget {
  final VehicleSticker sticker;

  const _StickerCard({required this.sticker});

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
                Text(sticker.vehiclePlate, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                _buildStatusChip(sticker.status),
              ],
            ),
            const SizedBox(height: 8),
            if (sticker.vehicleMake != null) Text('${sticker.vehicleMake} - ${sticker.vehicleColor ?? "N/A"}'),
            const SizedBox(height: 4),
            Text('Type: ${sticker.stickerType}', style: TextStyle(color: Colors.grey[600])),
            if (sticker.rfidSerial != null) ...[
              const SizedBox(height: 4),
              Text('RFID: ${sticker.rfidSerial}', style: TextStyle(color: Colors.grey[600])),
            ],
            if (sticker.expiryDate != null) ...[
              const SizedBox(height: 4),
              Text('Expires: ${_formatDate(sticker.expiryDate!)}', style: TextStyle(color: Colors.grey[600])),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(StickerStatus status) {
    Color color;
    switch (status) {
      case StickerStatus.pending:
        color = Colors.orange;
        break;
      case StickerStatus.approved:
      case StickerStatus.readyForPickup:
        color = Colors.blue;
        break;
      case StickerStatus.issued:
        color = Colors.green;
        break;
      default:
        color = Colors.grey;
    }

    return Chip(
      label: Text(sticker.statusDisplay, style: const TextStyle(fontSize: 12)),
      backgroundColor: color.withOpacity(0.1),
      labelStyle: TextStyle(color: color),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

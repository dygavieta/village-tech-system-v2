import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/guest_provider.dart';
import '../models/guest.dart';
import 'register_guest_screen.dart';

class GuestsScreen extends ConsumerStatefulWidget {
  const GuestsScreen({super.key});

  @override
  ConsumerState<GuestsScreen> createState() => _GuestsScreenState();
}

class _GuestsScreenState extends ConsumerState<GuestsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final guestsAsync = ref.watch(guestsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Guests'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: guestsAsync.when(
        data: (guests) {
          final upcomingGuests = guests.where((g) => g.isUpcoming).toList();
          final pastGuests = guests.where((g) => g.isPast).toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _buildGuestList(upcomingGuests, 'No upcoming guests'),
              _buildGuestList(pastGuests, 'No past guests'),
            ],
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
                onPressed: () => ref.refresh(guestsProvider),
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
            MaterialPageRoute(builder: (context) => const RegisterGuestScreen()),
          );
          if (result == true) {
            ref.refresh(guestsProvider);
          }
        },
        icon: const Icon(Icons.person_add),
        label: const Text('Add Guest'),
      ),
    );
  }

  Widget _buildGuestList(List<Guest> guests, String emptyMessage) {
    if (guests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(emptyMessage, style: TextStyle(fontSize: 16, color: Colors.grey[600])),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: guests.length,
      itemBuilder: (context, index) {
        final guest = guests[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: const Icon(Icons.person, color: Colors.white),
            ),
            title: Text(guest.guestName, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text('Visit: ${_formatDate(guest.visitDate)}'),
                if (guest.vehiclePlate != null) Text('Vehicle: ${guest.vehiclePlate}'),
                if (guest.expectedArrivalTime != null) Text('Time: ${guest.expectedArrivalTime}'),
              ],
            ),
            trailing: _buildStatusChip(guest.status),
            isThreeLine: true,
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(GuestStatus status) {
    Color color;
    switch (status) {
      case GuestStatus.preRegistered:
        color = Colors.blue;
        break;
      case GuestStatus.arrived:
        color = Colors.green;
        break;
      case GuestStatus.departed:
        color = Colors.grey;
        break;
      case GuestStatus.overstayed:
        color = Colors.orange;
        break;
      case GuestStatus.rejected:
        color = Colors.red;
        break;
    }

    return Chip(
      label: Text(_getStatusText(status), style: const TextStyle(fontSize: 12)),
      backgroundColor: color.withOpacity(0.1),
      labelStyle: TextStyle(color: color),
    );
  }

  String _getStatusText(GuestStatus status) {
    switch (status) {
      case GuestStatus.preRegistered:
        return 'Pre-registered';
      case GuestStatus.arrived:
        return 'Arrived';
      case GuestStatus.departed:
        return 'Departed';
      case GuestStatus.overstayed:
        return 'Overstayed';
      case GuestStatus.rejected:
        return 'Rejected';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

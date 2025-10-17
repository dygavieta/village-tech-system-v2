/**
 * Services screen
 * Aggregates all service features (household, permits, stickers, guests, fees)
 */

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final services = [
      _ServiceItem(
        icon: Icons.directions_car,
        title: 'Vehicle\nStickers',
        onTap: () => context.go('/stickers'),
      ),
      _ServiceItem(
        icon: Icons.construction,
        title: 'Construction\nPermits',
        onTap: () => context.go('/permits'),
      ),
      _ServiceItem(
        icon: Icons.menu_book,
        title: 'Rule Book',
        onTap: () => context.push('/announcements/rules'),
      ),
      _ServiceItem(
        icon: Icons.nightlight,
        title: 'Curfews',
        onTap: () => context.push('/announcements/curfew'),
      ),
      _ServiceItem(
        icon: Icons.cottage,
        title: 'Household',
        onTap: () => context.go('/household'),
      ),
      _ServiceItem(
        icon: Icons.groups,
        title: 'Guest',
        onTap: () => context.go('/guests'),
      ),
      _ServiceItem(
        icon: Icons.account_balance_wallet,
        title: 'Association\nFees',
        onTap: () => context.go('/fees'),
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Services'),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 16,
            mainAxisSpacing: 20,
            childAspectRatio: 0.9,
          ),
          itemCount: services.length,
          itemBuilder: (context, index) {
            final service = services[index];
            return InkWell(
              onTap: service.onTap,
              borderRadius: BorderRadius.circular(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Theme.of(context)
                          .colorScheme
                          .primary
                          .withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      service.icon,
                      size: 28,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: Text(
                      service.title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            height: 1.2,
                            fontSize: 12,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ServiceItem {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ServiceItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });
}

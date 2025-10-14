// Sentinel App - Home Screen
// User Story 4: Security Officer Manages Gate Entry/Exit
// Purpose: Main app layout with bottom navigation for all gate operations

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_state.dart' as app_auth;
import '../../auth/bloc/auth_event.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  // Navigation items for bottom navigation bar
  static const List<NavigationItem> _navigationItems = [
    NavigationItem(
      icon: Icons.qr_code_scanner,
      label: 'Gate Scanning',
      route: '/gate-scanning',
    ),
    NavigationItem(
      icon: Icons.people,
      label: 'Residents',
      route: '/residents',
    ),
    NavigationItem(
      icon: Icons.person_add,
      label: 'Guests',
      route: '/guests',
    ),
    NavigationItem(
      icon: Icons.local_shipping,
      label: 'Deliveries',
      route: '/deliveries',
    ),
    NavigationItem(
      icon: Icons.construction,
      label: 'Permits',
      route: '/permits',
    ),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });

    // TODO: Navigate to respective screens when they are implemented
    // For now, we'll show placeholder content
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, app_auth.AuthState>(
      builder: (context, state) {
        if (state is! app_auth.AuthAuthenticated) {
          // If not authenticated, redirect to login
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.of(context).pushReplacementNamed('/login');
          });
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Sentinel'),
            centerTitle: false,
            actions: [
              // Display current gate assignment if available
              if (state.gateAssignment != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          'Gate ${state.gateAssignment}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              // Profile menu
              PopupMenuButton<String>(
                icon: const Icon(Icons.account_circle),
                onSelected: (value) {
                  if (value == 'profile') {
                    // TODO: Navigate to profile screen
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Profile screen coming soon')),
                    );
                  } else if (value == 'incidents') {
                    // TODO: Navigate to incidents screen
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Incidents screen coming soon')),
                    );
                  } else if (value == 'settings') {
                    // TODO: Navigate to settings screen
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Settings screen coming soon')),
                    );
                  } else if (value == 'logout') {
                    context.read<AuthBloc>().add(const LogoutRequested());
                  }
                },
                itemBuilder: (BuildContext context) => [
                  PopupMenuItem(
                    value: 'profile',
                    child: Row(
                      children: [
                        const Icon(Icons.person),
                        const SizedBox(width: 8),
                        Text(state.user.email ?? 'Profile'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'incidents',
                    child: Row(
                      children: [
                        Icon(Icons.warning),
                        SizedBox(width: 8),
                        Text('Report Incident'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'settings',
                    child: Row(
                      children: [
                        Icon(Icons.settings),
                        SizedBox(width: 8),
                        Text('Settings'),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: 'logout',
                    child: Row(
                      children: [
                        Icon(Icons.logout, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Logout', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          body: _buildBody(),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _selectedIndex,
            onDestinationSelected: _onItemTapped,
            destinations: _navigationItems
                .map(
                  (item) => NavigationDestination(
                    icon: Icon(item.icon),
                    label: item.label,
                  ),
                )
                .toList(),
          ),
        );
      },
    );
  }

  Widget _buildBody() {
    // Placeholder content for each tab
    // TODO: Replace with actual screens when implemented
    switch (_selectedIndex) {
      case 0:
        return _buildPlaceholder(
          icon: Icons.qr_code_scanner,
          title: 'Gate Scanning',
          description: 'Scan RFID stickers and log entries/exits',
        );
      case 1:
        return _buildPlaceholder(
          icon: Icons.people,
          title: 'Residents',
          description: 'Search and verify resident information',
        );
      case 2:
        return _buildPlaceholder(
          icon: Icons.person_add,
          title: 'Guests',
          description: 'Manage pre-registered guests and visitor approvals',
        );
      case 3:
        return _buildPlaceholder(
          icon: Icons.local_shipping,
          title: 'Deliveries',
          description: 'Track deliveries and notify households',
        );
      case 4:
        return _buildPlaceholder(
          icon: Icons.construction,
          title: 'Permits',
          description: 'Verify construction permits and workers',
        );
      default:
        return const Center(child: Text('Unknown tab'));
    }
  }

  Widget _buildPlaceholder({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 80,
              color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Feature coming soon',
                      style: TextStyle(fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Data class for navigation items
class NavigationItem {
  final IconData icon;
  final String label;
  final String route;

  const NavigationItem({
    required this.icon,
    required this.label,
    required this.route,
  });
}

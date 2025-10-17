/**
 * Main home screen for Residence app
 * Provides bottom navigation between home, services, profile, and settings
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class HomeScreen extends ConsumerStatefulWidget {
  final Widget child;

  const HomeScreen({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _getSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/services')) return 1;
    if (location.startsWith('/profile')) return 2;
    if (location.startsWith('/settings')) return 3;
    return 0;
  }

  void _onDestinationSelected(int index) {
    // Navigate to corresponding route
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/services');
        break;
      case 2:
        context.go('/profile');
        break;
      case 3:
        context.go('/settings');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _getSelectedIndex(context);

    return Scaffold(
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: _onDestinationSelected,
        backgroundColor: Colors.white,
        indicatorColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        height: 70,
        destinations: [
          NavigationDestination(
            icon: Icon(
              Icons.home_outlined,
              color: selectedIndex == 0 ? AppColors.primary : AppColors.textTertiary,
            ),
            selectedIcon: Icon(
              Icons.home,
              color: AppColors.primary,
            ),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(
              Icons.list_outlined,
              color: selectedIndex == 1 ? AppColors.primary : AppColors.textTertiary,
            ),
            selectedIcon: Icon(
              Icons.list,
              color: AppColors.primary,
            ),
            label: 'Services',
          ),
          NavigationDestination(
            icon: Icon(
              Icons.person_outline,
              color: selectedIndex == 2 ? AppColors.primary : AppColors.textTertiary,
            ),
            selectedIcon: Icon(
              Icons.person,
              color: AppColors.primary,
            ),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(
              Icons.settings_outlined,
              color: selectedIndex == 3 ? AppColors.primary : AppColors.textTertiary,
            ),
            selectedIcon: Icon(
              Icons.settings,
              color: AppColors.primary,
            ),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

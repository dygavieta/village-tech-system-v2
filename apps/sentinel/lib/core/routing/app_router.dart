/**
 * Go Router configuration for Sentinel app
 * Security-focused routing with offline support
 */

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Route names
class Routes {
  static const String splash = '/';
  static const String login = '/login';
  static const String dashboard = '/dashboard';
  static const String scan = '/scan';
  static const String guestEntry = '/guest-entry';
  static const String deliveryEntry = '/delivery-entry';
  static const String incidents = '/incidents';
  static const String logs = '/logs';
  static const String offline = '/offline';
}

/// Router configuration
final appRouter = GoRouter(
  initialLocation: Routes.splash,
  routes: [
    GoRoute(
      path: Routes.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: Routes.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: Routes.dashboard,
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: Routes.scan,
      builder: (context, state) => const ScanScreen(),
    ),
    GoRoute(
      path: Routes.guestEntry,
      builder: (context, state) => const GuestEntryScreen(),
    ),
    GoRoute(
      path: Routes.deliveryEntry,
      builder: (context, state) => const DeliveryEntryScreen(),
    ),
    GoRoute(
      path: Routes.incidents,
      builder: (context, state) => const IncidentsScreen(),
    ),
    GoRoute(
      path: Routes.logs,
      builder: (context, state) => const LogsScreen(),
    ),
    GoRoute(
      path: Routes.offline,
      builder: (context, state) => const OfflineScreen(),
    ),
  ],
);

// Placeholder screens (to be implemented)
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Login Screen')));
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Dashboard Screen')));
}

class ScanScreen extends StatelessWidget {
  const ScanScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Scan Screen')));
}

class GuestEntryScreen extends StatelessWidget {
  const GuestEntryScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Guest Entry Screen')));
}

class DeliveryEntryScreen extends StatelessWidget {
  const DeliveryEntryScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Delivery Entry Screen')));
}

class IncidentsScreen extends StatelessWidget {
  const IncidentsScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Incidents Screen')));
}

class LogsScreen extends StatelessWidget {
  const LogsScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Logs Screen')));
}

class OfflineScreen extends StatelessWidget {
  const OfflineScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Offline Mode')));
}

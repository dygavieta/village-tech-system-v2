/**
 * Go Router configuration for Residence app
 * Declarative routing with auth redirects
 */

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:residence/features/auth/providers/auth_provider.dart';

/// Route names
class Routes {
  static const String splash = '/';
  static const String login = '/login';
  static const String home = '/home';
  static const String profile = '/profile';
  static const String stickers = '/stickers';
  static const String guests = '/guests';
  static const String permits = '/permits';
  static const String announcements = '/announcements';
}

/// Router provider
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: Routes.splash,
    redirect: (context, state) {
      final isAuthenticated = authState.value?.session != null;
      final isLoggingIn = state.matchedLocation == Routes.login;

      if (!isAuthenticated && !isLoggingIn) {
        return Routes.login;
      }

      if (isAuthenticated && isLoggingIn) {
        return Routes.home;
      }

      return null;
    },
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
        path: Routes.home,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: Routes.profile,
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: Routes.stickers,
        builder: (context, state) => const StickersScreen(),
      ),
      GoRoute(
        path: Routes.guests,
        builder: (context, state) => const GuestsScreen(),
      ),
      GoRoute(
        path: Routes.permits,
        builder: (context, state) => const PermitsScreen(),
      ),
      GoRoute(
        path: Routes.announcements,
        builder: (context, state) => const AnnouncementsScreen(),
      ),
    ],
  );
});

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

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Home Screen')));
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Profile Screen')));
}

class StickersScreen extends StatelessWidget {
  const StickersScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Stickers Screen')));
}

class GuestsScreen extends StatelessWidget {
  const GuestsScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Guests Screen')));
}

class PermitsScreen extends StatelessWidget {
  const PermitsScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Permits Screen')));
}

class AnnouncementsScreen extends StatelessWidget {
  const AnnouncementsScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Announcements Screen')));
}

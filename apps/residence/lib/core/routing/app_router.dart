/**
 * Go Router configuration for Residence app
 * Declarative routing with auth redirects
 */

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/household/screens/household_profile_screen.dart';
import '../../features/household/screens/members_screen.dart';
import '../../features/stickers/screens/stickers_screen.dart';
import '../../features/guests/screens/guests_screen.dart';
import '../../features/permits/screens/permits_screen.dart';

/// Route names
class Routes {
  static const String login = '/login';
  static const String household = '/household';
  static const String members = '/household/members';
  static const String stickers = '/stickers';
  static const String guests = '/guests';
  static const String permits = '/permits';
}

/// Router provider with auth redirect
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: Routes.household,
    redirect: (context, state) {
      // Get current auth state
      final authState = ref.read(authNotifierProvider);
      final isAuthenticated = authState.hasValue && authState.value != null;
      final isLoggingIn = state.matchedLocation == Routes.login;

      // Redirect to login if not authenticated and not already on login page
      if (!isAuthenticated && !isLoggingIn) {
        return Routes.login;
      }

      // Redirect to household if authenticated and trying to access login
      if (isAuthenticated && isLoggingIn) {
        return Routes.household;
      }

      return null; // No redirect needed
    },
    routes: [
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(
            path: Routes.household,
            builder: (context, state) => const HouseholdProfileScreen(),
          ),
          GoRoute(
            path: Routes.members,
            builder: (context, state) => const MembersScreen(),
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
        ],
      ),
    ],
  );
});

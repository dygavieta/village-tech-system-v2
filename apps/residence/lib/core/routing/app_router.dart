/**
 * Go Router configuration for Residence app
 * Declarative routing with auth redirects
 */

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/home/screens/announcements_home_screen.dart';
import '../../features/home/screens/services_screen.dart';
import '../../features/home/screens/profile_screen.dart';
import '../../features/home/screens/settings_screen.dart';
import '../../features/household/screens/household_profile_screen.dart';
import '../../features/household/screens/members_screen.dart';
import '../../features/stickers/screens/stickers_screen.dart';
import '../../features/guests/screens/guests_screen.dart';
import '../../features/permits/screens/permits_screen.dart';
import '../../features/announcements/screens/announcements_screen.dart';
import '../../features/announcements/screens/announcement_detail_screen.dart';
import '../../features/announcements/screens/village_rules_screen.dart';
import '../../features/announcements/screens/rule_detail_screen.dart';
import '../../features/announcements/screens/curfew_screen.dart';
import '../../features/fees/screens/fees_screen.dart';
import '../../features/fees/screens/fee_payment_screen.dart';

/// Route names
class Routes {
  static const String login = '/login';
  static const String home = '/home';
  static const String services = '/services';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String household = '/household';
  static const String members = '/household/members';
  static const String stickers = '/stickers';
  static const String guests = '/guests';
  static const String permits = '/permits';
  static const String announcements = '/announcements';
  static const String announcementDetail = '/announcements/detail/:id';
  static const String villageRules = '/announcements/rules';
  static const String curfew = '/announcements/curfew';
  static const String fees = '/fees';
  static const String feePayment = '/fees/payment/:id';
}

/// Router provider with auth redirect
final routerProvider = Provider<GoRouter>((ref) {
  // Watch auth state to trigger router refresh on auth changes
  final authStateStream = ref.watch(authStateProvider.stream);

  return GoRouter(
    initialLocation: Routes.home,
    refreshListenable: GoRouterRefreshStream(authStateStream),
    redirect: (context, state) {
      // Get current auth state
      final authState = ref.read(authStateProvider);
      final isAuthenticated = authState.hasValue &&
                              authState.value?.session != null;
      final isLoggingIn = state.matchedLocation == Routes.login;

      // Redirect to login if not authenticated and not already on login page
      if (!isAuthenticated && !isLoggingIn) {
        return Routes.login;
      }

      // Redirect to home if authenticated and trying to access login
      if (isAuthenticated && isLoggingIn) {
        return Routes.home;
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
          // Main navigation tabs
          GoRoute(
            path: Routes.home,
            builder: (context, state) => const AnnouncementsHomeScreen(),
          ),
          GoRoute(
            path: Routes.services,
            builder: (context, state) => const ServicesScreen(),
          ),
          GoRoute(
            path: Routes.profile,
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: Routes.settings,
            builder: (context, state) => const SettingsScreen(),
          ),

          // Service-specific routes (accessible from Services tab)
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
          GoRoute(
            path: Routes.fees,
            builder: (context, state) => const FeesScreen(),
          ),
          GoRoute(
            path: Routes.announcements,
            builder: (context, state) => const AnnouncementsScreen(),
          ),

          // Announcement detail routes (with navigation bar)
          GoRoute(
            path: '/announcements/detail/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return AnnouncementDetailScreen(announcementId: id);
            },
          ),
          GoRoute(
            path: '/announcements/rules',
            builder: (context, state) => const VillageRulesScreen(),
          ),
          GoRoute(
            path: '/rule-detail/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return RuleDetailScreen(ruleId: id);
            },
          ),
          GoRoute(
            path: '/announcements/curfew',
            builder: (context, state) => const CurfewScreen(),
          ),

          // Fee payment route (with navigation bar)
          GoRoute(
            path: '/fees/payment/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return FeePaymentScreen(feeId: id);
            },
          ),
        ],
      ),
    ],
  );
});

/// Helper class to make GoRouter refresh when auth state changes
class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<AuthState> _subscription;

  GoRouterRefreshStream(Stream<AuthState> stream) {
    _subscription = stream.listen((_) {
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

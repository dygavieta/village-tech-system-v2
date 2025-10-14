/**
 * BLoC providers for Sentinel app
 * Centralized BLoC/Cubit provider configuration
 */

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:sentinel/features/auth/bloc/auth_bloc.dart';
import 'package:sentinel/features/gate_scanning/bloc/gate_scan_bloc.dart';
import 'package:sentinel/features/incidents/bloc/incident_bloc.dart';
import 'package:sentinel/features/announcements/bloc/announcement_bloc.dart';

/// Multi-BLoC provider wrapper for the entire app
class AppBlocProviders extends StatelessWidget {
  final Widget child;

  const AppBlocProviders({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        // Auth BLoC
        BlocProvider(
          create: (context) => AuthBloc()..add(const AuthCheckRequested()),
        ),

        // Gate Scanning BLoC
        BlocProvider(
          create: (context) => GateScanBloc(),
        ),

        // Incident Management BLoC
        BlocProvider(
          create: (context) => IncidentBloc(),
        ),

        // Announcements BLoC
        BlocProvider(
          create: (context) => AnnouncementBloc(),
        ),
      ],
      child: child,
    );
  }
}

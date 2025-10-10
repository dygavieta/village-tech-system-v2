/**
 * BLoC providers for Sentinel app
 * Centralized BLoC/Cubit provider configuration
 */

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:sentinel/features/auth/bloc/auth_bloc.dart';

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
        // Additional BLoCs will be added here as features are implemented
        // e.g., GateScanBloc, IncidentBloc, etc.
      ],
      child: child,
    );
  }
}

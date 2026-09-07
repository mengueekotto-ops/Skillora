import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'theme/app_theme.dart';
import 'services/auth_service.dart';
import 'services/offline_manager.dart';
import 'models/user_model.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Start connectivity tracking for offline mode
  await OfflineManager.instance.init();

  // Check if user has a saved session (token exists)
  final bool loggedIn = await AuthService.isLoggedIn();
  UserModel? storedUser;
  if (loggedIn) {
    storedUser = await AuthService.getStoredUser();
  }

  runApp(MyApp(initialUser: storedUser));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, this.initialUser});

  final UserModel? initialUser;

  @override
  Widget build(BuildContext context) {
    // If token exists, start dashboard; otherwise start at login
    final String startRoute = initialUser != null ? '/dashboard' : '/';

    return MaterialApp(
      title: 'AgriMed Link',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppTheme.primaryGreen,
          primary: AppTheme.primaryGreen,
          secondary: AppTheme.secondaryGreen,
          error: AppTheme.errorRed,
        ),
        scaffoldBackgroundColor: AppTheme.background,
      ),
      initialRoute: startRoute,
      routes: {
        '/': (context) => const LoginScreen(),
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignupScreen(),
        '/dashboard': (context) => const DashboardScreen(),
      },
      // Pass stored user as route argument when auto-navigating to dashboard
      onGenerateInitialRoutes: (route) {
        if (route == '/dashboard' && initialUser != null) {
          return [
            MaterialPageRoute(
              settings: RouteSettings(
                name: '/dashboard',
                arguments: {
                  'email': initialUser!.email,
                  'role': initialUser!.role,
                  'name': initialUser!.name ?? '',
                },
              ),
              builder: (context) => const DashboardScreen(),
            ),
          ];
        }
        return [
          MaterialPageRoute(
            settings: RouteSettings(name: route),
            builder: (context) => const LoginScreen(),
          ),
        ];
      },
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = await AuthService.login(
        _emailController.text,
        _passwordController.text,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Welcome back, ${user.displayName}!'),
          backgroundColor: AppTheme.secondaryGreen,
        ),
      );
      Navigator.pushReplacementNamed(
        context,
        '/dashboard',
        arguments: {'email': user.email, 'role': user.role, 'name': user.name},
      );
    } on SocketException {
      // No network — try to use cached session
      final cached = await AuthService.getStoredUser();
      if (!mounted) return;
      if (cached != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No internet connection — opening cached session'),
            backgroundColor: Colors.orange,
          ),
        );
        Navigator.pushReplacementNamed(
          context,
          '/dashboard',
          arguments: {
            'email': cached.email,
            'role': cached.role,
            'name': cached.name,
          },
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No internet connection. Please try again later.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppTheme.errorRed,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        child: Container(
          height: mediaQuery.size.height,
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: AssetImage('assets/images/login_bg.png'),
              fit: BoxFit.cover,
            ),
          ),
          child: Stack(
            children: [
              // Dark organic overlay to make inputs highly legible
              Container(color: AppTheme.primaryGreen.withOpacity(0.45)),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Spacer(flex: 3),

                      // Brand Header Container
                      Center(
                        child: Hero(
                          tag: 'logo',
                          child: Container(
                            padding: const EdgeInsets.all(20.0),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.9),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 20.0,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.agriculture_rounded,
                              size: 64.0,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20.0),
                      const Text(
                        'AgriMed Link',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 32.0,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 1.0,
                          shadows: [
                            Shadow(
                              color: Colors.black38,
                              offset: Offset(0, 3),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 6.0),
                      Text(
                        'Connect with Farmers, Advisors & Investors',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14.0,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withOpacity(0.9),
                          shadows: const [
                            Shadow(
                              color: Colors.black26,
                              offset: Offset(0, 2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),

                      const Spacer(flex: 2),

                      // Frosted glass card containing login fields
                      ClipRRect(
                        borderRadius: BorderRadius.circular(24.0),
                        child: java_script_backdrop_filter_wrapper_placeholder(
                          mediaQuery,
                        ),
                      ),

                      const Spacer(flex: 2),

                      // Forgot Password link (Stub)
                      TextButton(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Password recovery screen is coming soon!',
                              ),
                            ),
                          );
                        },
                        child: const Text(
                          'Forgot Password?',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14.0,
                            fontWeight: FontWeight.w700,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10.0),

                      // Sign Up Route trigger
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Don't have an account? ",
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.95),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Navigator.pushReplacementNamed(
                                context,
                                '/signup',
                              );
                            },
                            child: const Text(
                              'Sign Up',
                              style: TextStyle(
                                color: AppTheme.accentAmber,
                                fontWeight: FontWeight.bold,
                                decoration: TextDecoration.underline,
                                fontSize: 15.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Spacer(flex: 1),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget java_script_backdrop_filter_wrapper_placeholder(
    MediaQueryData mediaQuery,
  ) {
    // Helper to wrap the backdrop filter to avoid cluttering main build method
    return Container(
      decoration: AppTheme.glassCardDecoration,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Welcome Back',
                style: TextStyle(
                  fontSize: 22.0,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryGreen,
                ),
              ),
              const SizedBox(height: 18.0),

              // Email Input
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                style: const TextStyle(fontWeight: FontWeight.w500),
                decoration: AppTheme.inputDecoration(
                  labelText: 'Email Address',
                  hintText: 'Enter your email address',
                  prefixIcon: Icons.email_outlined,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your email';
                  }
                  final regex = RegExp(r'^[^@]+@[^@]+\.[^@]+$');
                  if (!regex.hasMatch(value.trim())) {
                    return 'Please enter a valid email address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16.0),

              // Password Input
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.done,
                style: const TextStyle(fontWeight: FontWeight.w500),
                decoration: AppTheme.inputDecoration(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                  prefixIcon: Icons.lock_outline_rounded,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AppTheme.secondaryGreen,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your password';
                  }
                  if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => _handleLogin(),
              ),

              const SizedBox(height: 24.0),

              // Submit Button
              Container(
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(16.0),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryGreen.withOpacity(0.3),
                      blurRadius: 12.0,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: AppTheme.primaryButtonStyle,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20.0,
                          width: 20.0,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Sign In',
                          style: TextStyle(
                            fontSize: 16.0,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

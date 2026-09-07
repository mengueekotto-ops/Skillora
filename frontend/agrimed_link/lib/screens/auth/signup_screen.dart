import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;

  // Available user roles for the platform
  final List<Map<String, dynamic>> _roles = [
    {
      'id': 'farmer',
      'label': 'Farmer',
      'icon': Icons.agriculture_rounded,
      'desc': 'Buy inputs, sell crops, manage your farms.',
    },
    {
      'id': 'buyer',
      'label': 'Buyer',
      'icon': Icons.shopping_bag_rounded,
      'desc': 'Browse and purchase organic crops & products.',
    },
    {
      'id': 'supplier',
      'label': 'Supplier',
      'icon': Icons.local_shipping_rounded,
      'desc': 'Sell seeds, agricultural tools, fertilizer.',
    },
    {
      'id': 'advisor',
      'label': 'Advisor',
      'icon': Icons.psychology_rounded,
      'desc': 'Offer professional consultations & tips.',
    },
    {
      'id': 'investor',
      'label': 'Investor',
      'icon': Icons.monetization_on_rounded,
      'desc': 'Fund farming activities & collect returns.',
    },
  ];

  // Default selection is 'farmer'
  String _selectedRoleId = 'farmer';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await AuthService.register(
        name: _nameController.text,
        email: _emailController.text,
        phone: _phoneController.text,
        password: _passwordController.text,
        role: _selectedRoleId,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Registration successful as ${_selectedRoleId[0].toUpperCase()}${_selectedRoleId.substring(1)}! Please sign in.',
          ),
          backgroundColor: AppTheme.secondaryGreen,
        ),
      );
      Navigator.pushReplacementNamed(context, '/login');
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
    final selectedRoleLabel = _roles.firstWhere(
      (r) => r['id'] == _selectedRoleId,
    )['label'];

    return Scaffold(
      backgroundColor: AppTheme.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
          ),
          onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
        ),
      ),
      body: Container(
        height: mediaQuery.size.height,
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/images/login_bg.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: Stack(
          children: [
            // Dark overlay
            Container(color: AppTheme.primaryGreen.withOpacity(0.5)),
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 12.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 10.0),
                    // Logo/Title branding
                    const Center(
                      child: Hero(
                        tag: 'logo',
                        child: Icon(
                          Icons.agriculture_rounded,
                          size: 56.0,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12.0),
                    const Text(
                      'Join AgriMed Link',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28.0,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4.0),
                    Text(
                      'Find your ecosystem role and start growing.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13.0,
                        color: Colors.white.withOpacity(0.85),
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    // Choice Card Widget
                    ClipRRect(
                      borderRadius: BorderRadius.circular(24.0),
                      child: Container(
                        decoration: AppTheme.glassCardDecoration,
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'Choose Your Role',
                              style: TextStyle(
                                fontSize: 18.0,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                            const SizedBox(height: 16.0),

                            // Role Grid
                            GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    crossAxisSpacing: 12.0,
                                    mainAxisSpacing: 12.0,
                                    childAspectRatio: 1.15,
                                  ),
                              itemCount: _roles.length,
                              itemBuilder: (context, index) {
                                final role = _roles[index];
                                final isSelected =
                                    _selectedRoleId == role['id'];
                                return GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _selectedRoleId = role['id'];
                                    });
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.all(12.0),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? AppTheme.primaryGreen.withOpacity(
                                              0.08,
                                            )
                                          : Colors.white,
                                      borderRadius: BorderRadius.circular(16.0),
                                      border: Border.all(
                                        color: isSelected
                                            ? AppTheme.primaryGreen
                                            : AppTheme.secondaryGreen
                                                  .withOpacity(0.15),
                                        width: isSelected ? 2.5 : 1.0,
                                      ),
                                      boxShadow: [
                                        if (isSelected)
                                          BoxShadow(
                                            color: AppTheme.primaryGreen
                                                .withOpacity(0.12),
                                            blurRadius: 10.0,
                                            offset: const Offset(0, 4),
                                          )
                                        else
                                          BoxShadow(
                                            color: Colors.black.withOpacity(
                                              0.02,
                                            ),
                                            blurRadius: 6.0,
                                            offset: const Offset(0, 2),
                                          ),
                                      ],
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            Icon(
                                              role['icon'],
                                              color: isSelected
                                                  ? AppTheme.primaryGreen
                                                  : AppTheme.lightText,
                                              size: 26.0,
                                            ),
                                            if (isSelected)
                                              const Icon(
                                                Icons.check_circle_rounded,
                                                color: AppTheme.primaryGreen,
                                                size: 20.0,
                                              ),
                                          ],
                                        ),
                                        const Spacer(),
                                        Text(
                                          role['label'],
                                          style: TextStyle(
                                            fontSize: 15.0,
                                            fontWeight: FontWeight.bold,
                                            color: isSelected
                                                ? AppTheme.primaryGreen
                                                : AppTheme.darkText,
                                          ),
                                        ),
                                        const SizedBox(height: 2.0),
                                        Text(
                                          role['desc'],
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 10.0,
                                            color: AppTheme.lightText,
                                            height: 1.2,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20.0),

                    // Inputs Card
                    ClipRRect(
                      borderRadius: BorderRadius.circular(24.0),
                      child: Container(
                        decoration: AppTheme.glassCardDecoration,
                        padding: const EdgeInsets.all(20.0),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Full Name
                              TextFormField(
                                controller: _nameController,
                                keyboardType: TextInputType.name,
                                textInputAction: TextInputAction.next,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                ),
                                decoration: AppTheme.inputDecoration(
                                  labelText: 'Full Name',
                                  hintText: 'Enter your full name',
                                  prefixIcon: Icons.person_outline_rounded,
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Please enter your name';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16.0),

                              // Email Input
                              TextFormField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                ),
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

                              // Phone Number Input
                              TextFormField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                textInputAction: TextInputAction.next,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                ),
                                decoration: AppTheme.inputDecoration(
                                  labelText: 'Phone Number',
                                  hintText: 'Enter your phone number',
                                  prefixIcon: Icons.phone_outlined,
                                ),
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Please enter your phone number';
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
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                ),
                                decoration: AppTheme.inputDecoration(
                                  labelText: 'Password',
                                  hintText: 'Create a password',
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
                                    return 'Please enter a password';
                                  }
                                  if (value.length < 6) {
                                    return 'Password must be at least 6 characters';
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    // Sign Up Submit button
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
                        onPressed: _isLoading ? null : _handleSignup,
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
                            : Text(
                                'Register as $selectedRoleLabel',
                                style: const TextStyle(
                                  fontSize: 16.0,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    // Link back to Login
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Already have an account? ",
                          style: TextStyle(
                            color: Colors.white70,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.pushReplacementNamed(context, '/login');
                          },
                          child: const Text(
                            'Sign In',
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
                    const SizedBox(height: 24.0),
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

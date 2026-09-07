import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';
import '../../widgets/offline_banner.dart';
import 'dart:async';
import 'dart:math';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  String _userEmail = 'user@example.com';
  String _userRole = 'buyer';
  String _userName = '';

  // Scanner Simulator States
  bool _isScanning = false;
  String? _scanResult;
  late AnimationController _scannerAnimationController;

  // Real-time market prices state
  Timer? _priceTimer;
  final Random _random = Random();

  late List<Map<String, dynamic>> _products;
  late List<Map<String, dynamic>> _crops;

  @override
  void initState() {
    super.initState();
    _scannerAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    // Initial supplies data
    _products = [
      {
        'title': 'Organic Bio-Fertilizer',
        'price': 24.99,
        'basePrice': 24.99,
        'change': 0.0,
        'rating': '★ 4.8',
        'desc': 'Slow-release natural fertilizer.',
        'image': 'assets/images/bio_fertilizer.png',
      },
      {
        'title': 'Premium Tomato Seeds',
        'price': 4.50,
        'basePrice': 4.50,
        'change': 0.0,
        'rating': '★ 4.9',
        'desc': 'High-yield disease resistant seeds.',
        'image': 'assets/images/tomato_seeds.png',
      },
      {
        'title': 'Irrigation Drip Kit',
        'price': 89.99,
        'basePrice': 89.99,
        'change': 0.0,
        'rating': '★ 4.7',
        'desc': 'Complete drip irrigation for 50 plants.',
        'image': 'assets/images/drip_irrigation.png',
      },
      {
        'title': 'Mini Greenhouse Tent',
        'price': 119.50,
        'basePrice': 119.50,
        'change': 0.0,
        'rating': '★ 4.6',
        'desc': 'Polyethylene frame protective cover.',
        'image': 'assets/images/aloe_vera.png', // Fallback mockup
      },
    ];

    // Initial medicinal/organic crops data
    _crops = [
      {
        'name': 'Aloe Vera Barbadensis',
        'price': 8.50,
        'basePrice': 8.50,
        'change': 0.0,
        'tag': 'Medicinal',
        'desc': 'Succulent species used in medicine.',
        'image': 'assets/images/aloe_vera.png',
      },
      {
        'name': 'Panax Ginseng Root',
        'price': 42.00,
        'basePrice': 42.00,
        'change': 0.0,
        'tag': 'Adaptogenic',
        'desc': 'Fleshy roots used as herbal remedy.',
        'image': 'assets/images/aloe_vera.png',
      },
      {
        'name': 'German Chamomile',
        'price': 15.00,
        'basePrice': 15.00,
        'change': 0.0,
        'tag': 'Sedative',
        'desc': 'Dried flower heads for relaxing teas.',
        'image': 'assets/images/aloe_vera.png',
      },
      {
        'name': 'Dwarf Cavendish Banana',
        'price': 12.50,
        'basePrice': 12.50,
        'change': 0.0,
        'tag': 'Commercial Crop',
        'desc': 'Sweet fruit variety, potassium rich.',
        'image': 'assets/images/aloe_vera.png',
      },
    ];

    // Set up price fluctuation scheduler (Real-time live prices)
    _priceTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (mounted) {
        setState(() {
          for (var item in _products) {
            double percent =
                (_random.nextDouble() * 3.5 - 1.6) / 100; // -1.6% to +1.9%
            item['price'] = double.parse(
              (item['price'] * (1 + percent)).toStringAsFixed(2),
            );
            item['change'] = double.parse(
              (((item['price'] - item['basePrice']) / item['basePrice']) * 100)
                  .toStringAsFixed(1),
            );
          }
          for (var item in _crops) {
            double percent = (_random.nextDouble() * 3.5 - 1.6) / 100;
            item['price'] = double.parse(
              (item['price'] * (1 + percent)).toStringAsFixed(2),
            );
            item['change'] = double.parse(
              (((item['price'] - item['basePrice']) / item['basePrice']) * 100)
                  .toStringAsFixed(1),
            );
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _scannerAnimationController.dispose();
    _priceTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic>) {
      setState(() {
        _userEmail = args['email'] ?? _userEmail;
        _userRole = args['role'] ?? _userRole;
        _userName = args['name'] ?? '';
      });
    }
  }

  void _triggerScan() {
    setState(() {
      _isScanning = true;
      _scanResult = null;
    });
    _scannerAnimationController.repeat(reverse: true);

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _scannerAnimationController.stop();
        setState(() {
          _isScanning = false;
          _scanResult =
              "Organic Aloe Vera (Purity: 96%)\nCategory: Medicinal Crop\nOrigin: local farm greenhouse\nUse: Skin soothing & anti-microbial";
        });
        _showScanResultDialog();
      }
    });
  }

  void _showScanResultDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24.0),
          ),
          title: Row(
            children: const [
              Icon(
                Icons.check_circle_outline_rounded,
                color: AppTheme.secondaryGreen,
                size: 28.0,
              ),
              SizedBox(width: 8.0),
              Text(
                'Scan Complete',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Item Identified:',
                style: TextStyle(color: AppTheme.lightText, fontSize: 13.0),
              ),
              const SizedBox(height: 8.0),
              Text(
                _scanResult ?? '',
                style: const TextStyle(
                  color: AppTheme.darkText,
                  fontSize: 15.0,
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16.0),
              Container(
                padding: const EdgeInsets.all(12.0),
                decoration: BoxDecoration(
                  color: AppTheme.lightGreen.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Row(
                  children: const [
                    Icon(
                      Icons.eco_rounded,
                      color: AppTheme.primaryGreen,
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Verified organic crop & safe for pharmaceutical use.',
                        style: TextStyle(
                          color: AppTheme.primaryGreen,
                          fontSize: 12.0,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text(
                'Close',
                style: TextStyle(
                  color: AppTheme.primaryGreen,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Added identified crop to watchlist!'),
                    backgroundColor: AppTheme.secondaryGreen,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0),
                ),
              ),
              child: const Text('Add to List'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          _currentIndex == 0
              ? 'Marketplace Products'
              : _currentIndex == 1
              ? 'Medicinal Crops'
              : 'Scan Crop/Product',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppTheme.primaryGradient),
        ),
        elevation: 0,
      ),
      drawer: _buildSidebar(),
      body: OfflineBanner(
        child: Column(
          children: [
            // Live scrolling ticker bar
            _buildLiveTickerRow(),
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: [
                  _buildProductsView(),
                  _buildCropsView(),
                  _buildScanView(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveTickerRow() {
    return Container(
      height: 48.0,
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 4.0,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _crops.length,
        itemBuilder: (context, index) {
          final crop = _crops[index];
          final price = crop['price'] as double;
          final change = crop['change'] as double;
          final isPositive = change >= 0;

          return Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            decoration: const BoxDecoration(
              border: Border(
                right: BorderSide(color: Colors.black12, width: 0.8),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.show_chart_rounded,
                  size: 16.0,
                  color: AppTheme.secondaryGreen,
                ),
                const SizedBox(width: 6.0),
                Text(
                  crop['name'].toString().split(' ')[0],
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13.0,
                    color: AppTheme.darkText,
                  ),
                ),
                const SizedBox(width: 8.0),
                Text(
                  '\$${price.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13.0,
                    color: AppTheme.primaryGreen,
                  ),
                ),
                const SizedBox(width: 4.0),
                Icon(
                  isPositive
                      ? Icons.arrow_drop_up_rounded
                      : Icons.arrow_drop_down_rounded,
                  color: isPositive ? Colors.green : Colors.red,
                  size: 20.0,
                ),
                Text(
                  '${isPositive ? "+" : ""}${change.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 11.0,
                    color: isPositive ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSidebar() {
    return Drawer(
      backgroundColor: AppTheme.background,
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: AssetImage('assets/images/login_bg.png'),
                fit: BoxFit.cover,
              ),
            ),
            currentAccountPicture: const CircleAvatar(
              backgroundColor: Colors.white,
              child: Icon(
                Icons.person_rounded,
                color: AppTheme.primaryGreen,
                size: 40.0,
              ),
            ),
            accountName: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8.0,
                vertical: 2.0,
              ),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withOpacity(0.8),
                borderRadius: BorderRadius.circular(4.0),
              ),
              child: Text(
                _userRole.toUpperCase(),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                  color: Colors.white,
                ),
              ),
            ),
            accountEmail: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8.0,
                vertical: 2.0,
              ),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(4.0),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_userName.isNotEmpty)
                    Text(
                      _userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  Text(
                    _userEmail,
                    style: const TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),
          ListTile(
            leading: Icon(
              Icons.shopping_basket_rounded,
              color: _currentIndex == 0
                  ? AppTheme.primaryGreen
                  : AppTheme.lightText,
            ),
            title: Text(
              'Products',
              style: TextStyle(
                fontWeight: _currentIndex == 0
                    ? FontWeight.bold
                    : FontWeight.normal,
                color: _currentIndex == 0
                    ? AppTheme.primaryGreen
                    : AppTheme.darkText,
              ),
            ),
            selected: _currentIndex == 0,
            onTap: () {
              setState(() => _currentIndex = 0);
              Navigator.pop(context); // Close Drawer
            },
          ),
          ListTile(
            leading: Icon(
              Icons.eco_rounded,
              color: _currentIndex == 1
                  ? AppTheme.primaryGreen
                  : AppTheme.lightText,
            ),
            title: Text(
              'Crops',
              style: TextStyle(
                fontWeight: _currentIndex == 1
                    ? FontWeight.bold
                    : FontWeight.normal,
                color: _currentIndex == 1
                    ? AppTheme.primaryGreen
                    : AppTheme.darkText,
              ),
            ),
            selected: _currentIndex == 1,
            onTap: () {
              setState(() => _currentIndex = 1);
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: Icon(
              Icons.qr_code_scanner_rounded,
              color: _currentIndex == 2
                  ? AppTheme.primaryGreen
                  : AppTheme.lightText,
            ),
            title: Text(
              'Scan',
              style: TextStyle(
                fontWeight: _currentIndex == 2
                    ? FontWeight.bold
                    : FontWeight.normal,
                color: _currentIndex == 2
                    ? AppTheme.primaryGreen
                    : AppTheme.darkText,
              ),
            ),
            selected: _currentIndex == 2,
            onTap: () {
              setState(() => _currentIndex = 2);
              Navigator.pop(context);
            },
          ),
          const Divider(),
          const Spacer(),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: AppTheme.errorRed),
            title: const Text(
              'Logout',
              style: TextStyle(
                color: AppTheme.errorRed,
                fontWeight: FontWeight.bold,
              ),
            ),
            onTap: () async {
              Navigator.pop(context);
              await AuthService.logout();
              if (mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
          ),
          const SizedBox(height: 20.0),
        ],
      ),
    );
  }

  Widget _buildProductsView() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchAndFilter(),
          const SizedBox(height: 20.0),
          const Text(
            'Featured Supplies',
            style: TextStyle(
              fontSize: 20.0,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryGreen,
            ),
          ),
          const SizedBox(height: 12.0),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16.0,
                mainAxisSpacing: 16.0,
                childAspectRatio: 0.72,
              ),
              itemCount: _products.length,
              itemBuilder: (context, index) {
                final product = _products[index];
                final price = product['price'] as double;
                final change = product['change'] as double;
                final isPositive = change >= 0;

                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20.0),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10.0,
                        offset: const Offset(0, 4),
                      ),
                    ],
                    border: Border.all(
                      color: AppTheme.secondaryGreen.withOpacity(0.08),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16.0),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Image.asset(
                                  product['image']!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      Container(
                                        color: AppTheme.lightGreen,
                                        child: const Icon(
                                          Icons.eco_rounded,
                                          size: 40.0,
                                          color: AppTheme.primaryGreen,
                                        ),
                                      ),
                                ),
                                Positioned(
                                  top: 8.0,
                                  right: 8.0,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6.0,
                                      vertical: 2.0,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(8.0),
                                    ),
                                    child: Text(
                                      product['rating']!,
                                      style: const TextStyle(
                                        fontSize: 10.0,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.accentAmber,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 10.0),
                        Text(
                          product['title']!,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14.0,
                            color: AppTheme.darkText,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2.0),
                        Text(
                          product['desc']!,
                          style: const TextStyle(
                            color: AppTheme.lightText,
                            fontSize: 11.0,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8.0),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '\$${price.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: AppTheme.primaryGreen,
                                fontWeight: FontWeight.bold,
                                fontSize: 15.0,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6.0,
                                vertical: 2.0,
                              ),
                              decoration: BoxDecoration(
                                color: (isPositive ? Colors.green : Colors.red)
                                    .withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6.0),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isPositive
                                        ? Icons.arrow_drop_up_rounded
                                        : Icons.arrow_drop_down_rounded,
                                    color: isPositive
                                        ? Colors.green
                                        : Colors.red,
                                    size: 14.0,
                                  ),
                                  Text(
                                    '${change >= 0 ? "+" : ""}${change.toStringAsFixed(1)}%',
                                    style: TextStyle(
                                      color: isPositive
                                          ? Colors.green
                                          : Colors.red,
                                      fontSize: 9.0,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10.0),
                        SizedBox(
                          width: double.infinity,
                          height: 32,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(10.0),
                            ),
                            child: ElevatedButton(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Added ${product['title']} to cart!',
                                    ),
                                    backgroundColor: AppTheme.secondaryGreen,
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                shadowColor: Colors.transparent,
                                padding: EdgeInsets.zero,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10.0),
                                ),
                              ),
                              child: const Text(
                                'Add to Cart',
                                style: TextStyle(
                                  fontSize: 11.0,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropsView() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchAndFilter(),
          const SizedBox(height: 20.0),
          const Text(
            'Available Organic Crops',
            style: TextStyle(
              fontSize: 20.0,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryGreen,
            ),
          ),
          const SizedBox(height: 12.0),
          Expanded(
            child: ListView.builder(
              itemCount: _crops.length,
              itemBuilder: (context, index) {
                final crop = _crops[index];
                final price = crop['price'] as double;
                final change = crop['change'] as double;
                final isPositive = change >= 0;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20.0),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 8.0,
                        offset: const Offset(0, 3),
                      ),
                    ],
                    border: Border.all(
                      color: AppTheme.secondaryGreen.withOpacity(0.08),
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 8.0,
                    ),
                    leading: Container(
                      width: 60.0,
                      height: 60.0,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12.0),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12.0),
                        child: Image.asset(
                          crop['image']!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              Container(
                                color: AppTheme.lightGreen,
                                child: const Icon(
                                  Icons.nature_rounded,
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                        ),
                      ),
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            crop['name']!,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16.0,
                              color: AppTheme.darkText,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8.0,
                            vertical: 3.0,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.accentAmber.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: Text(
                            crop['tag']!,
                            style: const TextStyle(
                              color: Color(0xFFC07000),
                              fontSize: 10.0,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4.0),
                        Text(
                          crop['desc']!,
                          style: const TextStyle(
                            color: AppTheme.lightText,
                            fontSize: 12.0,
                          ),
                        ),
                        const SizedBox(height: 8.0),
                        Row(
                          children: [
                            Text(
                              '\$${price.toStringAsFixed(2)} / unit',
                              style: const TextStyle(
                                color: AppTheme.primaryGreen,
                                fontWeight: FontWeight.bold,
                                fontSize: 14.0,
                              ),
                            ),
                            const SizedBox(width: 12.0),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6.0,
                                vertical: 2.0,
                              ),
                              decoration: BoxDecoration(
                                color: (isPositive ? Colors.green : Colors.red)
                                    .withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6.0),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isPositive
                                        ? Icons.arrow_drop_up_rounded
                                        : Icons.arrow_drop_down_rounded,
                                    color: isPositive
                                        ? Colors.green
                                        : Colors.red,
                                    size: 16.0,
                                  ),
                                  Text(
                                    '${isPositive ? "+" : ""}${change.toStringAsFixed(1)}%',
                                    style: TextStyle(
                                      color: isPositive
                                          ? Colors.green
                                          : Colors.red,
                                      fontSize: 10.0,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    trailing: Container(
                      decoration: const BoxDecoration(
                        color: AppTheme.lightGreen,
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.add_shopping_cart_rounded,
                          color: AppTheme.primaryGreen,
                          size: 22.0,
                        ),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Order request placed for ${crop['name']}!',
                              ),
                              backgroundColor: AppTheme.secondaryGreen,
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanView() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Smart Crop Scanner',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 24.0,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryGreen,
            ),
          ),
          const SizedBox(height: 8.0),
          const Text(
            'Align the crop/plant within the scanner viewfinder to identify and analyze its properties.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13.0, color: AppTheme.lightText),
          ),
          const Spacer(),

          // Camera viewfinder simulation with mock plant crop
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 240, maxHeight: 240),
              child: AspectRatio(
                aspectRatio: 1.0,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(32.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.08),
                      border: Border.all(
                        color: AppTheme.primaryGreen.withOpacity(0.6),
                        width: 3.5,
                      ),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Viewfinder backdrop: Crop target simulation
                        Positioned.fill(
                          child: Opacity(
                            opacity: 0.65,
                            child: Image.asset(
                              'assets/images/aloe_vera.png',
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),

                        // Dark dimming during active progress
                        if (_isScanning)
                          Container(color: Colors.black.withOpacity(0.35)),

                        const Icon(
                          Icons.camera_alt_rounded,
                          size: 72.0,
                          color: Colors.white60,
                        ),

                        // Finder corners simulation
                        Positioned(
                          top: 15,
                          left: 15,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              border: Border(
                                top: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                                left: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 15,
                          right: 15,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              border: Border(
                                top: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                                right: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 15,
                          left: 15,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                                left: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 15,
                          right: 15,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: const BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                                right: BorderSide(
                                  color: AppTheme.accentAmber,
                                  width: 4.5,
                                ),
                              ),
                            ),
                          ),
                        ),

                        // Scanning red line effect
                        if (_isScanning)
                          AnimatedBuilder(
                            animation: _scannerAnimationController,
                            builder: (context, child) {
                              return Positioned(
                                top:
                                    15 +
                                    (180 * _scannerAnimationController.value),
                                left: 15,
                                right: 15,
                                child: Container(
                                  height: 4.0,
                                  decoration: BoxDecoration(
                                    color: Colors.redAccent,
                                    borderRadius: BorderRadius.circular(2.0),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.redAccent.withOpacity(
                                          0.8,
                                        ),
                                        blurRadius: 10.0,
                                        spreadRadius: 2.0,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),

                        if (_isScanning)
                          Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                CircularProgressIndicator(color: Colors.white),
                                SizedBox(height: 12.0),
                                Text(
                                  'Analyzing Crop DNA...',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13.0,
                                    fontWeight: FontWeight.bold,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black54,
                                        blurRadius: 4.0,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          const Spacer(),

          // Trigger Scan Button
          Container(
            height: 52.0,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(16.0),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryGreen.withOpacity(0.3),
                  blurRadius: 12.0,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: _isScanning ? null : _triggerScan,
              style: AppTheme.primaryButtonStyle,
              child: const Text(
                'Start Scan',
                style: TextStyle(fontSize: 16.0, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 16.0),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Row(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16.0),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const TextField(
              decoration: InputDecoration(
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: AppTheme.secondaryGreen,
                ),
                hintText: 'Search seeds, fertilizers, medicinal plants...',
                hintStyle: TextStyle(color: AppTheme.lightText, fontSize: 13.0),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 14.0),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12.0),
        Container(
          padding: const EdgeInsets.all(12.0),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(
            Icons.filter_list_rounded,
            color: AppTheme.secondaryGreen,
          ),
        ),
      ],
    );
  }
}

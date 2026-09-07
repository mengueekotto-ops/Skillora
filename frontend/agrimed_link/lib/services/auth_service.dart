import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'api_service.dart';

/// High-level authentication service:
/// - Wraps ApiService calls for login / register / logout
/// - Persists the logged-in user to SharedPreferences for offline/startup use
class AuthService {
  static const String _keyUser = 'current_user';

  // ── Session helpers ──────────────────────────────────────────────────────

  static Future<bool> isLoggedIn() async {
    final token = await ApiService.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  static Future<UserModel?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyUser);
    if (raw == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> _persistUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(user.toJson()));
  }

  static Future<void> _clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyUser);
  }

  // ── Auth operations ──────────────────────────────────────────────────────

  /// Login with email + password.
  /// Returns [UserModel] on success.
  /// Throws a [String] error message on failure.
  static Future<UserModel> login(String email, String password) async {
    final responseBody = await ApiService.post('/auth/login', {
      'email': email.trim(),
      'password': password,
    });

    if (responseBody['status'] != 'success') {
      throw responseBody['message'] as String? ?? 'Login failed';
    }

    final data = responseBody['data'] as Map<String, dynamic>;
    await ApiService.saveTokens(
      accessToken: data['accessToken'] as String,
      refreshToken: data['refreshToken'] as String,
    );

    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
    await _persistUser(user);
    return user;
  }

  /// Register a new user.
  /// Returns [UserModel] on success.
  /// Throws a [String] error message on failure.
  static Future<UserModel> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String role,
  }) async {
    final responseBody = await ApiService.post('/auth/register', {
      'name': name.trim(),
      'email': email.trim(),
      'phone_number': phone.trim(),
      'password': password,
      'role': role,
    });

    if (responseBody['status'] != 'success') {
      throw responseBody['message'] as String? ?? 'Registration failed';
    }

    final data = responseBody['data'] as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  /// Logout — clears local session. Best-effort server-side call.
  static Future<void> logout() async {
    try {
      await ApiService.authPost('/auth/logout', {});
    } catch (_) {
      // Ignore network errors during logout; local cleanup is what matters.
    }
    await ApiService.clearTokens();
    await _clearUser();
  }
}

import 'package:shared_preferences/shared_preferences.dart';

/// Session activity tracking service
/// Web app'teki session-activity.ts'e benzer yapı
class SessionActivityService {
  static const String _lastActivityKey = 'last_activity_timestamp';
  static const Duration activityTimeout = Duration(hours: 8); // 8 saat

  /// Update the last activity timestamp
  static Future<void> updateActivity() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_lastActivityKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      print('Failed to update activity timestamp: $e');
    }
  }

  /// Get the last activity timestamp
  static Future<int?> getLastActivity() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getInt(_lastActivityKey);
    } catch (e) {
      print('Failed to get activity timestamp: $e');
      return null;
    }
  }

  /// Check if session has expired (8 hours of inactivity)
  static Future<bool> isSessionExpired() async {
    final lastActivity = await getLastActivity();
    // Treat missing activity as expired to enforce inactivity logout
    if (lastActivity == null) return true;
    
    final timeSinceLastActivity = DateTime.now().millisecondsSinceEpoch - lastActivity;
    return timeSinceLastActivity > activityTimeout.inMilliseconds;
  }

  /// Clear activity data on logout
  static Future<void> clearActivity() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_lastActivityKey);
    } catch (e) {
      print('Failed to clear activity timestamp: $e');
    }
  }
}


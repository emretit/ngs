class AppConstants {
  // Supabase Configuration
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
  
  // App Information
  static const String appName = 'Pafta Teknik Servis';
  static const String appVersion = '1.0.0';
  
  // API Endpoints
  static const String baseUrl = 'YOUR_API_BASE_URL';
  
  // Storage Keys
  static const String userTokenKey = 'user_token';
  static const String userDataKey = 'user_data';
  static const String isFirstLaunchKey = 'is_first_launch';
  static const String themeModeKey = 'theme_mode';
  
  // Database Tables
  static const String serviceRequestsTable = 'service_requests';
  static const String employeesTable = 'employees';
  static const String customersTable = 'customers';
  static const String companiesTable = 'companies';
  
  // Service Request Status
  static const String statusNew = 'new';
  static const String statusAssigned = 'assigned';
  static const String statusInProgress = 'in_progress';
  static const String statusCompleted = 'completed';
  static const String statusCancelled = 'cancelled';
  static const String statusOnHold = 'on_hold';
  
  // Service Request Priority
  static const String priorityLow = 'low';
  static const String priorityMedium = 'medium';
  static const String priorityHigh = 'high';
  static const String priorityUrgent = 'urgent';
  
  // Notification Types
  static const String notificationNewTask = 'new_task';
  static const String notificationTaskUpdate = 'task_update';
  static const String notificationTaskCompleted = 'task_completed';
  
  // Image Upload
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
}

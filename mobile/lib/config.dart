class AppConfig {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );
  static const String tenantId = String.fromEnvironment(
    'TENANT_ID',
    defaultValue: 'tenant-001',
  );
}

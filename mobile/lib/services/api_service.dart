import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class ApiService {
  static final _base = AppConfig.apiUrl;
  static final _headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': AppConfig.tenantId,
  };

  static Future<Map<String, dynamic>> _get(String path) async {
    final res = await http.get(Uri.parse('$_base$path'), headers: _headers);
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw ApiException(json['error'] ?? 'Request gagal');
    }
    return json;
  }

  static Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await http.post(
      Uri.parse('$_base$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw ApiException(json['error'] ?? 'Request gagal');
    }
    return json;
  }

  static Future<Map<String, dynamic>> getSummary() async {
    final r = await _get('/api/transactions/summary');
    return r['data'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getTransactions({
    int page = 1,
    int limit = 20,
  }) async {
    return _get('/api/transactions?page=$page&limit=$limit');
  }

  static Future<Map<String, dynamic>> createTransaction({
    required String type,
    required String category,
    required String description,
    required double amount,
  }) async {
    return _post('/api/transactions', {
      'type': type,
      'category': category,
      'description': description,
      'amount': amount,
    });
  }

  static Future<Map<String, dynamic>?> getReport(String period) async {
    final r = await _get('/api/reports?period=$period');
    return r['data'] as Map<String, dynamic>?;
  }

  static Future<List<dynamic>> getNotifications() async {
    final r = await _get('/api/notifications');
    return r['data'] as List<dynamic>;
  }
}

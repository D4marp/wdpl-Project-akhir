import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class FinanceProvider with ChangeNotifier {
  double income = 0;
  double expense = 0;
  double balance = 0;
  List<dynamic> transactions = [];
  int totalTransactions = 0;

  bool isLoadingSummary = false;
  bool isLoadingTransactions = false;
  String error = '';

  Future<void> loadSummary() async {
    isLoadingSummary = true;
    error = '';
    notifyListeners();
    try {
      final data = await ApiService.getSummary();
      income = (data['income'] ?? 0).toDouble();
      expense = (data['expense'] ?? 0).toDouble();
      balance = (data['balance'] ?? 0).toDouble();
    } catch (e) {
      error = e.toString();
    } finally {
      isLoadingSummary = false;
      notifyListeners();
    }
  }

  Future<void> loadTransactions({int page = 1}) async {
    isLoadingTransactions = true;
    notifyListeners();
    try {
      final data = await ApiService.getTransactions(page: page, limit: 10);
      transactions = data['data'] as List<dynamic>;
      totalTransactions = data['total'] as int? ?? 0;
    } catch (e) {
      error = e.toString();
    } finally {
      isLoadingTransactions = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    await Future.wait([loadSummary(), loadTransactions()]);
  }

  Future<String?> addTransaction({
    required String type,
    required String category,
    required String description,
    required double amount,
  }) async {
    try {
      await ApiService.createTransaction(
        type: type,
        category: category,
        description: description,
        amount: amount,
      );
      await refresh();
      return null;
    } catch (e) {
      return e.toString();
    }
  }
}

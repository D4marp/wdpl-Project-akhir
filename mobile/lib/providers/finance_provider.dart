import 'package:flutter/foundation.dart';
import '../patterns/transaction_factory.dart';
import '../patterns/transaction_observer.dart';
import '../services/api_service.dart';

class FinanceProvider with ChangeNotifier {
  final TransactionFactory _transactionFactory = TransactionFactory();
  late final TransactionSubject _transactionSubject;

  double income = 0;
  double expense = 0;
  double balance = 0;
  List<dynamic> transactions = [];
  int totalTransactions = 0;

  bool isLoadingSummary = false;
  bool isLoadingTransactions = false;
  String error = '';

  FinanceProvider() {
    _transactionSubject = TransactionSubject()
      ..subscribe(RefreshFinanceObserver(refresh));
  }

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
      final product = _transactionFactory.create(
        TransactionFormInput(
          type: type,
          category: category,
          description: description,
          amount: amount,
        ),
      );
      product.validate();

      final payload = product.getPayload();
      final response = await ApiService.createTransaction(payload);

      await _transactionSubject.notifyTransactionCreated(
        TransactionCreatedEvent(
          transaction: response['data'] as Map<String, dynamic>? ?? response,
          payload: payload,
          occurredAt: DateTime.now(),
        ),
      );

      return null;
    } catch (e) {
      return e.toString();
    }
  }
}

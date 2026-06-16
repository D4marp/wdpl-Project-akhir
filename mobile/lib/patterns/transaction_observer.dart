import 'transaction_factory.dart';

//Class ini adalah event : kabar atau informasi bahwa sesuatu baru saja terjadi
class TransactionCreatedEvent {
  final Map<String, dynamic> transaction;
  final CreateTransactionPayload payload;
  final DateTime occurredAt;

  const TransactionCreatedEvent({
    required this.transaction,
    required this.payload,
    required this.occurredAt,
  });
}

//aturan untuk semua observer (name)
abstract class TransactionObserver {
  String get name;
  Future<void> onTransactionCreated(TransactionCreatedEvent event);
}

//menyimpan hasil kerja observer
class ObserverResult {
  final String name;
  final bool ok;
  final Object? error;

  const ObserverResult({required this.name, required this.ok, this.error});
}

//ada transaksi baru, TransactionSubject akan memberi tahu semua observer yang terdaftar
class TransactionSubject {
  //pusat pengatur observer
  final List<TransactionObserver> _observers = [];

//menambahkan observer
  void subscribe(TransactionObserver observer) {
    _observers.add(observer);
  }

//menghapus observer dari daftar.
  void unsubscribe(TransactionObserver observer) {
    _observers.remove(observer);
  }

//memberi tahu semua observer bahwa transaksi baru sudah dibuat.
  Future<List<ObserverResult>> notifyTransactionCreated(
    TransactionCreatedEvent event,
  ) async {
    final results = <ObserverResult>[];

    for (final observer in List<TransactionObserver>.from(_observers)) {
      try {
        await observer.onTransactionCreated(event);
        results.add(ObserverResult(name: observer.name, ok: true));
      } catch (error) {
        results.add(
          ObserverResult(name: observer.name, ok: false, error: error),
        );
      }
    }

    return results;
  }
}

//melakukan refresh data keuangan
class RefreshFinanceObserver implements TransactionObserver {
  final Future<void> Function() refresh;

  const RefreshFinanceObserver(this.refresh);

  @override
  String get name => 'refresh-finance-observer';

  @override
  Future<void> onTransactionCreated(TransactionCreatedEvent event) async {
    await refresh();
  }
}

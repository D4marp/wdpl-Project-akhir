enum TransactionType { income, expense }

extension TransactionTypeValue on TransactionType {
  //mengambil nilai transaksi yang dikirim ke backend
  String get value {
    switch (this) {
      case TransactionType.income:
        return 'income';
      case TransactionType.expense:
        return 'expense';
    }
  }

//mengambil teks yang mudah dibaca user
  String get label {
    switch (this) {
      case TransactionType.income:
        return 'Pemasukan';
      case TransactionType.expense:
        return 'Pengeluaran';
    }
  }
}

//menampung input dari form transaksi
class TransactionFormInput {
  final String type;
  final String category;
  final String description;
  final double amount;

//membuat object input transaksi
  const TransactionFormInput({
    required this.type,
    required this.category,
    required this.description,
    required this.amount,
  });
}

//membuat data yang siap dikirim ke backend
class CreateTransactionPayload {
  final String type;
  final String category;
  final String description;
  final double amount;

  const CreateTransactionPayload({
    required this.type,
    required this.category,
    required this.description,
    required this.amount,
  });

 //mengubah object Dart menjadi JSON
  Map<String, dynamic> toJson() => {
    'type': type,
    'category': category,
    'description': description,
    'amount': amount,
  };
}

//aturan wajib untuk semua jenis transaksi
abstract class TransactionProduct {
  void validate();
  CreateTransactionPayload getPayload();
  String getLabel();
}

//class dasar untuk transaksi
abstract class BaseTransactionProduct implements TransactionProduct {
  //menyimpan data input transaksi dan jenis transaksinya
  final TransactionFormInput input;
  final TransactionType transactionType;

//constructor untuk mengisi input dan transactionType
  const BaseTransactionProduct(this.input, this.transactionType);

//validasi data transaksi
  @override
  void validate() {
    if (input.category.trim().isEmpty) {
      throw ArgumentError('kategori tidak boleh kosong');
    }

    if (input.amount <= 0) {
      throw ArgumentError('amount harus lebih dari 0');
    }
  }

 //membuat payload untuk API
  @override
  CreateTransactionPayload getPayload() {
    return CreateTransactionPayload(
      type: transactionType.value,
      category: input.category.trim(),
      description: input.description.trim(),
      amount: input.amount,
    );
  }

 //mengambil label transaksi
  @override
  String getLabel() => transactionType.label;
}

//membuat class khusus transaksi pemasukan
class IncomeTransactionProduct extends BaseTransactionProduct {
  const IncomeTransactionProduct(TransactionFormInput input)
    : super(input, TransactionType.income);
}

//membuat class khusus transaksi pengeluaran
class ExpenseTransactionProduct extends BaseTransactionProduct {
  const ExpenseTransactionProduct(TransactionFormInput input)
    : super(input, TransactionType.expense);
}

//membuat object transaksi sesuai type
class TransactionFactory {
  TransactionProduct create(TransactionFormInput input) {
    switch (input.type) {
      case 'income':
        return IncomeTransactionProduct(input);
      case 'expense':
        return ExpenseTransactionProduct(input);
      default:
        throw ArgumentError("tipe transaksi '${input.type}' tidak dikenal");
    }
  }
}

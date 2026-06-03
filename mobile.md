# Mobile Reference: Flutter 3
# Kode lengkap — Provider global state, 4 screen, error handling

---

## Struktur Folder

```
mobile/
├── lib/
│   ├── main.dart
│   ├── config.dart
│   ├── services/
│   │   └── api_service.dart
│   ├── providers/
│   │   └── finance_provider.dart    ← ★ NEW: global state dengan Provider
│   └── screens/
│       ├── home_screen.dart
│       ├── add_transaction_screen.dart
│       ├── report_screen.dart
│       └── notification_screen.dart
├── pubspec.yaml
├── Dockerfile
└── README.md
```

---

## `pubspec.yaml`

```yaml
name: umkm_finance_mobile
description: Aplikasi Pencatatan Keuangan UMKM
version: 1.0.0+1

environment:
  sdk: ">=3.3.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.1
  intl: ^0.19.0
  provider: ^6.1.2

flutter:
  uses-material-design: true
```

---

## `lib/config.dart`

```dart
class AppConfig {
  static const String apiUrl =
      String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8080');
  static const String tenantId =
      String.fromEnvironment('TENANT_ID', defaultValue: 'tenant-001');
}
```

---

## `lib/services/api_service.dart`

```dart
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
    if (res.statusCode >= 400) throw ApiException(json['error'] ?? 'Request gagal');
    return json;
  }

  static Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$_base$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) throw ApiException(json['error'] ?? 'Request gagal');
    return json;
  }

  static Future<Map<String, dynamic>> getSummary() async {
    final r = await _get('/api/transactions/summary');
    return r['data'] as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getTransactions({int page = 1, int limit = 20}) async {
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
```

---

## `lib/providers/finance_provider.dart`  ★ NEW

```dart
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

// FinanceProvider adalah global state yang di-share ke semua screen.
// Menggunakan Provider package — ChangeNotifier pattern.
// Ini adalah Observer Pattern di Flutter: widget "mendengarkan"
// perubahan state dari FinanceProvider.
class FinanceProvider with ChangeNotifier {
  double income  = 0;
  double expense = 0;
  double balance = 0;
  List<dynamic> transactions = [];
  int totalTransactions      = 0;
  int unreadNotifications    = 0;

  bool  isLoadingSummary      = false;
  bool  isLoadingTransactions = false;
  String error                = '';

  // Muat ringkasan saldo (dipanggil saat HomeScreen init)
  Future<void> loadSummary() async {
    isLoadingSummary = true;
    error = '';
    notifyListeners();
    try {
      final data = await ApiService.getSummary();
      income  = (data['income']  ?? 0).toDouble();
      expense = (data['expense'] ?? 0).toDouble();
      balance = (data['balance'] ?? 0).toDouble();
    } catch (e) {
      error = e.toString();
    } finally {
      isLoadingSummary = false;
      notifyListeners();
    }
  }

  // Muat transaksi terbaru
  Future<void> loadTransactions({int page = 1}) async {
    isLoadingTransactions = true;
    notifyListeners();
    try {
      final data = await ApiService.getTransactions(page: page, limit: 10);
      transactions      = data['data'] as List<dynamic>;
      totalTransactions = data['total'] as int? ?? 0;
    } catch (e) {
      error = e.toString();
    } finally {
      isLoadingTransactions = false;
      notifyListeners();
    }
  }

  // Muat ulang semua data (pull-to-refresh)
  Future<void> refresh() async {
    await Future.wait([loadSummary(), loadTransactions()]);
  }

  // Tambah transaksi baru
  Future<String?> addTransaction({
    required String type,
    required String category,
    required String description,
    required double amount,
  }) async {
    try {
      await ApiService.createTransaction(
        type: type, category: category,
        description: description, amount: amount,
      );
      await refresh(); // perbarui saldo + list setelah berhasil
      return null;     // null = sukses
    } catch (e) {
      return e.toString(); // string error = gagal
    }
  }
}
```

---

## `lib/main.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/finance_provider.dart';
import 'screens/home_screen.dart';

void main() => runApp(
  // Provider di root agar semua screen bisa akses FinanceProvider
  ChangeNotifierProvider(
    create: (_) => FinanceProvider(),
    child: const UmkmFinanceApp(),
  ),
);

class UmkmFinanceApp extends StatelessWidget {
  const UmkmFinanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Keuangan UMKM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        fontFamily: 'sans-serif',
      ),
      home: const HomeScreen(),
    );
  }
}
```

---

## `lib/screens/home_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/finance_provider.dart';
import 'add_transaction_screen.dart';
import 'report_screen.dart';
import 'notification_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _fmt = NumberFormat.currency(locale:'id_ID', symbol:'Rp ', decimalDigits:0);

  @override
  void initState() {
    super.initState();
    // Muat data saat screen pertama kali dibuka
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final fp = context.watch<FinanceProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Keuangan UMKM', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => const NotificationScreen())),
          ),
        ],
      ),
      body: fp.error.isNotEmpty
          ? _errorView(fp.error, fp.refresh)
          : RefreshIndicator(
              onRefresh: fp.refresh,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Kartu saldo utama
                  _buildBalanceCard(fp),
                  const SizedBox(height: 16),

                  // Quick actions
                  Row(children: [
                    _actionBtn(Icons.add_circle_outline, 'Catat', const Color(0xFF2563EB), () async {
                      await Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const AddTransactionScreen()));
                      // Provider sudah di-refresh di AddTransactionScreen
                    }),
                    const SizedBox(width: 10),
                    _actionBtn(Icons.bar_chart_rounded, 'Laporan', const Color(0xFF7C3AED), () =>
                      Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const ReportScreen()))),
                  ]),
                  const SizedBox(height: 20),

                  // Transaksi terbaru
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    const Text('Terbaru', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    Text('${fp.totalTransactions} transaksi',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                  ]),
                  const SizedBox(height: 10),

                  if (fp.isLoadingTransactions)
                    ..._skeletonRows(5)
                  else if (fp.transactions.isEmpty)
                    _emptyState()
                  else
                    ...fp.transactions.map(_txTile),
                ],
              ),
            ),
    );
  }

  Widget _buildBalanceCard(FinanceProvider fp) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
        begin: Alignment.topLeft, end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(18),
      boxShadow: [BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.3), blurRadius: 16, offset: const Offset(0,6))],
    ),
    child: fp.isLoadingSummary
        ? _cardSkeleton()
        : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Saldo Usaha', style: TextStyle(color: Colors.white60, fontSize: 13)),
            const SizedBox(height: 4),
            Text(_fmt.format(fp.balance),
              style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            Row(children: [
              _miniChip('↓ Masuk', fp.income, const Color(0xFF4ADE80)),
              const SizedBox(width: 10),
              _miniChip('↑ Keluar', fp.expense, const Color(0xFFF87171)),
            ]),
          ]),
  );

  Widget _miniChip(String label, double amount, Color c) => Expanded(child: Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.15),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w500)),
      const SizedBox(height: 2),
      Text(_fmt.format(amount),
        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
    ]),
  ));

  Widget _actionBtn(IconData icon, String label, Color color, VoidCallback onTap) =>
    Expanded(child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0,2))],
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      ),
    ));

  Widget _txTile(dynamic tx) {
    final isIncome = tx['type'] == 'income';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(children: [
        Container(width:36, height:36,
          decoration: BoxDecoration(
            color: (isIncome ? Colors.green : Colors.red).withOpacity(0.08),
            borderRadius: BorderRadius.circular(9),
          ),
          child: Icon(
            isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
            color: isIncome ? Colors.green.shade600 : Colors.red.shade600,
            size: 17,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tx['category'] ?? '-',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          Text(tx['description'] ?? '-',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
            maxLines: 1, overflow: TextOverflow.ellipsis),
        ])),
        Text(
          '${isIncome ? "+" : "-"}${_fmt.format(tx['amount'])}',
          style: TextStyle(
            color: isIncome ? Colors.green.shade700 : Colors.red.shade700,
            fontWeight: FontWeight.w700, fontSize: 13),
        ),
      ]),
    );
  }

  List<Widget> _skeletonRows(int count) => List.generate(count, (_) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    height: 60,
    decoration: BoxDecoration(
      color: Colors.grey.shade100,
      borderRadius: BorderRadius.circular(12),
    ),
  ));

  Widget _cardSkeleton() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Container(height: 13, width: 80, color: Colors.white24),
    const SizedBox(height: 8),
    Container(height: 28, width: 180, color: Colors.white24),
  ]);

  Widget _emptyState() => Center(child: Padding(
    padding: const EdgeInsets.symmetric(vertical: 32),
    child: Column(children: [
      Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade300),
      const SizedBox(height: 8),
      Text('Belum ada transaksi', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
    ]),
  ));

  Widget _errorView(String msg, VoidCallback retry) => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.wifi_off_rounded, size: 48, color: Colors.grey.shade300),
      const SizedBox(height: 12),
      Text('Gagal memuat data', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
      const SizedBox(height: 4),
      Text(msg, style: TextStyle(color: Colors.grey.shade500, fontSize: 12), textAlign: TextAlign.center),
      const SizedBox(height: 16),
      ElevatedButton(onPressed: retry, child: const Text('Coba Lagi')),
    ]),
  ));
}
```

---

## `lib/screens/add_transaction_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/finance_provider.dart';

class AddTransactionScreen extends StatefulWidget {
  const AddTransactionScreen({super.key});
  @override
  State<AddTransactionScreen> createState() => _AddState();
}

class _AddState extends State<AddTransactionScreen> {
  String _type = 'income';
  final _catCtrl  = TextEditingController();
  final _descCtrl = TextEditingController();
  final _amtCtrl  = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _catCtrl.dispose(); _descCtrl.dispose(); _amtCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_catCtrl.text.trim().isEmpty || _amtCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kategori dan nominal wajib diisi')));
      return;
    }
    final amount = double.tryParse(_amtCtrl.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nominal harus angka positif')));
      return;
    }

    setState(() => _loading = true);
    final error = await context.read<FinanceProvider>().addTransaction(
      type: _type, category: _catCtrl.text.trim(),
      description: _descCtrl.text.trim(), amount: amount,
    );
    setState(() => _loading = false);

    if (!mounted) return;
    if (error == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Transaksi berhasil disimpan'),
          backgroundColor: Color(0xFF22C55E),
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red.shade600));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Catat Transaksi'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          // Toggle jenis transaksi
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade100),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Jenis', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              Row(children: [
                _typeBtn('income',  'Pemasukan',   Colors.green.shade500),
                const SizedBox(width: 10),
                _typeBtn('expense', 'Pengeluaran', Colors.red.shade500),
              ]),
            ]),
          ),
          const SizedBox(height: 12),

          // Input fields
          _fieldCard([
            _input(_catCtrl,  'Kategori',     'misal: Penjualan, Bahan Baku', required: true),
            const Divider(height: 1),
            _input(_descCtrl, 'Keterangan',   'Opsional'),
            const Divider(height: 1),
            _input(_amtCtrl,  'Nominal (Rp)', '0', type: TextInputType.number, required: true),
          ]),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _loading
                ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                : const Text('Simpan Transaksi',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _typeBtn(String val, String label, Color c) => Expanded(
    child: GestureDetector(
      onTap: () => setState(() => _type = val),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: _type == val ? c : Colors.transparent,
          border: Border.all(color: _type == val ? c : Colors.grey.shade300),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: _type == val ? Colors.white : Colors.grey.shade600,
            fontWeight: FontWeight.w600, fontSize: 13)),
      ),
    ),
  );

  Widget _fieldCard(List<Widget> children) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.grey.shade100),
    ),
    child: Column(children: children),
  );

  Widget _input(
    TextEditingController ctrl, String label, String hint, {
    TextInputType type = TextInputType.text, bool required = false,
  }) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    child: Row(children: [
      SizedBox(width: 100,
        child: Text(label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF475569)))),
      Expanded(
        child: TextField(
          controller: ctrl, keyboardType: type,
          style: const TextStyle(fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            border: InputBorder.none,
            isDense: true, contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    ]),
  );
}
```

---

## `lib/screens/report_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});
  @override
  State<ReportScreen> createState() => _ReportState();
}

class _ReportState extends State<ReportScreen> {
  final _fmt = NumberFormat.currency(locale:'id_ID', symbol:'Rp ', decimalDigits:0);
  String _period = 'monthly';
  Map<String, dynamic>? _report;
  bool _loading = false;
  String _error = '';

  final _periods = {'daily':'Harian', 'weekly':'Mingguan', 'monthly':'Bulanan'};

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final data = await ApiService.getReport(_period);
      setState(() => _report = data);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Laporan Keuangan'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          // Pilih periode
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _period,
                isExpanded: true,
                items: _periods.entries.map((e) =>
                  DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                onChanged: (v) { setState(() => _period = v!); _load(); },
              ),
            ),
          ),
          const SizedBox(height: 14),

          if (_error.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(10)),
              child: Text(_error, style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
            ),

          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_report != null)
            Expanded(child: ListView(children: [
              // Kartu summary
              Row(children: [
                _summaryCard('Pemasukan',   _report!['total_income'],  Colors.green.shade500),
                const SizedBox(width: 10),
                _summaryCard('Pengeluaran', _report!['total_expense'], Colors.red.shade500),
              ]),
              const SizedBox(height: 10),
              _summaryCard('Saldo', _report!['balance'], const Color(0xFF2563EB), full: true),
              const SizedBox(height: 16),

              // List transaksi dalam laporan
              const Text('Detail Transaksi',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 8),
              ...(_report!['transactions'] as List? ?? []).map(_txTile),
            ])),
        ]),
      ),
    );
  }

  Widget _summaryCard(String label, dynamic value, Color c, {bool full = false}) {
    Widget card = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.withOpacity(0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(_fmt.format((value ?? 0).toDouble()),
          style: TextStyle(color: c, fontSize: 15, fontWeight: FontWeight.w800)),
      ]),
    );
    return full ? SizedBox(width: double.infinity, child: card) : Expanded(child: card);
  }

  Widget _txTile(dynamic tx) {
    final isIncome = tx['type'] == 'income';
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(children: [
        Icon(
          isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
          size: 15,
          color: isIncome ? Colors.green.shade600 : Colors.red.shade600,
        ),
        const SizedBox(width: 8),
        Expanded(child: Text(tx['category'] ?? '',
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
        Text(
          _fmt.format(tx['amount']),
          style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: isIncome ? Colors.green.shade700 : Colors.red.shade700),
        ),
      ]),
    );
  }
}
```

---

## `lib/screens/notification_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});
  @override
  State<NotificationScreen> createState() => _NotifState();
}

class _NotifState extends State<NotificationScreen> {
  List<dynamic> _notifs = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    ApiService.getNotifications().then((data) {
      setState(() { _notifs = data; _loading = false; });
    }).catchError((e) {
      setState(() { _error = e.toString(); _loading = false; });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Notifikasi'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error, style: const TextStyle(color: Colors.red)))
              : _notifs.isEmpty
                  ? _emptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _notifs.length,
                      itemBuilder: (_, i) => _notifCard(_notifs[i]),
                    ),
    );
  }

  Widget _notifCard(dynamic n) {
    final isWarning = n['type'] == 'warning';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border(left: BorderSide(
          color: isWarning ? Colors.orange.shade400 : Colors.blue.shade400,
          width: 4,
        )),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0,2))],
      ),
      padding: const EdgeInsets.all(14),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(isWarning ? '⚠️' : 'ℹ️', style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(n['title'] ?? '',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF1E293B))),
          const SizedBox(height: 3),
          Text(n['message'] ?? '',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 12, height: 1.4)),
        ])),
      ]),
    );
  }

  Widget _emptyState() => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    Icon(Icons.notifications_none_rounded, size: 52, color: Colors.grey.shade300),
    const SizedBox(height: 10),
    Text('Tidak ada notifikasi', style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
    const SizedBox(height: 4),
    Text('Notifikasi muncul otomatis\nsaat ada transaksi baru',
      textAlign: TextAlign.center,
      style: TextStyle(color: Colors.grey.shade300, fontSize: 12)),
  ]));
}
```

---

## `Dockerfile` (build APK via CI)

```dockerfile
FROM ghcr.io/cirruslabs/flutter:stable AS builder
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get
COPY . .
RUN flutter build apk --release \
    --dart-define=API_URL=${API_URL:-http://10.0.2.2:8080} \
    --dart-define=TENANT_ID=${TENANT_ID:-tenant-001}

FROM scratch AS export
COPY --from=builder /app/build/app/outputs/flutter-apk/app-release.apk \
     /output/umkm-finance.apk
```

---

## `README.md`

```markdown
# UMKM Finance — Mobile (Flutter)

Flutter 3 mobile app dengan Provider state management.

## Prasyarat
- Flutter 3.x (`flutter --version`)
- Android emulator atau device fisik
- Backend berjalan

## Jalankan di Emulator Android
```bash
flutter pub get
flutter run \
  --dart-define=API_URL=http://10.0.2.2:8080 \
  --dart-define=TENANT_ID=tenant-001
```

## Jalankan di Device Fisik
```bash
# Ganti 192.168.x.x dengan IP lokal mesin yang menjalankan backend
flutter run \
  --dart-define=API_URL=http://192.168.x.x:8080 \
  --dart-define=TENANT_ID=tenant-001
```

## Build APK Release
```bash
flutter build apk --release \
  --dart-define=API_URL=http://your-server:8080 \
  --dart-define=TENANT_ID=tenant-001
# APK: build/app/outputs/flutter-apk/app-release.apk
```

## Arsitektur
- **Provider**: global state di `providers/finance_provider.dart`
- **ApiService**: semua HTTP call terpusat di `services/api_service.dart`
- **Screen** berkomunikasi via Provider, bukan langsung ke ApiService
```

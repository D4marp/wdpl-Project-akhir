import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});
  @override
  State<ReportScreen> createState() => _ReportState();
}

class _ReportState extends State<ReportScreen> {
  final _fmt = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );
  String _period = 'monthly';
  Map<String, dynamic>? _report;
  bool _loading = false;
  String _error = '';

  final _periods = {
    'daily': 'Harian',
    'weekly': 'Mingguan',
    'monthly': 'Bulanan',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = '';
    });
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
        child: Column(
          children: [
            Row(
              children: _periods.entries.map((e) {
                final selected = _period == e.key;
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _period = e.key);
                      _load();
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color:
                            selected ? const Color(0xFF2563EB) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: selected
                              ? const Color(0xFF2563EB)
                              : Colors.grey.shade200,
                        ),
                      ),
                      child: Text(
                        e.value,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: selected
                              ? Colors.white
                              : Colors.grey.shade600,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            if (_error.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  _error,
                  style: TextStyle(color: Colors.red.shade700, fontSize: 12),
                ),
              ),
            if (_loading)
              const Expanded(
                  child: Center(child: CircularProgressIndicator()))
            else if (_report != null)
              Expanded(
                child: ListView(
                  children: [
                    Row(
                      children: [
                        _summaryCard(
                          'Pemasukan',
                          _report!['total_income'],
                          Colors.green,
                        ),
                        const SizedBox(width: 8),
                        _summaryCard(
                          'Pengeluaran',
                          _report!['total_expense'],
                          Colors.red,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _summaryCard(
                      'Saldo',
                      _report!['balance'],
                      Colors.blue,
                      full: true,
                    ),
                    const SizedBox(height: 16),
                    if ((_report!['transactions'] as List?)?.isNotEmpty ==
                        true) ...[
                      const Text(
                        'Detail Transaksi',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...(_report!['transactions'] as List)
                          .map((tx) => _txTile(tx)),
                    ],
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _summaryCard(String label, dynamic value, Color c,
      {bool full = false}) {
    Widget card = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: c,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _fmt.format((value ?? 0).toDouble()),
            style: TextStyle(
              color: c,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
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
      child: Row(
        children: [
          Icon(
            isIncome
                ? Icons.arrow_downward_rounded
                : Icons.arrow_upward_rounded,
            color:
                isIncome ? Colors.green.shade600 : Colors.red.shade600,
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              tx['category'] ?? '',
              style: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
          Text(
            _fmt.format(tx['amount']),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isIncome
                  ? Colors.green.shade600
                  : Colors.red.shade600,
            ),
          ),
        ],
      ),
    );
  }
}

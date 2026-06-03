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
  final _catCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _amtCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _catCtrl.dispose();
    _descCtrl.dispose();
    _amtCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_catCtrl.text.trim().isEmpty || _amtCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kategori dan nominal wajib diisi')),
      );
      return;
    }
    final amount = double.tryParse(_amtCtrl.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nominal harus angka positif')),
      );
      return;
    }

    setState(() => _loading = true);
    final error = await context.read<FinanceProvider>().addTransaction(
          type: _type,
          category: _catCtrl.text.trim(),
          description: _descCtrl.text.trim(),
          amount: amount,
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
        SnackBar(
          content: Text(error),
          backgroundColor: Colors.red.shade600,
        ),
      );
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
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  _typeBtn('income', 'Pemasukan', Colors.green.shade500),
                  const SizedBox(width: 4),
                  _typeBtn('expense', 'Pengeluaran', Colors.red.shade500),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _fieldCard([
              _input(_catCtrl, 'Kategori', 'misal: Penjualan', required: true),
              const Divider(height: 1, indent: 16),
              _input(_descCtrl, 'Keterangan', 'Opsional'),
              const Divider(height: 1, indent: 16),
              _input(
                _amtCtrl,
                'Nominal',
                '0',
                type: TextInputType.number,
                required: true,
              ),
            ]),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Simpan Transaksi',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
              ),
            ),
          ],
        ),
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
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: _type == val ? Colors.white : Colors.grey.shade600,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
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
    TextEditingController ctrl,
    String label,
    String hint, {
    TextInputType type = TextInputType.text,
    bool required = false,
  }) =>
      Padding(
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            SizedBox(
              width: 100,
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF475569),
                ),
              ),
            ),
            Expanded(
              child: TextField(
                controller: ctrl,
                keyboardType: type,
                decoration: InputDecoration(
                  hintText: hint,
                  hintStyle: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 13,
                  ),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                ),
                style: const TextStyle(fontSize: 13),
              ),
            ),
          ],
        ),
      );
}

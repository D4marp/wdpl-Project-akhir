import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/finance_provider.dart';
import 'screens/home_screen.dart';

void main() => runApp(
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
        colorScheme:
            ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

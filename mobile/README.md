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
- **Factory Pattern**: `patterns/transaction_factory.dart` membuat product transaksi income/expense, memvalidasi input, dan menghasilkan payload API.
- **Observer Pattern**: `patterns/transaction_observer.dart` mempublish event setelah transaksi berhasil dibuat, lalu observer menjalankan efek lanjutan seperti refresh summary dan riwayat transaksi.

## Alur Tambah Transaksi
1. Screen mengirim input transaksi ke `FinanceProvider.addTransaction`.
2. `TransactionFactory` membuat `IncomeTransactionProduct` atau `ExpenseTransactionProduct`.
3. Product menjalankan validasi dan menghasilkan `CreateTransactionPayload`.
4. `ApiService` mengirim payload ke backend.
5. Jika backend berhasil membuat transaksi, `TransactionSubject` mempublish `TransactionCreatedEvent`.
6. `RefreshFinanceObserver` menerima event dan menjalankan refresh data mobile.

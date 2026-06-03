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

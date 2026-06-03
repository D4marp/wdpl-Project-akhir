# UMKM Finance — Web

Next.js 14 App Router dashboard untuk pencatatan keuangan UMKM.

## Prasyarat
- Node.js 20+ dan npm
- Backend berjalan di port 8080

## Jalankan Lokal
```bash
cp .env.example .env.local   # edit API URL jika perlu
npm install
npm run dev
# Buka: http://localhost:3000
```

## Jalankan dengan Docker
```bash
docker build -t umkm-finance-web .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8080 \
  -e NEXT_PUBLIC_TENANT_ID=tenant-001 \
  umkm-finance-web
```

## Fitur
- Dashboard: ringkasan saldo + transaksi terbaru
- Transaksi: form catat + riwayat dengan pagination
- Laporan: BarChart per kategori + LineChart trend waktu
- Notifikasi: list notifikasi dari Observer Pattern
- Skeleton loading di semua halaman

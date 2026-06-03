# UMKM Finance — Backend

Go + Gin REST API dengan Factory Pattern dan Observer Pattern.

## Prasyarat
- Docker & Docker Compose, ATAU Go 1.22 + MySQL 8

## Jalankan dengan Docker (Recommended)
```bash
cp .env.example .env
docker-compose up -d
# Cek: curl -H "X-Tenant-ID: tenant-001" http://localhost:8080/health
```

## Jalankan Lokal (tanpa Docker)
```bash
# Pastikan MySQL berjalan dan database umkm_finance sudah dibuat
cp .env.example .env  # edit sesuai konfigurasi lokal
go run ./cmd/main.go
```

## Jalankan Unit Test
```bash
go test ./internal/patterns/... -v
```

## Struktur Design Pattern
- **Factory Pattern**: `internal/patterns/factory.go`
- **Observer Pattern**: `internal/patterns/observer.go`
- **Middleware**: `internal/middleware/tenant.go`

## Contoh Request
```bash
# Buat transaksi (Factory Pattern bekerja di sini)
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-001" \
  -d '{"type":"income","category":"Penjualan","amount":500000}'

# Laporan bulanan (ReportFactory bekerja di sini)
curl "http://localhost:8080/api/reports?period=monthly" \
  -H "X-Tenant-ID: tenant-001"
```

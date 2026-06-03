---
name: umkm-finance-saas
description: >
  Scaffold lengkap MVP SaaS Pencatatan Keuangan UMKM dengan Factory Pattern +
  Observer Pattern menggunakan Go 1.22 + Gin (backend), Flutter 3 (mobile),
  dan Next.js 14 App Router (web). GUNAKAN skill ini kapanpun user menyebut:
  pencatatan keuangan UMKM, aplikasi kasir, laporan keuangan otomatis,
  Factory Pattern Go, Observer Pattern Flutter/Next.js, studi kasus design
  pattern sistem keuangan, SaaS keuangan multi-tenant, tugas akhir/skripsi
  design pattern, request generate kode salah satu dari repo backend/web/mobile,
  MVP keuangan usaha kecil. Skill ini menghasilkan kode siap-jalan (ready-to-run)
  lengkap dengan Dockerfile, .env.example, unit test, middleware, error handling,
  dan README — BUKAN hanya penjelasan konsep. Jika user menyebut salah satu
  kata kunci di atas, langsung baca referensi dan generate kode.
---

# MVP SaaS Pencatatan Keuangan UMKM
## Factory + Observer Pattern | Go · Flutter · Next.js

---

## Cara Menggunakan Skill Ini

1. **Identifikasi** repo yang diminta: `backend` / `web` / `mobile` / `semua`
2. **Baca referensi** yang sesuai sebelum menulis kode (wajib)
3. **Generate semua file** — jangan skip file penting
4. Jika user tidak spesifik, tanya: *"Mau mulai dari repo mana?"*

| Kebutuhan | Baca referensi |
|-----------|---------------|
| Hanya design pattern | `references/patterns.md` |
| Backend Go + API | `references/backend.md` + `references/patterns.md` |
| Web Next.js | `references/web.md` |
| Flutter | `references/mobile.md` |
| Database / skema | `references/database.md` |
| Semua repo | Semua referensi |

---

## Arsitektur Sistem

```
┌──────────────┐    REST/JSON    ┌─────────────────────────────────┐
│  Flutter 3   │ ──────────────► │       Go + Gin :8080            │
│  (mobile)    │                 │                                  │
└──────────────┘                 │  ┌──────────────────────────┐   │
                                 │  │     FACTORY PATTERN       │   │
┌──────────────┐    REST/JSON    │  │  TransactionFactory       │   │
│  Next.js 14  │ ──────────────► │  │  ReportFactory            │   │
│  (web)       │                 │  └──────────────────────────┘   │
└──────────────┘                 │                                  │
                                 │  ┌──────────────────────────┐   │
                                 │  │     OBSERVER PATTERN      │   │
                                 │  │  TransactionEventBus      │   │
                                 │  │  ├─ BudgetObserver        │   │
                                 │  │  ├─ NotificationObserver  │   │
                                 │  │  └─ AuditObserver         │   │
                                 │  └──────────────────────────┘   │
                                 └───────────────┬─────────────────┘
                                                 │
                                      ┌──────────▼──────────┐
                                      │      MySQL 8         │
                                      │  tenants             │
                                      │  transactions        │
                                      │  budgets             │
                                      │  notifications       │
                                      └─────────────────────┘
```

---

## Stack Teknologi

| Layer     | Teknologi                                    |
|-----------|----------------------------------------------|
| Backend   | Go 1.22, Gin, GORM, godotenv                 |
| Mobile    | Flutter 3 (Dart), http, provider, intl       |
| Web       | Next.js 14 App Router, Tailwind, Recharts    |
| Database  | MySQL 8                                      |
| Pattern   | Factory Pattern + Observer Pattern           |
| DevOps    | Docker, docker-compose                       |
| Testing   | Go testing, testify                          |

---

## Design Pattern — Ringkasan

### Factory Pattern
Membuat objek Transaction dan Report **secara dinamis** tanpa `if-else`
tersebar di seluruh handler. Controller hanya tahu tipe string, Factory
yang menentukan struct mana yang diinstansiasi.

```
POST /api/transactions  body: {type:"expense",...}
  → TransactionFactory.Create("expense", ...) → *ExpenseTransaction
  → tx.Validate()
  → db.Save()
  → EventBus.Publish(event)  ← Observer Pattern mulai di sini
```

### Observer Pattern
Setiap transaksi yang disimpan **otomatis memicu semua Observer** async
tanpa coupling langsung. Menambah perilaku baru = tambah Observer baru,
tidak perlu ubah TransactionService.

```
EventBus.Publish(event)
  ├─► BudgetObserver    → UPDATE budgets SET spent += amount
  ├─► NotifObserver     → INSERT INTO notifications
  └─► AuditObserver     → fmt.Printf audit log
```

---

## File Per Repo

### Backend (`backend/`)
```
cmd/main.go                          ← entry point, wire semua
internal/config/config.go            ← ENV loader
internal/database/database.go        ← connect + auto-migrate
internal/models/models.go            ← Tenant, Transaction, Budget, Notification
internal/patterns/factory.go         ← ★ Factory Pattern
internal/patterns/observer.go        ← ★ Observer Pattern
internal/middleware/tenant.go        ← middleware X-Tenant-ID terpusat
internal/services/transaction.go     ← Create (pakai Factory + Observer)
internal/handlers/{tx,report,...}.go ← HTTP handlers
internal/patterns/factory_test.go    ← unit test Factory
internal/patterns/observer_test.go   ← unit test Observer
.env.example / Dockerfile / docker-compose.yml
```

### Web (`web/`)
```
app/layout.tsx          ← nav bar
app/page.tsx            ← dashboard
app/transactions/       ← form + riwayat
app/reports/            ← laporan + chart
app/notifications/      ← list notifikasi
lib/api.ts              ← fetch client
components/Skeleton.tsx ← loading state
.env.example / Dockerfile / next.config.js
```

### Mobile (`mobile/`)
```
lib/main.dart
lib/config.dart
lib/providers/finance_provider.dart   ← global state (Provider)
lib/services/api_service.dart
lib/screens/{home,add_tx,report,notif}_screen.dart
pubspec.yaml / Dockerfile
```

---

## API Endpoints (Backend)

| Method | Path                        | Deskripsi                    |
|--------|-----------------------------|------------------------------|
| GET    | /health                     | health check                 |
| POST   | /api/transactions           | Buat transaksi (Factory)     |
| GET    | /api/transactions           | List (support ?page=&limit=) |
| GET    | /api/transactions/summary   | Total income/expense/balance |
| GET    | /api/reports?period=monthly | Laporan (ReportFactory)      |
| GET    | /api/budgets                | List anggaran                |
| POST   | /api/budgets                | Buat anggaran                |
| GET    | /api/notifications          | List notifikasi              |

Header wajib: `X-Tenant-ID: <id>` — divalidasi middleware, bukan handler.

---

## Quick Start

```bash
# Backend + MySQL
cd backend && cp .env.example .env
docker-compose up -d
# Verifikasi: curl -H "X-Tenant-ID: tenant-001" localhost:8080/health

# Web
cd web && cp .env.example .env.local
npm install && npm run dev
# Buka: http://localhost:3000

# Mobile (Android emulator)
cd mobile && flutter pub get
flutter run \
  --dart-define=API_URL=http://10.0.2.2:8080 \
  --dart-define=TENANT_ID=tenant-001
```

---

## Pembagian Tugas (5 Anggota)

| Anggota | Area       | File Utama                              |
|---------|------------|-----------------------------------------|
| 1       | Backend    | `patterns/factory.go` + models + DB     |
| 2       | Backend    | `patterns/observer.go` + EventBus       |
| 3       | Backend    | Handlers + middleware + Docker          |
| 4       | Web        | Next.js dashboard + form + chart        |
| 5       | Mobile     | Flutter screens + Provider state        |

---

## ENV Variables Lengkap

**`backend/.env`**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=umkm_finance
SERVER_PORT=8080
GIN_MODE=debug
```

**`web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_TENANT_ID=tenant-001
```

**`mobile` (dart-define)**
```
API_URL=http://10.0.2.2:8080   # emulator Android
TENANT_ID=tenant-001
```

---

## Checklist MVP

Backend:
- [ ] Factory: TransactionFactory + ReportFactory (`patterns/factory.go`)
- [ ] Observer: EventBus + 3 Observer async (`patterns/observer.go`)
- [ ] Middleware tenant ID terpusat (`middleware/tenant.go`)
- [ ] CRUD transaksi dengan Factory
- [ ] Laporan harian/mingguan/bulanan dengan ReportFactory
- [ ] Anggaran + alert Observer saat over-limit
- [ ] Unit test Factory dan Observer
- [ ] Docker + docker-compose (backend + MySQL)

Web:
- [ ] Dashboard: saldo + grafik + recent transactions
- [ ] Form transaksi dengan loading state
- [ ] Laporan dengan Recharts (bar chart per kategori)
- [ ] Notifikasi list
- [ ] Skeleton loading saat fetch

Mobile:
- [ ] Provider global state (saldo, transaksi terbaru)
- [ ] Home screen dengan kartu saldo
- [ ] Form tambah transaksi
- [ ] Laporan dengan dropdown periode
- [ ] Notifikasi screen

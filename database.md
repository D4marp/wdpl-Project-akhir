# Database Reference: MySQL 8
# Skema lengkap, migrasi manual, seed data, indeks performa

---

## Skema Tabel

```sql
-- ─────────────────────────────────────────────
-- 1. TENANTS — unit usaha (multi-tenant SaaS)
-- ─────────────────────────────────────────────
CREATE TABLE tenants (
  id         VARCHAR(50)   NOT NULL,
  name       VARCHAR(100)  NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 2. TRANSACTIONS — semua transaksi keuangan
--    Dibuat via Factory Pattern (income/expense)
-- ─────────────────────────────────────────────
CREATE TABLE transactions (
  id          INT            NOT NULL AUTO_INCREMENT,
  tenant_id   VARCHAR(50)    NOT NULL,
  type        ENUM('income','expense') NOT NULL,
  category    VARCHAR(100)   NOT NULL,
  description TEXT,
  amount      DECIMAL(15,2)  NOT NULL DEFAULT 0,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Indeks komposit: query by tenant + urutan waktu
  INDEX idx_tenant_date (tenant_id, created_at DESC),
  -- Indeks untuk agregasi per kategori (laporan)
  INDEX idx_tenant_category (tenant_id, category),
  CONSTRAINT fk_tx_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 3. BUDGETS — anggaran per kategori pengeluaran
--    spent_amount diperbarui otomatis oleh BudgetObserver
-- ─────────────────────────────────────────────
CREATE TABLE budgets (
  id            INT           NOT NULL AUTO_INCREMENT,
  tenant_id     VARCHAR(50)   NOT NULL,
  category      VARCHAR(100)  NOT NULL,
  limit_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Satu budget per kategori per tenant
  UNIQUE KEY uq_tenant_category (tenant_id, category),
  CONSTRAINT fk_budget_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- 4. NOTIFICATIONS — notifikasi otomatis
--    Diisi oleh NotificationObserver & BudgetObserver
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         INT          NOT NULL AUTO_INCREMENT,
  tenant_id  VARCHAR(50)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  type       ENUM('info','warning') NOT NULL DEFAULT 'info',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notif_tenant (tenant_id, created_at DESC),
  CONSTRAINT fk_notif_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Migrasi Manual (jika tidak pakai GORM auto-migrate)

Simpan sebagai `migrations/001_init.sql` dan jalankan sekali:

```sql
-- Jalankan di MySQL CLI atau tools seperti TablePlus / DBeaver
SOURCE migrations/001_init.sql;

-- Atau via CLI:
-- mysql -u root -p umkm_finance < migrations/001_init.sql
```

---

## Seed Data Lengkap

```sql
-- Tenant default
INSERT INTO tenants (id, name, created_at) VALUES
  ('tenant-001', 'Toko Maju Jaya',    NOW()),
  ('tenant-002', 'Warung Bu Sari',    NOW()),
  ('tenant-003', 'Bengkel Pak Darto', NOW());

-- Transaksi contoh untuk tenant-001 (30 hari terakhir)
INSERT INTO transactions (tenant_id, type, category, description, amount, created_at) VALUES
  ('tenant-001', 'income',  'Penjualan',   'Penjualan Senin pagi',         850000,  DATE_SUB(NOW(), INTERVAL 30 DAY)),
  ('tenant-001', 'expense', 'Bahan Baku',  'Beli tepung & gula',           200000,  DATE_SUB(NOW(), INTERVAL 29 DAY)),
  ('tenant-001', 'income',  'Penjualan',   'Penjualan Selasa',             920000,  DATE_SUB(NOW(), INTERVAL 28 DAY)),
  ('tenant-001', 'expense', 'Operasional', 'Listrik bulan ini',            350000,  DATE_SUB(NOW(), INTERVAL 27 DAY)),
  ('tenant-001', 'income',  'Jasa',        'Jasa pengiriman',              150000,  DATE_SUB(NOW(), INTERVAL 25 DAY)),
  ('tenant-001', 'expense', 'Bahan Baku',  'Beli minyak goreng',           180000,  DATE_SUB(NOW(), INTERVAL 24 DAY)),
  ('tenant-001', 'income',  'Penjualan',   'Penjualan akhir pekan',       1250000,  DATE_SUB(NOW(), INTERVAL 22 DAY)),
  ('tenant-001', 'expense', 'Gaji',        'Gaji karyawan harian',        500000,  DATE_SUB(NOW(), INTERVAL 20 DAY)),
  ('tenant-001', 'income',  'Penjualan',   'Penjualan online',             670000,  DATE_SUB(NOW(), INTERVAL 18 DAY)),
  ('tenant-001', 'expense', 'Operasional', 'Sewa tempat bulan ini',        400000,  DATE_SUB(NOW(), INTERVAL 15 DAY)),
  ('tenant-001', 'income',  'Penjualan',   'Penjualan Jumat',              780000,  DATE_SUB(NOW(), INTERVAL 10 DAY)),
  ('tenant-001', 'expense', 'Bahan Baku',  'Restock bahan mingguan',       320000,  DATE_SUB(NOW(), INTERVAL 7  DAY)),
  ('tenant-001', 'income',  'Penjualan',   'Penjualan weekend',           1100000,  DATE_SUB(NOW(), INTERVAL 3  DAY)),
  ('tenant-001', 'expense', 'Operasional', 'Kuota internet toko',           99000,  DATE_SUB(NOW(), INTERVAL 1  DAY)),
  ('tenant-001', 'income',  'Penjualan',   'Penjualan hari ini',           550000,  NOW());

-- Anggaran untuk tenant-001
INSERT INTO budgets (tenant_id, category, limit_amount, spent_amount, created_at) VALUES
  ('tenant-001', 'Bahan Baku',   1500000, 700000, NOW()),
  ('tenant-001', 'Operasional',  1000000, 849000, NOW()),
  ('tenant-001', 'Gaji',         2000000, 500000, NOW());
```

---

## Query Penting yang Dipakai Aplikasi

```sql
-- Summary saldo (dipakai GET /api/transactions/summary)
SELECT
  type,
  COALESCE(SUM(amount), 0) AS total
FROM transactions
WHERE tenant_id = 'tenant-001'
GROUP BY type;

-- Laporan bulanan (dipakai ReportFactory — MonthlyReport)
SELECT type, category, description, amount, created_at
FROM transactions
WHERE tenant_id = 'tenant-001'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
ORDER BY created_at DESC;

-- List transaksi dengan pagination
SELECT *
FROM transactions
WHERE tenant_id = 'tenant-001'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;   -- page 1

-- Cek total untuk pagination
SELECT COUNT(*) AS total
FROM transactions
WHERE tenant_id = 'tenant-001';

-- Update spent_amount (dipakai BudgetObserver)
UPDATE budgets
SET spent_amount = spent_amount + 200000
WHERE tenant_id = 'tenant-001' AND category = 'Bahan Baku';

-- Cek budget over-limit (dipakai BudgetObserver)
SELECT id, category, limit_amount, spent_amount
FROM budgets
WHERE tenant_id = 'tenant-001'
  AND category = 'Bahan Baku'
LIMIT 1;
```

---

## Penjelasan Relasi Antar Tabel

```
tenants
  │
  ├──► transactions  (tenant_id FK)
  │      Setiap transaksi milik satu tenant.
  │      Dibuat via Factory Pattern.
  │      Memicu Observer Pattern saat INSERT.
  │
  ├──► budgets       (tenant_id FK, UNIQUE per category)
  │      Satu budget per kategori per tenant.
  │      spent_amount diupdate oleh BudgetObserver.
  │
  └──► notifications (tenant_id FK)
         Diisi otomatis oleh:
         - NotificationObserver: setiap transaksi baru
         - BudgetObserver: saat spent > limit
```

---

## Tips Performa

1. **Indeks `idx_tenant_date`** — query list dan laporan selalu filter `tenant_id`
   lalu sort `created_at DESC`. Tanpa indeks ini, full table scan terjadi.

2. **Indeks `idx_tenant_category`** — dipakai saat BudgetObserver lookup budget
   per kategori. Query singkat tapi dipanggil setiap transaksi.

3. **DECIMAL(15,2)** untuk `amount` — lebih aman dari FLOAT untuk nilai uang,
   menghindari floating point rounding error.

4. **ENUM** untuk `type` dan `type` notifikasi — lebih efisien dari VARCHAR
   dan memberi constraint langsung di database level.

5. **utf8mb4** charset — mendukung emoji dan karakter Unicode penuh,
   penting untuk deskripsi transaksi dari user.

---

## Reset Database (Development Only)

```sql
DROP DATABASE IF EXISTS umkm_finance;
CREATE DATABASE umkm_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE umkm_finance;
-- Lalu jalankan ulang migrations/001_init.sql + seed
```

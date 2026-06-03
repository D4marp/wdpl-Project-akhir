# Backend Reference: Go 1.22 + Gin
# Kode lengkap — middleware terpusat, error handling, pagination

---

## Struktur Folder

```
backend/
├── cmd/
│   └── main.go
├── internal/
│   ├── config/config.go
│   ├── database/database.go
│   ├── models/models.go
│   ├── middleware/
│   │   └── tenant.go              ← ★ NEW: middleware X-Tenant-ID terpusat
│   ├── patterns/
│   │   ├── factory.go             ← Factory Pattern (lihat patterns.md)
│   │   ├── factory_test.go
│   │   ├── observer.go            ← Observer Pattern (lihat patterns.md)
│   │   └── observer_test.go
│   ├── services/
│   │   └── transaction_service.go
│   └── handlers/
│       ├── transaction.go
│       ├── report.go
│       ├── budget.go
│       ├── notification.go
│       └── health.go
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── README.md
```

---

## `go.mod`

```
module umkm-finance-backend

go 1.22

require (
    github.com/gin-gonic/gin v1.10.0
    github.com/joho/godotenv v1.5.1
    github.com/stretchr/testify v1.9.0
    gorm.io/driver/mysql v1.5.7
    gorm.io/gorm v1.25.10
)
```

---

## `cmd/main.go`

```go
package main

import (
    "fmt"
    "log"
    "umkm-finance-backend/internal/config"
    "umkm-finance-backend/internal/database"
    "umkm-finance-backend/internal/handlers"
    "umkm-finance-backend/internal/middleware"
    "umkm-finance-backend/internal/patterns"
    "umkm-finance-backend/internal/services"

    "github.com/gin-gonic/gin"
)

func main() {
    cfg := config.Load()
    gin.SetMode(cfg.GinMode)

    db, err := database.Connect(cfg)
    if err != nil {
        log.Fatalf("Gagal koneksi database: %v", err)
    }

    // Inisialisasi Factory Pattern
    txFactory     := &patterns.TransactionFactory{}
    reportFactory := &patterns.ReportFactory{}

    // Inisialisasi Observer Pattern (EventBus + semua Observer)
    eventBus := patterns.NewTransactionEventBus(db)

    // Inisialisasi Service
    txService := services.NewTransactionService(db, txFactory, eventBus)

    // Inisialisasi Handler
    txHandler     := handlers.NewTransactionHandler(txService, db)
    reportHandler := handlers.NewReportHandler(reportFactory, db)
    budgetHandler := handlers.NewBudgetHandler(db)
    notifHandler  := handlers.NewNotificationHandler(db)

    r := gin.Default()
    r.Use(corsMiddleware())

    // Health check (tidak perlu tenant ID)
    r.GET("/health", handlers.HealthCheck)

    // Semua route API wajib punya X-Tenant-ID
    api := r.Group("/api", middleware.RequireTenantID())
    {
        api.POST("/transactions",         txHandler.Create)
        api.GET("/transactions",          txHandler.List)
        api.GET("/transactions/summary",  txHandler.Summary)
        api.GET("/reports",               reportHandler.Generate)
        api.POST("/budgets",              budgetHandler.Create)
        api.GET("/budgets",               budgetHandler.List)
        api.GET("/notifications",         notifHandler.List)
    }

    addr := fmt.Sprintf(":%s", cfg.ServerPort)
    log.Printf("Server jalan di %s (mode: %s)", addr, cfg.GinMode)
    if err := r.Run(addr); err != nil {
        log.Fatalf("Server gagal: %v", err)
    }
}

func corsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID")
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        c.Next()
    }
}
```

---

## `internal/config/config.go`

```go
package config

import (
    "log"
    "os"
    "github.com/joho/godotenv"
)

type Config struct {
    DBHost, DBPort, DBUser, DBPassword, DBName string
    ServerPort string
    GinMode    string
}

func Load() *Config {
    if err := godotenv.Load(); err != nil {
        log.Println(".env tidak ditemukan, pakai ENV system")
    }
    return &Config{
        DBHost:     getEnv("DB_HOST", "localhost"),
        DBPort:     getEnv("DB_PORT", "3306"),
        DBUser:     getEnv("DB_USER", "root"),
        DBPassword: getEnv("DB_PASSWORD", "secret"),
        DBName:     getEnv("DB_NAME", "umkm_finance"),
        ServerPort: getEnv("SERVER_PORT", "8080"),
        GinMode:    getEnv("GIN_MODE", "debug"),
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" { return v }
    return fallback
}
```

---

## `internal/database/database.go`

```go
package database

import (
    "fmt"
    "log"
    "umkm-finance-backend/internal/config"
    "umkm-finance-backend/internal/models"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
    dsn := fmt.Sprintf(
        "%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName,
    )
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, fmt.Errorf("buka koneksi DB gagal: %w", err)
    }

    // Auto-migrate: buat tabel yang belum ada, tambah kolom baru
    if err := db.AutoMigrate(
        &models.Tenant{},
        &models.Transaction{},
        &models.Budget{},
        &models.Notification{},
    ); err != nil {
        return nil, fmt.Errorf("auto-migrate gagal: %w", err)
    }

    // Seed tenant default jika belum ada
    var count int64
    db.Model(&models.Tenant{}).Count(&count)
    if count == 0 {
        db.Create(&models.Tenant{ID: "tenant-001", Name: "Toko Maju Jaya"})
        log.Println("[DB] Seed tenant-001 selesai")
    }
    return db, nil
}
```

---

## `internal/models/models.go`

```go
package models

import "time"

type Tenant struct {
    ID        string    `gorm:"primaryKey"       json:"id"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
    ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
    TenantID    string    `gorm:"index:idx_tenant_date"    json:"tenant_id"`
    Type        string    `json:"type"`
    Category    string    `json:"category"`
    Description string    `json:"description"`
    Amount      float64   `json:"amount"`
    CreatedAt   time.Time `gorm:"index:idx_tenant_date"   json:"created_at"`
}

type Budget struct {
    ID          uint      `gorm:"primaryKey;autoIncrement"            json:"id"`
    TenantID    string    `gorm:"uniqueIndex:uq_tenant_cat"           json:"tenant_id"`
    Category    string    `gorm:"uniqueIndex:uq_tenant_cat"           json:"category"`
    LimitAmount float64   `json:"limit_amount"`
    SpentAmount float64   `json:"spent_amount"`
    CreatedAt   time.Time `json:"created_at"`
}

type Notification struct {
    ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
    TenantID  string    `gorm:"index"                    json:"tenant_id"`
    Title     string    `json:"title"`
    Message   string    `json:"message"`
    Type      string    `json:"type"` // info | warning
    IsRead    bool      `json:"is_read"`
    CreatedAt time.Time `json:"created_at"`
}
```

---

## `internal/middleware/tenant.go`  ★ NEW

```go
package middleware

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
)

const TenantIDKey = "tenantID"

// RequireTenantID adalah middleware yang memvalidasi header X-Tenant-ID.
// Jika tidak ada atau kosong, langsung kembalikan 400 — handler tidak
// perlu lagi cek sendiri-sendiri.
func RequireTenantID() gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := strings.TrimSpace(c.GetHeader("X-Tenant-ID"))
        if tenantID == "" {
            c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
                "error": "header X-Tenant-ID wajib ada dan tidak boleh kosong",
            })
            return
        }
        // Simpan ke context agar handler bisa ambil via c.GetString(TenantIDKey)
        c.Set(TenantIDKey, tenantID)
        c.Next()
    }
}
```

---

## `internal/services/transaction_service.go`

```go
package services

import (
    "fmt"
    "time"
    "umkm-finance-backend/internal/models"
    "umkm-finance-backend/internal/patterns"
    "gorm.io/gorm"
)

type TransactionService struct {
    db       *gorm.DB
    factory  *patterns.TransactionFactory
    eventBus *patterns.TransactionEventBus
}

func NewTransactionService(
    db *gorm.DB,
    factory *patterns.TransactionFactory,
    bus *patterns.TransactionEventBus,
) *TransactionService {
    return &TransactionService{db: db, factory: factory, eventBus: bus}
}

// Create menggunakan Factory Pattern untuk membuat objek transaksi,
// menyimpannya, lalu memicu Observer Pattern via EventBus.
func (s *TransactionService) Create(
    txType, category, description, tenantID string,
    amount float64,
) (*models.Transaction, error) {
    // 1. FACTORY PATTERN: buat objek yang sesuai tipe
    tx, err := s.factory.Create(txType, category, description, tenantID, amount)
    if err != nil {
        return nil, fmt.Errorf("factory error: %w", err)
    }

    // 2. Validasi bisnis (tiap tipe punya aturannya sendiri)
    if err := tx.Validate(); err != nil {
        return nil, fmt.Errorf("validasi gagal: %w", err)
    }

    // 3. Simpan ke database
    record := &models.Transaction{
        TenantID:    tx.GetTenantID(),
        Type:        tx.GetType(),
        Category:    tx.GetCategory(),
        Description: tx.GetDescription(),
        Amount:      tx.GetAmount(),
        CreatedAt:   time.Now(),
    }
    if err := s.db.Create(record).Error; err != nil {
        return nil, fmt.Errorf("simpan transaksi gagal: %w", err)
    }

    // 4. OBSERVER PATTERN: publish ke semua Observer (async)
    s.eventBus.Publish(patterns.TransactionEvent{
        TenantID:    record.TenantID,
        Type:        record.Type,
        Amount:      record.Amount,
        Category:    record.Category,
        Description: record.Description,
        CreatedAt:   record.CreatedAt,
    })

    return record, nil
}
```

---

## `internal/handlers/transaction.go`

```go
package handlers

import (
    "net/http"
    "strconv"
    "umkm-finance-backend/internal/middleware"
    "umkm-finance-backend/internal/models"
    "umkm-finance-backend/internal/services"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type TransactionHandler struct {
    svc *services.TransactionService
    db  *gorm.DB
}

func NewTransactionHandler(svc *services.TransactionService, db *gorm.DB) *TransactionHandler {
    return &TransactionHandler{svc: svc, db: db}
}

type createTxReq struct {
    Type        string  `json:"type"     binding:"required"`
    Category    string  `json:"category" binding:"required"`
    Description string  `json:"description"`
    Amount      float64 `json:"amount"   binding:"required,gt=0"`
}

func (h *TransactionHandler) Create(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)

    var req createTxReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    record, err := h.svc.Create(req.Type, req.Category, req.Description, tenantID, req.Amount)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"message": "Transaksi berhasil disimpan", "data": record})
}

// List mendukung pagination via ?page=1&limit=20
func (h *TransactionHandler) List(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)
    page,  _ := strconv.Atoi(c.DefaultQuery("page",  "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    if page < 1  { page = 1 }
    if limit < 1 || limit > 100 { limit = 20 }
    offset := (page - 1) * limit

    var txs   []models.Transaction
    var total int64
    h.db.Model(&models.Transaction{}).Where("tenant_id = ?", tenantID).Count(&total)
    h.db.Where("tenant_id = ?", tenantID).
        Order("created_at DESC").Limit(limit).Offset(offset).Find(&txs)

    c.JSON(http.StatusOK, gin.H{
        "data":  txs,
        "total": total,
        "page":  page,
        "limit": limit,
    })
}

func (h *TransactionHandler) Summary(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)
    type Row struct{ Type string; Total float64 }
    var rows []Row
    h.db.Raw(`
        SELECT type, COALESCE(SUM(amount), 0) AS total
        FROM transactions WHERE tenant_id = ? GROUP BY type
    `, tenantID).Scan(&rows)

    income, expense := 0.0, 0.0
    for _, r := range rows {
        if r.Type == "income" { income = r.Total } else { expense = r.Total }
    }
    c.JSON(http.StatusOK, gin.H{
        "data": gin.H{"income": income, "expense": expense, "balance": income - expense},
    })
}
```

---

## `internal/handlers/report.go`

```go
package handlers

import (
    "net/http"
    "umkm-finance-backend/internal/middleware"
    "umkm-finance-backend/internal/patterns"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type ReportHandler struct {
    factory *patterns.ReportFactory
    db      *gorm.DB
}

func NewReportHandler(f *patterns.ReportFactory, db *gorm.DB) *ReportHandler {
    return &ReportHandler{factory: f, db: db}
}

func (h *ReportHandler) Generate(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)
    period := c.DefaultQuery("period", "monthly")

    // REPORT FACTORY PATTERN: pilih jenis laporan dari query param
    report, err := h.factory.Create(period)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    data, err := report.Generate(tenantID, h.db)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate laporan"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": data})
}
```

---

## `internal/handlers/budget.go`

```go
package handlers

import (
    "net/http"
    "time"
    "umkm-finance-backend/internal/middleware"
    "umkm-finance-backend/internal/models"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type BudgetHandler struct{ db *gorm.DB }

func NewBudgetHandler(db *gorm.DB) *BudgetHandler { return &BudgetHandler{db: db} }

func (h *BudgetHandler) Create(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)
    var body struct {
        Category    string  `json:"category"     binding:"required"`
        LimitAmount float64 `json:"limit_amount" binding:"required,gt=0"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    b := models.Budget{
        TenantID: tenantID, Category: body.Category,
        LimitAmount: body.LimitAmount, CreatedAt: time.Now(),
    }
    if err := h.db.Create(&b).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan anggaran"})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": b})
}

func (h *BudgetHandler) List(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)
    var budgets []models.Budget
    h.db.Where("tenant_id = ?", tenantID).Find(&budgets)
    c.JSON(http.StatusOK, gin.H{"data": budgets})
}
```

---

## `internal/handlers/notification.go`

```go
package handlers

import (
    "net/http"
    "umkm-finance-backend/internal/middleware"
    "umkm-finance-backend/internal/models"
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

type NotificationHandler struct{ db *gorm.DB }

func NewNotificationHandler(db *gorm.DB) *NotificationHandler {
    return &NotificationHandler{db: db}
}

func (h *NotificationHandler) List(c *gin.Context) {
    tenantID := c.GetString(middleware.TenantIDKey)
    var notifs []models.Notification
    h.db.Where("tenant_id = ?", tenantID).
        Order("created_at DESC").Limit(30).Find(&notifs)
    c.JSON(http.StatusOK, gin.H{"data": notifs})
}
```

---

## `internal/handlers/health.go`

```go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func HealthCheck(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "umkm-finance-backend"})
}
```

---

## `.env.example`

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=umkm_finance
SERVER_PORT=8080
GIN_MODE=debug
```

---

## `Dockerfile`

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
```

---

## `docker-compose.yml`

```yaml
version: "3.9"

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: umkm_finance
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-psecret"]
      interval: 10s
      retries: 6
      start_period: 20s

  backend:
    build: .
    ports:
      - "8080:8080"
    env_file: .env
    environment:
      DB_HOST: mysql
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mysql_data:
```

---

## `README.md`

```markdown
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
```

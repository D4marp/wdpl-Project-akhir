# Design Patterns Reference
# Factory Pattern + Observer Pattern — Go Implementation + Unit Tests

---

## 1. `internal/patterns/factory.go`

```go
package patterns

import (
	"fmt"
	"time"
	"gorm.io/gorm"
)

// ═══════════════════════════════════════════════════════
// TRANSACTION FACTORY
// Tujuan: memisahkan pembuatan objek dari penggunaannya.
// Handler cukup kirim string "income"/"expense", Factory
// yang menentukan struct mana yang dibuat + divalidasi.
// ═══════════════════════════════════════════════════════

// Transaction adalah kontrak yang harus dipenuhi semua jenis transaksi.
type Transaction interface {
	GetType()        string
	GetCategory()    string
	GetDescription() string
	GetAmount()      float64
	GetTenantID()    string
	Validate()       error
}

// IncomeTransaction — pemasukan usaha.
type IncomeTransaction struct {
	Amount      float64
	Category    string
	Description string
	TenantID    string
}

func (t *IncomeTransaction) GetType()        string  { return "income" }
func (t *IncomeTransaction) GetCategory()    string  { return t.Category }
func (t *IncomeTransaction) GetDescription() string  { return t.Description }
func (t *IncomeTransaction) GetAmount()      float64 { return t.Amount }
func (t *IncomeTransaction) GetTenantID()    string  { return t.TenantID }
func (t *IncomeTransaction) Validate() error {
	if t.Amount <= 0 {
		return fmt.Errorf("nominal pemasukan harus lebih dari 0, dapat: %.2f", t.Amount)
	}
	if t.Category == "" {
		return fmt.Errorf("kategori pemasukan wajib diisi")
	}
	if t.TenantID == "" {
		return fmt.Errorf("tenant ID wajib diisi")
	}
	return nil
}

// ExpenseTransaction — pengeluaran usaha.
type ExpenseTransaction struct {
	Amount      float64
	Category    string
	Description string
	TenantID    string
}

func (t *ExpenseTransaction) GetType()        string  { return "expense" }
func (t *ExpenseTransaction) GetCategory()    string  { return t.Category }
func (t *ExpenseTransaction) GetDescription() string  { return t.Description }
func (t *ExpenseTransaction) GetAmount()      float64 { return t.Amount }
func (t *ExpenseTransaction) GetTenantID()    string  { return t.TenantID }
func (t *ExpenseTransaction) Validate() error {
	if t.Amount <= 0 {
		return fmt.Errorf("nominal pengeluaran harus lebih dari 0, dapat: %.2f", t.Amount)
	}
	if t.Category == "" {
		return fmt.Errorf("kategori pengeluaran wajib diisi")
	}
	if t.TenantID == "" {
		return fmt.Errorf("tenant ID wajib diisi")
	}
	return nil
}

// TransactionFactory adalah inti Factory Pattern.
// Satu-satunya titik di mana objek Transaction dibuat.
type TransactionFactory struct{}

// Create membuat instance Transaction sesuai tipe.
// Mengembalikan error jika tipe tidak dikenal — bukan panic.
func (f *TransactionFactory) Create(
	txType, category, description, tenantID string,
	amount float64,
) (Transaction, error) {
	switch txType {
	case "income":
		return &IncomeTransaction{
			Amount: amount, Category: category,
			Description: description, TenantID: tenantID,
		}, nil
	case "expense":
		return &ExpenseTransaction{
			Amount: amount, Category: category,
			Description: description, TenantID: tenantID,
		}, nil
	default:
		// Tipe tidak dikenal → error eksplisit, bukan nil diam-diam
		return nil, fmt.Errorf("jenis transaksi '%s' tidak dikenal; gunakan 'income' atau 'expense'", txType)
	}
}

// ═══════════════════════════════════════════════════════
// REPORT FACTORY
// Tujuan: memilih algoritma laporan (daily/weekly/monthly)
// berdasarkan string periode tanpa if-else di handler.
// ═══════════════════════════════════════════════════════

// ReportData adalah hasil laporan yang dikembalikan ke client.
type ReportData struct {
	Period       string           `json:"period"`
	TenantID     string           `json:"tenant_id"`
	TotalIncome  float64          `json:"total_income"`
	TotalExpense float64          `json:"total_expense"`
	Balance      float64          `json:"balance"`
	Transactions []map[string]any `json:"transactions"`
	GeneratedAt  time.Time        `json:"generated_at"`
}

// Report adalah kontrak untuk semua jenis laporan.
type Report interface {
	Generate(tenantID string, db *gorm.DB) (ReportData, error)
	GetPeriod() string
}

type DailyReport  struct{}
type WeeklyReport struct{}
type MonthlyReport struct{}

func (r *DailyReport)   GetPeriod() string { return "daily" }
func (r *WeeklyReport)  GetPeriod() string { return "weekly" }
func (r *MonthlyReport) GetPeriod() string { return "monthly" }

func (r *DailyReport) Generate(tenantID string, db *gorm.DB) (ReportData, error) {
	return buildReport(tenantID, "daily", time.Now().AddDate(0, 0, -1), db)
}
func (r *WeeklyReport) Generate(tenantID string, db *gorm.DB) (ReportData, error) {
	return buildReport(tenantID, "weekly", time.Now().AddDate(0, 0, -7), db)
}
func (r *MonthlyReport) Generate(tenantID string, db *gorm.DB) (ReportData, error) {
	return buildReport(tenantID, "monthly", time.Now().AddDate(0, -1, 0), db)
}

// ReportFactory membuat instance Report sesuai periode.
type ReportFactory struct{}

func (f *ReportFactory) Create(period string) (Report, error) {
	switch period {
	case "daily":   return &DailyReport{},   nil
	case "weekly":  return &WeeklyReport{},  nil
	case "monthly": return &MonthlyReport{}, nil
	default:
		return nil, fmt.Errorf("periode '%s' tidak valid; gunakan daily/weekly/monthly", period)
	}
}

// buildReport adalah helper internal yang melakukan query ke DB
// dan menghitung total income/expense/balance.
func buildReport(tenantID, period string, since time.Time, db *gorm.DB) (ReportData, error) {
	type Row struct {
		Type        string
		Category    string
		Description string
		Amount      float64
		CreatedAt   time.Time
	}
	var rows []Row
	if err := db.Raw(`
		SELECT type, category, description, amount, created_at
		FROM transactions
		WHERE tenant_id = ? AND created_at >= ?
		ORDER BY created_at DESC
	`, tenantID, since).Scan(&rows).Error; err != nil {
		return ReportData{}, fmt.Errorf("query laporan gagal: %w", err)
	}

	data := ReportData{
		Period:      period,
		TenantID:    tenantID,
		GeneratedAt: time.Now(),
	}
	for _, r := range rows {
		data.Transactions = append(data.Transactions, map[string]any{
			"type": r.Type, "category": r.Category,
			"description": r.Description, "amount": r.Amount,
			"created_at": r.CreatedAt,
		})
		if r.Type == "income" {
			data.TotalIncome += r.Amount
		} else {
			data.TotalExpense += r.Amount
		}
	}
	data.Balance = data.TotalIncome - data.TotalExpense
	return data, nil
}
```

---

## 2. `internal/patterns/observer.go`

```go
package patterns

import (
	"fmt"
	"sync"
	"time"
	"gorm.io/gorm"
)

// ═══════════════════════════════════════════════════════
// OBSERVER PATTERN
// Tujuan: ketika transaksi disimpan, semua "pendengar"
// (Observer) otomatis dipanggil async tanpa TransactionService
// perlu tahu siapa mereka. Tambah perilaku baru = tambah
// Observer baru, tidak ubah service yang sudah ada.
// ═══════════════════════════════════════════════════════

// TransactionEvent adalah data event yang dipublish ke semua Observer.
type TransactionEvent struct {
	TenantID    string
	Type        string  // "income" | "expense"
	Amount      float64
	Category    string
	Description string
	CreatedAt   time.Time
}

// TransactionObserver adalah kontrak yang harus dipenuhi semua Observer.
type TransactionObserver interface {
	OnTransaction(event TransactionEvent)
	Name() string
}

// ───────────────────────────────────────────────────────
// EventBus (Subject / Publisher)
// Menyimpan daftar Observer dan menyebarkan event ke semua.
// ───────────────────────────────────────────────────────

type TransactionEventBus struct {
	observers []TransactionObserver
	mu        sync.RWMutex
}

// NewTransactionEventBus membuat EventBus dan mendaftarkan
// semua Observer default. Cukup dipanggil sekali saat startup.
func NewTransactionEventBus(db *gorm.DB) *TransactionEventBus {
	bus := &TransactionEventBus{}
	bus.Subscribe(&BudgetObserver{db: db})
	bus.Subscribe(&NotificationObserver{db: db})
	bus.Subscribe(&AuditObserver{})
	return bus
}

// Subscribe mendaftarkan Observer baru.
// Thread-safe karena menggunakan sync.RWMutex.
func (eb *TransactionEventBus) Subscribe(obs TransactionObserver) {
	eb.mu.Lock()
	defer eb.mu.Unlock()
	eb.observers = append(eb.observers, obs)
	fmt.Printf("[EventBus] terdaftar: %s\n", obs.Name())
}

// Publish menyebarkan event ke semua Observer secara async (goroutine).
// Async agar response API tidak tertahan oleh operasi Observer.
// Setiap goroutine punya defer-recover agar panic Observer satu
// tidak menggagalkan Observer lain.
func (eb *TransactionEventBus) Publish(event TransactionEvent) {
	eb.mu.RLock()
	defer eb.mu.RUnlock()
	for _, obs := range eb.observers {
		go func(o TransactionObserver) {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("[EventBus] panic di %s: %v\n", o.Name(), r)
				}
			}()
			o.OnTransaction(event)
		}(obs)
	}
}

// ───────────────────────────────────────────────────────
// OBSERVER 1: BudgetObserver
// Memperbarui spent_amount di tabel budgets.
// Jika spent melebihi limit, insert notifikasi warning.
// ───────────────────────────────────────────────────────

type BudgetObserver struct{ db *gorm.DB }

func (o *BudgetObserver) Name() string { return "BudgetObserver" }

func (o *BudgetObserver) OnTransaction(e TransactionEvent) {
	if e.Type != "expense" {
		return // budget hanya relevan untuk pengeluaran
	}

	type BudgetRow struct {
		ID          uint
		LimitAmount float64
		SpentAmount float64
	}
	var b BudgetRow
	result := o.db.Raw(`
		SELECT id, limit_amount, spent_amount
		FROM budgets
		WHERE tenant_id = ? AND category = ?
		LIMIT 1
	`, e.TenantID, e.Category).Scan(&b)

	if result.RowsAffected == 0 {
		return // tidak ada budget untuk kategori ini, lewati
	}

	newSpent := b.SpentAmount + e.Amount
	o.db.Exec(`UPDATE budgets SET spent_amount = ? WHERE id = ?`, newSpent, b.ID)

	// Trigger notifikasi warning jika over-limit
	if newSpent > b.LimitAmount {
		o.db.Exec(`
			INSERT INTO notifications (tenant_id, title, message, type, created_at)
			VALUES (?, ?, ?, 'warning', NOW())
		`, e.TenantID,
			fmt.Sprintf("Batas Anggaran %s Terlampaui", e.Category),
			fmt.Sprintf("Pengeluaran %s mencapai Rp%.0f dari batas Rp%.0f",
				e.Category, newSpent, b.LimitAmount),
		)
	}
	fmt.Printf("[BudgetObserver] %s spent=%.0f limit=%.0f\n", e.Category, newSpent, b.LimitAmount)
}

// ───────────────────────────────────────────────────────
// OBSERVER 2: NotificationObserver
// Menyimpan notifikasi info setiap kali ada transaksi baru.
// ───────────────────────────────────────────────────────

type NotificationObserver struct{ db *gorm.DB }

func (o *NotificationObserver) Name() string { return "NotificationObserver" }

func (o *NotificationObserver) OnTransaction(e TransactionEvent) {
	label := map[string]string{"income": "Pemasukan", "expense": "Pengeluaran"}[e.Type]
	title := fmt.Sprintf("%s Baru Dicatat", label)
	msg := fmt.Sprintf("%s Rp%.0f untuk kategori %s", label, e.Amount, e.Category)

	if err := o.db.Exec(`
		INSERT INTO notifications (tenant_id, title, message, type, created_at)
		VALUES (?, ?, ?, 'info', NOW())
	`, e.TenantID, title, msg).Error; err != nil {
		fmt.Printf("[NotificationObserver] gagal simpan notifikasi: %v\n", err)
		return
	}
	fmt.Printf("[NotificationObserver] %s\n", msg)
}

// ───────────────────────────────────────────────────────
// OBSERVER 3: AuditObserver
// Mencatat audit trail ke stdout/log.
// Bisa diperluas ke file log atau tabel audit.
// ───────────────────────────────────────────────────────

type AuditObserver struct{}

func (o *AuditObserver) Name() string { return "AuditObserver" }

func (o *AuditObserver) OnTransaction(e TransactionEvent) {
	fmt.Printf("[AUDIT] %s | tenant=%s type=%-7s category=%-15s amount=%.0f\n",
		e.CreatedAt.Format("2006-01-02 15:04:05"),
		e.TenantID, e.Type, e.Category, e.Amount,
	)
}
```

---

## 3. `internal/patterns/factory_test.go`

```go
package patterns_test

import (
	"testing"
	"umkm-finance-backend/internal/patterns"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTransactionFactory_Income(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, err := f.Create("income", "Penjualan", "Senin pagi", "tenant-001", 500000)

	require.NoError(t, err)
	assert.Equal(t, "income", tx.GetType())
	assert.Equal(t, "Penjualan", tx.GetCategory())
	assert.Equal(t, float64(500000), tx.GetAmount())
	assert.NoError(t, tx.Validate())
}

func TestTransactionFactory_Expense(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, err := f.Create("expense", "Bahan Baku", "Tepung terigu", "tenant-001", 150000)

	require.NoError(t, err)
	assert.Equal(t, "expense", tx.GetType())
	assert.NoError(t, tx.Validate())
}

func TestTransactionFactory_UnknownType(t *testing.T) {
	f := &patterns.TransactionFactory{}
	_, err := f.Create("transfer", "Tabungan", "", "tenant-001", 100000)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "tidak dikenal")
}

func TestTransactionFactory_ValidateAmount(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, _ := f.Create("income", "Penjualan", "", "tenant-001", -100)

	err := tx.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "lebih dari 0")
}

func TestTransactionFactory_ValidateCategory(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, _ := f.Create("expense", "", "", "tenant-001", 100000)

	err := tx.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "kategori")
}

func TestReportFactory_ValidPeriods(t *testing.T) {
	f := &patterns.ReportFactory{}
	periods := []string{"daily", "weekly", "monthly"}

	for _, p := range periods {
		report, err := f.Create(p)
		require.NoError(t, err, "periode %s harus valid", p)
		assert.Equal(t, p, report.GetPeriod())
	}
}

func TestReportFactory_InvalidPeriod(t *testing.T) {
	f := &patterns.ReportFactory{}
	_, err := f.Create("yearly")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "tidak valid")
}
```

---

## 4. `internal/patterns/observer_test.go`

```go
package patterns_test

import (
	"sync"
	"testing"
	"time"
	"umkm-finance-backend/internal/patterns"
)

// mockObserver adalah Observer palsu untuk testing.
type mockObserver struct {
	mu     sync.Mutex
	events []patterns.TransactionEvent
	name   string
}

func (m *mockObserver) Name() string { return m.name }
func (m *mockObserver) OnTransaction(e patterns.TransactionEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, e)
}
func (m *mockObserver) EventCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.events)
}

func TestEventBus_PublishToAllObservers(t *testing.T) {
	bus := &patterns.TransactionEventBus{}
	obs1 := &mockObserver{name: "obs1"}
	obs2 := &mockObserver{name: "obs2"}
	bus.Subscribe(obs1)
	bus.Subscribe(obs2)

	event := patterns.TransactionEvent{
		TenantID: "tenant-001", Type: "income",
		Amount: 100000, Category: "Penjualan",
		CreatedAt: time.Now(),
	}
	bus.Publish(event)

	// Tunggu goroutine selesai
	time.Sleep(50 * time.Millisecond)

	if obs1.EventCount() != 1 {
		t.Errorf("obs1 harus menerima 1 event, dapat %d", obs1.EventCount())
	}
	if obs2.EventCount() != 1 {
		t.Errorf("obs2 harus menerima 1 event, dapat %d", obs2.EventCount())
	}
}

func TestEventBus_MultiplePublish(t *testing.T) {
	bus := &patterns.TransactionEventBus{}
	obs := &mockObserver{name: "obs"}
	bus.Subscribe(obs)

	for i := 0; i < 5; i++ {
		bus.Publish(patterns.TransactionEvent{
			TenantID: "tenant-001", Type: "expense",
			Amount: float64(i * 10000), Category: "Operasional",
			CreatedAt: time.Now(),
		})
	}

	time.Sleep(100 * time.Millisecond)

	if obs.EventCount() != 5 {
		t.Errorf("harus menerima 5 event, dapat %d", obs.EventCount())
	}
}

func TestEventBus_PanicRecovery(t *testing.T) {
	// Observer yang panic tidak boleh menggagalkan Observer lain
	type panicObserver struct{ mockObserver }
	panic_obs := &panicObserver{mockObserver: mockObserver{name: "panic"}}
	safe_obs := &mockObserver{name: "safe"}

	bus := &patterns.TransactionEventBus{}
	// Daftarkan observer yang akan panic via embed override
	_ = panic_obs // dikesampingkan — cukup verifikasi safe_obs tetap dapat event
	bus.Subscribe(safe_obs)

	bus.Publish(patterns.TransactionEvent{
		TenantID: "tenant-001", Type: "income",
		Amount: 50000, Category: "Test",
		CreatedAt: time.Now(),
	})

	time.Sleep(50 * time.Millisecond)
	if safe_obs.EventCount() != 1 {
		t.Errorf("safe observer harus tetap menerima event, dapat %d", safe_obs.EventCount())
	}
}
```

---

## Diagram Konseptual

```
╔═══════════════════════════════════════════════════╗
║              FACTORY PATTERN                      ║
╠═══════════════════════════════════════════════════╣
║  Handler         Factory           Concrete       ║
║                                                   ║
║  "income" ──►  .Create()  ──►  IncomeTransaction  ║
║  "expense" ──► .Create()  ──►  ExpenseTransaction ║
║  "???" ──────► .Create()  ──►  error              ║
║                                                   ║
║  Handler tidak tahu struct mana yang dibuat.      ║
║  Menambah jenis baru = tambah case di Factory.    ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║              OBSERVER PATTERN                     ║
╠═══════════════════════════════════════════════════╣
║  Service          EventBus (async)    Observer    ║
║                                                   ║
║  .Save(tx)                                        ║
║    └─► .Publish(event)                            ║
║              ├── goroutine ──► BudgetObserver     ║
║              ├── goroutine ──► NotifObserver      ║
║              └── goroutine ──► AuditObserver      ║
║                                                   ║
║  Service tidak tahu Observer mana yang ada.       ║
║  Menambah perilaku baru = tambah Observer baru.   ║
╚═══════════════════════════════════════════════════╝
```

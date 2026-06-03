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
	Type        string
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
	observers := make([]TransactionObserver, len(eb.observers))
	copy(observers, eb.observers)
	eb.mu.RUnlock()

	for _, obs := range observers {
		obs := obs // capture
		go func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("[EventBus] panic di %s: %v\n", obs.Name(), r)
				}
			}()
			obs.OnTransaction(event)
		}()
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
		return
	}

	// Update spent_amount
	result := o.db.Exec(`
		UPDATE budgets
		SET spent_amount = spent_amount + ?
		WHERE tenant_id = ? AND category = ?
	`, e.Amount, e.TenantID, e.Category)

	if result.RowsAffected == 0 {
		return // Budget belum dibuat untuk kategori ini
	}

	// Cek apakah sudah over-limit
	type Budget struct {
		ID          uint
		Category    string
		LimitAmount float64
		SpentAmount float64
	}
	var b Budget
	o.db.Raw(`
		SELECT id, category, limit_amount, spent_amount
		FROM budgets
		WHERE tenant_id = ? AND category = ?
		LIMIT 1
	`, e.TenantID, e.Category).Scan(&b)

	newSpent := b.SpentAmount
	if newSpent > b.LimitAmount && b.LimitAmount > 0 {
		msg := fmt.Sprintf("Anggaran %s telah melebihi batas! Terpakai: %.0f dari %.0f",
			e.Category, newSpent, b.LimitAmount)
		o.db.Exec(`
			INSERT INTO notifications (tenant_id, title, message, type, is_read, created_at)
			VALUES (?, ?, ?, 'warning', 0, NOW())
		`, e.TenantID, "⚠️ Budget Over-Limit: "+e.Category, msg)
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
	msg := fmt.Sprintf("%s baru: %s sebesar Rp %.0f", label, e.Category, e.Amount)
	title := fmt.Sprintf("%s: %s", label, e.Category)

	o.db.Exec(`
		INSERT INTO notifications (tenant_id, title, message, type, is_read, created_at)
		VALUES (?, ?, ?, 'info', 0, NOW())
	`, e.TenantID, title, msg)
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
		e.TenantID,
		e.Type,
		e.Category,
		e.Amount,
	)
}

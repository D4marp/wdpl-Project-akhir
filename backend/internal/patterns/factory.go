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
		return fmt.Errorf("amount harus lebih dari 0")
	}
	if t.Category == "" {
		return fmt.Errorf("kategori tidak boleh kosong")
	}
	if t.TenantID == "" {
		return fmt.Errorf("tenant_id tidak boleh kosong")
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
		return fmt.Errorf("amount harus lebih dari 0")
	}
	if t.Category == "" {
		return fmt.Errorf("kategori tidak boleh kosong")
	}
	if t.TenantID == "" {
		return fmt.Errorf("tenant_id tidak boleh kosong")
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
			Amount:      amount,
			Category:    category,
			Description: description,
			TenantID:    tenantID,
		}, nil
	case "expense":
		return &ExpenseTransaction{
			Amount:      amount,
			Category:    category,
			Description: description,
			TenantID:    tenantID,
		}, nil
	default:
		return nil, fmt.Errorf("tipe transaksi '%s' tidak dikenal", txType)
	}
}

// ═══════════════════════════════════════════════════════
// REPORT FACTORY
// Tujuan: memilih algoritma laporan (daily/weekly/monthly)
// berdasarkan string periode tanpa if-else di handler.
// ═══════════════════════════════════════════════════════

// ReportData adalah hasil laporan yang dikembalikan ke client.
type ReportData struct {
	Period        string        `json:"period"`
	TotalIncome   float64       `json:"total_income"`
	TotalExpense  float64       `json:"total_expense"`
	Balance       float64       `json:"balance"`
	Transactions  []interface{} `json:"transactions"`
	GeneratedAt   time.Time     `json:"generated_at"`
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
	case "daily":
		return &DailyReport{}, nil
	case "weekly":
		return &WeeklyReport{}, nil
	case "monthly":
		return &MonthlyReport{}, nil
	default:
		return nil, fmt.Errorf("periode '%s' tidak valid (daily/weekly/monthly)", period)
	}
}

// buildReport adalah helper internal yang melakukan query ke DB
// dan menghitung total income/expense/balance.
func buildReport(tenantID, period string, since time.Time, db *gorm.DB) (ReportData, error) {
	type Row struct {
		Type  string
		Total float64
	}
	var rows []Row
	db.Raw(`
		SELECT type, COALESCE(SUM(amount), 0) AS total
		FROM transactions
		WHERE tenant_id = ? AND created_at >= ?
		GROUP BY type
	`, tenantID, since).Scan(&rows)

	income, expense := 0.0, 0.0
	for _, r := range rows {
		if r.Type == "income" {
			income = r.Total
		} else {
			expense = r.Total
		}
	}

	// Ambil detail transaksi
	var txRows []map[string]interface{}
	db.Raw(`
		SELECT id, type, category, description, amount, created_at
		FROM transactions
		WHERE tenant_id = ? AND created_at >= ?
		ORDER BY created_at DESC
	`, tenantID, since).Scan(&txRows)

	txList := make([]interface{}, len(txRows))
	for i, t := range txRows {
		txList[i] = t
	}

	data := ReportData{
		Period:       period,
		TotalIncome:  income,
		TotalExpense: expense,
		Balance:      income - expense,
		Transactions: txList,
		GeneratedAt:  time.Now(),
	}
	return data, nil
}

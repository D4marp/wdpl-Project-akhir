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

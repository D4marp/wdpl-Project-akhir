package patterns_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"umkm-finance-backend/internal/patterns"
)

func TestTransactionFactory_Income(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, err := f.Create("income", "Penjualan", "Penjualan hari ini", "tenant-001", 100000)
	require.NoError(t, err)
	assert.Equal(t, "income", tx.GetType())
	assert.Equal(t, "Penjualan", tx.GetCategory())
	assert.Equal(t, 100000.0, tx.GetAmount())
	assert.NoError(t, tx.Validate())
}

func TestTransactionFactory_Expense(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, err := f.Create("expense", "Bahan Baku", "Beli tepung", "tenant-001", 50000)
	require.NoError(t, err)
	assert.Equal(t, "expense", tx.GetType())
	assert.Equal(t, "Bahan Baku", tx.GetCategory())
	assert.NoError(t, tx.Validate())
}

func TestTransactionFactory_UnknownType(t *testing.T) {
	f := &patterns.TransactionFactory{}
	_, err := f.Create("transfer", "Kategori", "Deskripsi", "tenant-001", 100000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "tidak dikenal")
}

func TestTransactionFactory_ValidateAmount(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, err := f.Create("income", "Penjualan", "Deskripsi", "tenant-001", -1)
	require.NoError(t, err)
	err = tx.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "lebih dari 0")
}

func TestTransactionFactory_ValidateCategory(t *testing.T) {
	f := &patterns.TransactionFactory{}
	tx, err := f.Create("income", "", "Deskripsi", "tenant-001", 100000)
	require.NoError(t, err)
	err = tx.Validate()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "kategori")
}

func TestReportFactory_ValidPeriods(t *testing.T) {
	f := &patterns.ReportFactory{}
	for _, period := range []string{"daily", "weekly", "monthly"} {
		r, err := f.Create(period)
		require.NoError(t, err, "period %s should be valid", period)
		assert.Equal(t, period, r.GetPeriod())
	}
}

func TestReportFactory_InvalidPeriod(t *testing.T) {
	f := &patterns.ReportFactory{}
	_, err := f.Create("yearly")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "tidak valid")
}

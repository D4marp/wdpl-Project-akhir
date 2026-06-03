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
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var txs []models.Transaction
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
	type Row struct {
		Type  string
		Total float64
	}
	var rows []Row
	h.db.Raw(`
		SELECT type, COALESCE(SUM(amount), 0) AS total
		FROM transactions WHERE tenant_id = ? GROUP BY type
	`, tenantID).Scan(&rows)

	income, expense := 0.0, 0.0
	for _, r := range rows {
		if r.Type == "income" {
			income = r.Total
		} else {
			expense = r.Total
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"income": income, "expense": expense, "balance": income - expense},
	})
}

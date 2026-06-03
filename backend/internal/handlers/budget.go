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
		TenantID:    tenantID,
		Category:    body.Category,
		LimitAmount: body.LimitAmount,
		CreatedAt:   time.Now(),
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

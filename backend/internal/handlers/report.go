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

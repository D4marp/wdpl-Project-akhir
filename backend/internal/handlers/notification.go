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

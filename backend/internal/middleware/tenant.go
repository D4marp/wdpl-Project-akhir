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

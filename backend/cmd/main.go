package main

import (
	"fmt"
	"log"
	"umkm-finance-backend/internal/config"
	"umkm-finance-backend/internal/database"
	"umkm-finance-backend/internal/handlers"
	"umkm-finance-backend/internal/middleware"
	"umkm-finance-backend/internal/patterns"
	"umkm-finance-backend/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	gin.SetMode(cfg.GinMode)

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Gagal koneksi database: %v", err)
	}

	// Inisialisasi Factory Pattern
	txFactory := &patterns.TransactionFactory{}
	reportFactory := &patterns.ReportFactory{}

	// Inisialisasi Observer Pattern (EventBus + semua Observer)
	eventBus := patterns.NewTransactionEventBus(db)

	// Inisialisasi Service
	txService := services.NewTransactionService(db, txFactory, eventBus)

	// Inisialisasi Handler
	txHandler := handlers.NewTransactionHandler(txService, db)
	reportHandler := handlers.NewReportHandler(reportFactory, db)
	budgetHandler := handlers.NewBudgetHandler(db)
	notifHandler := handlers.NewNotificationHandler(db)

	r := gin.Default()
	r.Use(corsMiddleware())

	// Health check (tidak perlu tenant ID)
	r.GET("/health", handlers.HealthCheck)

	// Semua route API wajib punya X-Tenant-ID
	api := r.Group("/api", middleware.RequireTenantID())
	{
		api.POST("/transactions", txHandler.Create)
		api.GET("/transactions", txHandler.List)
		api.GET("/transactions/summary", txHandler.Summary)
		api.GET("/reports", reportHandler.Generate)
		api.POST("/budgets", budgetHandler.Create)
		api.GET("/budgets", budgetHandler.List)
		api.GET("/notifications", notifHandler.List)
	}

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Server jalan di %s (mode: %s)", addr, cfg.GinMode)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Server gagal: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

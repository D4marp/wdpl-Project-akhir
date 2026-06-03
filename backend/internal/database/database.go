package database

import (
	"fmt"
	"log"
	"umkm-finance-backend/internal/config"
	"umkm-finance-backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName,
	)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("buka koneksi DB gagal: %w", err)
	}

	// Auto-migrate: buat tabel yang belum ada, tambah kolom baru
	if err := db.AutoMigrate(
		&models.Tenant{},
		&models.Transaction{},
		&models.Budget{},
		&models.Notification{},
	); err != nil {
		return nil, fmt.Errorf("auto-migrate gagal: %w", err)
	}

	// Seed tenant default jika belum ada
	var count int64
	db.Model(&models.Tenant{}).Count(&count)
	if count == 0 {
		db.Create(&models.Tenant{ID: "tenant-001", Name: "Toko Maju Jaya"})
		log.Println("[DB] Seed tenant-001 selesai")
	}
	return db, nil
}

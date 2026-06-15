package models

import "time"

type Tenant struct {
	ID        string    `gorm:"primaryKey"       json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Transaction struct {
	ID          uint      `gorm:"primaryKey;autoIncrement"         json:"id"`
	TenantID    string    `gorm:"type:varchar(191);index:idx_tenant_date" json:"tenant_id"`
	Type        string    `json:"type"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	CreatedAt   time.Time `gorm:"index:idx_tenant_date"            json:"created_at"`
}

type Budget struct {
	ID          uint      `gorm:"primaryKey;autoIncrement"             json:"id"`
	TenantID    string    `gorm:"type:varchar(191);uniqueIndex:uq_tenant_cat" json:"tenant_id"`
	Category    string    `gorm:"type:varchar(191);uniqueIndex:uq_tenant_cat" json:"category"`
	LimitAmount float64   `json:"limit_amount"`
	SpentAmount float64   `json:"spent_amount"`
	CreatedAt   time.Time `json:"created_at"`
}

type Notification struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TenantID  string    `gorm:"type:varchar(191);index"  json:"tenant_id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // info | warning
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

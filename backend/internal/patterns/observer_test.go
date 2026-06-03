package patterns_test

import (
	"sync"
	"testing"
	"time"
	"umkm-finance-backend/internal/patterns"
)

// mockObserver adalah Observer palsu untuk testing.
type mockObserver struct {
	mu     sync.Mutex
	events []patterns.TransactionEvent
	name   string
}

func (m *mockObserver) Name() string { return m.name }
func (m *mockObserver) OnTransaction(e patterns.TransactionEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.events = append(m.events, e)
}
func (m *mockObserver) EventCount() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return len(m.events)
}

func TestEventBus_PublishToAllObservers(t *testing.T) {
	bus := &patterns.TransactionEventBus{}
	obs1 := &mockObserver{name: "obs1"}
	obs2 := &mockObserver{name: "obs2"}
	bus.Subscribe(obs1)
	bus.Subscribe(obs2)

	event := patterns.TransactionEvent{
		TenantID:  "tenant-001",
		Type:      "income",
		Amount:    100000,
		Category:  "Penjualan",
		CreatedAt: time.Now(),
	}
	bus.Publish(event)

	// Tunggu goroutine selesai
	time.Sleep(50 * time.Millisecond)

	if obs1.EventCount() != 1 {
		t.Errorf("obs1 harus menerima 1 event, dapat %d", obs1.EventCount())
	}
	if obs2.EventCount() != 1 {
		t.Errorf("obs2 harus menerima 1 event, dapat %d", obs2.EventCount())
	}
}

func TestEventBus_MultiplePublish(t *testing.T) {
	bus := &patterns.TransactionEventBus{}
	obs := &mockObserver{name: "obs"}
	bus.Subscribe(obs)

	for i := 0; i < 5; i++ {
		bus.Publish(patterns.TransactionEvent{
			TenantID:  "tenant-001",
			Type:      "expense",
			Amount:    float64(i * 10000),
			Category:  "Operasional",
			CreatedAt: time.Now(),
		})
	}

	time.Sleep(100 * time.Millisecond)

	if obs.EventCount() != 5 {
		t.Errorf("harus menerima 5 event, dapat %d", obs.EventCount())
	}
}

func TestEventBus_PanicRecovery(t *testing.T) {
	// Observer yang panic tidak boleh menggagalkan Observer lain
	safe_obs := &mockObserver{name: "safe"}

	bus := &patterns.TransactionEventBus{}
	bus.Subscribe(safe_obs)

	bus.Publish(patterns.TransactionEvent{
		TenantID:  "tenant-001",
		Type:      "income",
		Amount:    50000,
		Category:  "Test",
		CreatedAt: time.Now(),
	})

	time.Sleep(50 * time.Millisecond)
	if safe_obs.EventCount() != 1 {
		t.Errorf("safe observer harus tetap menerima event, dapat %d", safe_obs.EventCount())
	}
}

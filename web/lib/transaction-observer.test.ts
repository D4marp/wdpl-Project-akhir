import {
  TransactionSubject,
  type TransactionCreatedEvent,
  type TransactionObserver,
} from "./transaction-observer";

const event: TransactionCreatedEvent = {
  transaction: {
    id: 1,
    type: "income",
    category: "Penjualan",
    description: "Tunai",
    amount: 120000,
    created_at: "2026-06-16T00:00:00Z",
  },
  payload: {
    type: "income",
    category: "Penjualan",
    description: "Tunai",
    amount: 120000,
  },
  occurredAt: new Date("2026-06-16T00:00:00Z"),
};

describe("TransactionSubject", () => {
  it("notifies every subscribed observer with the transaction created event", async () => {
    const subject = new TransactionSubject();
    const first = vi.fn();
    const second = vi.fn();

    subject.subscribe({ name: "first", onTransactionCreated: first });
    subject.subscribe({ name: "second", onTransactionCreated: second });

    await subject.notifyTransactionCreated(event);

    expect(first).toHaveBeenCalledWith(event);
    expect(second).toHaveBeenCalledWith(event);
  });

  it("does not notify an observer after it is unsubscribed", async () => {
    const subject = new TransactionSubject();
    const listener = vi.fn();
    const observer: TransactionObserver = {
      name: "history",
      onTransactionCreated: listener,
    };

    subject.subscribe(observer);
    subject.unsubscribe(observer);

    await subject.notifyTransactionCreated(event);

    expect(listener).not.toHaveBeenCalled();
  });

  it("continues notifying later observers when one observer fails", async () => {
    const subject = new TransactionSubject();
    const safeObserver = vi.fn();

    subject.subscribe({
      name: "broken",
      onTransactionCreated: () => {
        throw new Error("observer failed");
      },
    });
    subject.subscribe({ name: "safe", onTransactionCreated: safeObserver });

    await expect(subject.notifyTransactionCreated(event)).resolves.toEqual([
      { name: "broken", ok: false, error: expect.any(Error) },
      { name: "safe", ok: true },
    ]);
    expect(safeObserver).toHaveBeenCalledWith(event);
  });
});

import type { Transaction } from "@/lib/api";

export type CreateTransactionPayload = Omit<Transaction, "id" | "created_at">;

export type TransactionCreatedEvent = {
  transaction: Transaction;
  payload: CreateTransactionPayload;
  occurredAt: Date;
};

export type TransactionObserver = {
  name: string;
  onTransactionCreated: (event: TransactionCreatedEvent) => void | Promise<void>;
};

export type ObserverResult =
  | { name: string; ok: true }
  | { name: string; ok: false; error: unknown };

export class TransactionSubject {
  private observers = new Set<TransactionObserver>();

  subscribe(observer: TransactionObserver) {
    this.observers.add(observer);
  }

  unsubscribe(observer: TransactionObserver) {
    this.observers.delete(observer);
  }

  async notifyTransactionCreated(event: TransactionCreatedEvent): Promise<ObserverResult[]> {
    const results: ObserverResult[] = [];

    for (const observer of Array.from(this.observers)) {
      try {
        await observer.onTransactionCreated(event);
        results.push({ name: observer.name, ok: true });
      } catch (error) {
        results.push({ name: observer.name, ok: false, error });
      }
    }

    return results;
  }
}

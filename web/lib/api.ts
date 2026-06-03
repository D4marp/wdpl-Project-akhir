const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "tenant-001";

const h = { "Content-Type": "application/json", "X-Tenant-ID": TENANT };

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: h });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request gagal");
  }
  return res.json();
}

export type Summary = { income: number; expense: number; balance: number };
export type Transaction = {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: number;
  created_at: string;
};
export type Budget = {
  id: number;
  category: string;
  limit_amount: number;
  spent_amount: number;
};
export type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
};
export type ReportData = {
  period: string;
  total_income: number;
  total_expense: number;
  balance: number;
  transactions: Transaction[];
  generated_at: string;
};
export type ListResp<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export const api = {
  getSummary: () =>
    req<{ data: Summary }>("/api/transactions/summary").then((r) => r.data),
  getTransactions: (page = 1, limit = 20) =>
    req<ListResp<Transaction>>(`/api/transactions?page=${page}&limit=${limit}`),
  createTransaction: (body: Omit<Transaction, "id" | "created_at">) =>
    req<{ message: string; data: Transaction }>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getReport: (period = "monthly") =>
    req<{ data: ReportData }>(`/api/reports?period=${period}`).then(
      (r) => r.data
    ),
  getBudgets: () =>
    req<{ data: Budget[] }>("/api/budgets").then((r) => r.data),
  getNotifications: () =>
    req<{ data: Notification[] }>("/api/notifications").then((r) => r.data),
};

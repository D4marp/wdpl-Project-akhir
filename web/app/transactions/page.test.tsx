import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsPage from "./page";
import { toast } from "sonner";

const getTransactions = vi.fn();
const createTransaction = vi.fn();
const getNotifications = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    getTransactions: (...args: unknown[]) => getTransactions(...args),
    createTransaction: (...args: unknown[]) => createTransaction(...args),
    getNotifications: (...args: unknown[]) => getNotifications(...args),
  },
}));

vi.mock("@/components/TransactionItem", () => ({
  TransactionItem: ({ tx }: { tx: { id: number; category: string } }) => (
    <li>{tx.category}</li>
  ),
}));

vi.mock("@/components/Skeleton", () => ({
  SkeletonRow: () => <li>loading</li>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TransactionsPage toast flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTransactions.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 15,
    });
    getNotifications.mockResolvedValue([]);
  });

  async function fillForm() {
    await userEvent.type(
      screen.getByPlaceholderText(/penjualan, bahan baku/i),
      "Penjualan"
    );
    await userEvent.type(screen.getByPlaceholderText(/^0$/i), "120000");
    await userEvent.click(
      screen.getByRole("button", { name: /simpan transaksi/i })
    );
  }

  async function fillExpenseForm() {
    await userEvent.click(screen.getByRole("button", { name: "Pengeluaran" }));
    await userEvent.type(
      screen.getByPlaceholderText(/penjualan, bahan baku/i),
      "Bahan Baku"
    );
    await userEvent.type(screen.getByPlaceholderText(/^0$/i), "50000");
    await userEvent.click(
      screen.getByRole("button", { name: /simpan transaksi/i })
    );
  }

  it("shows success toast after transaction saved", async () => {
    createTransaction.mockResolvedValue({
      message: "Transaksi berhasil disimpan",
      data: {
        id: 1,
        type: "income",
        category: "Penjualan",
        description: "Tunai",
        amount: 120000,
        created_at: "2026-06-16T00:00:00Z",
      },
    });

    render(<TransactionsPage />);

    await waitFor(() => expect(getTransactions).toHaveBeenCalled());
    await fillForm();

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalledWith({
        type: "income",
        category: "Penjualan",
        description: "",
        amount: 120000,
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Transaksi berhasil disimpan");
    });

    await waitFor(() => {
      expect(getTransactions).toHaveBeenLastCalledWith(1, 15);
      expect(getNotifications).toHaveBeenCalledTimes(1);
    });
  });

  it("shows error toast when API submit fails", async () => {
    createTransaction.mockRejectedValue(new Error("amount harus lebih dari 0"));

    render(<TransactionsPage />);

    await waitFor(() => expect(getTransactions).toHaveBeenCalled());
    await fillForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("amount harus lebih dari 0");
    });

    expect(getNotifications).not.toHaveBeenCalled();
  });

  it("creates an expense transaction through the transaction factory", async () => {
    createTransaction.mockResolvedValue({
      message: "Transaksi berhasil disimpan",
      data: {
        id: 2,
        type: "expense",
        category: "Bahan Baku",
        description: "",
        amount: 50000,
        created_at: "2026-06-16T00:00:00Z",
      },
    });

    render(<TransactionsPage />);

    await waitFor(() => expect(getTransactions).toHaveBeenCalled());
    await fillExpenseForm();

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalledWith({
        type: "expense",
        category: "Bahan Baku",
        description: "",
        amount: 50000,
      });
    });
  });

  it("shows factory validation error without calling the API", async () => {
    render(<TransactionsPage />);

    await waitFor(() => expect(getTransactions).toHaveBeenCalled());
    await userEvent.type(
      screen.getByPlaceholderText(/penjualan, bahan baku/i),
      "Penjualan"
    );
    fireEvent.change(screen.getByPlaceholderText(/^0$/i), {
      target: { value: "0" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /simpan transaksi/i }).closest("form")!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("amount harus lebih dari 0");
    });
    expect(createTransaction).not.toHaveBeenCalled();
    expect(getNotifications).not.toHaveBeenCalled();
  });
});

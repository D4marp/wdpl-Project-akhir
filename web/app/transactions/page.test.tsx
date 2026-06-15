import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsPage from "./page";
import { toast } from "sonner";

const getTransactions = vi.fn();
const createTransaction = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    getTransactions: (...args: unknown[]) => getTransactions(...args),
    createTransaction: (...args: unknown[]) => createTransaction(...args),
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
  });

  it("shows error toast when API submit fails", async () => {
    createTransaction.mockRejectedValue(new Error("amount harus lebih dari 0"));

    render(<TransactionsPage />);

    await waitFor(() => expect(getTransactions).toHaveBeenCalled());
    await fillForm();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("amount harus lebih dari 0");
    });
  });
});

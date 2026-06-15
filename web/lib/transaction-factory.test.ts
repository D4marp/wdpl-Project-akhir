import {
  TransactionFactory,
  getTransactionPresentation,
  type TransactionFormInput,
} from "./transaction-factory";

describe("TransactionFactory", () => {
  const factory = new TransactionFactory();

  it("creates an income transaction payload from form input", () => {
    const product = factory.create({
      type: "income",
      category: " Penjualan ",
      description: " Tunai ",
      amount: "120000",
    });

    product.validate();

    expect(product.getPayload()).toEqual({
      type: "income",
      category: "Penjualan",
      description: "Tunai",
      amount: 120000,
    });
    expect(product.getLabel()).toBe("Pemasukan");
    expect(product.getBadgeVariant()).toBe("secondary");
  });

  it("creates an expense transaction payload from form input", () => {
    const product = factory.create({
      type: "expense",
      category: " Bahan Baku ",
      description: " Tepung ",
      amount: "50000",
    });

    product.validate();

    expect(product.getPayload()).toEqual({
      type: "expense",
      category: "Bahan Baku",
      description: "Tepung",
      amount: 50000,
    });
    expect(product.getLabel()).toBe("Pengeluaran");
    expect(product.getBadgeVariant()).toBe("outline");
  });

  it("rejects empty category", () => {
    const product = factory.create({
      type: "income",
      category: " ",
      description: "",
      amount: "1000",
    });

    expect(() => product.validate()).toThrow("kategori tidak boleh kosong");
  });

  it.each(["0", "-1", "abc"])("rejects invalid amount %s", (amount) => {
    const product = factory.create({
      type: "expense",
      category: "Bahan Baku",
      description: "",
      amount,
    });

    expect(() => product.validate()).toThrow("amount harus lebih dari 0");
  });

  it("rejects unknown transaction type", () => {
    expect(() =>
      factory.create({
        type: "transfer",
        category: "Kas",
        description: "",
        amount: "1000",
      } as TransactionFormInput)
    ).toThrow("tipe transaksi 'transfer' tidak dikenal");
  });

  it("returns presentation metadata by transaction type", () => {
    expect(getTransactionPresentation("income")).toEqual({
      label: "Pemasukan",
      badgeVariant: "secondary",
    });
    expect(getTransactionPresentation("expense")).toEqual({
      label: "Pengeluaran",
      badgeVariant: "outline",
    });
  });
});

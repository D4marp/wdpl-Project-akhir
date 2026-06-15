import type { CreateTransactionPayload } from "@/lib/transaction-observer";

export type TransactionType = "income" | "expense";

export type TransactionFormInput = {
  type: TransactionType;
  category: string;
  description: string;
  amount: string;
};

type BadgeVariant = "secondary" | "outline";

type TransactionPresentation = {
  label: string;
  badgeVariant: BadgeVariant;
};

export type TransactionProduct = {
  validate: () => void;
  getPayload: () => CreateTransactionPayload;
  getLabel: () => string;
  getBadgeVariant: () => BadgeVariant;
};

const presentationByType: Record<TransactionType, TransactionPresentation> = {
  income: { label: "Pemasukan", badgeVariant: "secondary" },
  expense: { label: "Pengeluaran", badgeVariant: "outline" },
};

abstract class BaseTransactionProduct implements TransactionProduct {
  protected constructor(
    protected readonly input: TransactionFormInput,
    private readonly presentation: TransactionPresentation
  ) {}

  validate() {
    if (!this.input.category.trim()) {
      throw new Error("kategori tidak boleh kosong");
    }

    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      throw new Error("amount harus lebih dari 0");
    }
  }

  getPayload(): CreateTransactionPayload {
    return {
      type: this.input.type,
      category: this.input.category.trim(),
      description: this.input.description.trim(),
      amount: this.amount,
    };
  }

  getLabel() {
    return this.presentation.label;
  }

  getBadgeVariant() {
    return this.presentation.badgeVariant;
  }

  private get amount() {
    return Number(this.input.amount);
  }
}

class IncomeTransactionProduct extends BaseTransactionProduct {
  constructor(input: TransactionFormInput) {
    super(input, presentationByType.income);
  }
}

class ExpenseTransactionProduct extends BaseTransactionProduct {
  constructor(input: TransactionFormInput) {
    super(input, presentationByType.expense);
  }
}

export class TransactionFactory {
  create(input: TransactionFormInput): TransactionProduct {
    switch (input.type) {
      case "income":
        return new IncomeTransactionProduct(input);
      case "expense":
        return new ExpenseTransactionProduct(input);
      default:
        throw new Error(`tipe transaksi '${input.type}' tidak dikenal`);
    }
  }
}

export function getTransactionPresentation(type: TransactionType): TransactionPresentation {
  return presentationByType[type];
}

export const transactionFactory = new TransactionFactory();

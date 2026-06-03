const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export function TransactionItem({ tx }: { tx: any }) {
  const isIncome = tx.type === "income";
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm
        ${isIncome ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
      >
        {isIncome ? "↓" : "↑"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {tx.category}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {tx.description || "—"}
        </p>
      </div>
      <span
        className={`text-sm font-semibold ${
          isIncome ? "text-green-600" : "text-red-600"
        }`}
      >
        {isIncome ? "+" : "-"}
        {IDR(tx.amount)}
      </span>
    </li>
  );
}

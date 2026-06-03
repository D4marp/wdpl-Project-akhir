const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const colors: Record<string, string> = {
  blue: "from-blue-600 to-blue-700",
  green: "from-green-500 to-green-600",
  red: "from-red-500 to-red-600",
};

export function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-5 shadow-md`}
    >
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{IDR(value)}</p>
    </div>
  );
}

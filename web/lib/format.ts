export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatShortDateTime = (value: string) =>
  new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const formatChartDate = (value: string) =>
  new Date(value).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
  });

"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { CircleDollarSignIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type ReportData } from "@/lib/api";
import { formatChartDate, formatCurrency } from "@/lib/format";

const chartConfig = {
  income: {
    label: "Pemasukan",
    color: "hsl(var(--chart-2))",
  },
  expense: {
    label: "Pengeluaran",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

function buildCategoryData(report: ReportData | null) {
  if (!report) {
    return [];
  }

  const grouped = new Map<string, { category: string; income: number; expense: number }>();

  for (const tx of report.transactions) {
    const current = grouped.get(tx.category) ?? {
      category: tx.category,
      income: 0,
      expense: 0,
    };

    if (tx.type === "income") {
      current.income += tx.amount;
    } else {
      current.expense += tx.amount;
    }

    grouped.set(tx.category, current);
  }

  return Array.from(grouped.values());
}

function buildTrendData(report: ReportData | null) {
  if (!report) {
    return [];
  }

  const grouped = new Map<string, { date: string; income: number; expense: number }>();

  for (const tx of report.transactions) {
    const date = tx.created_at.slice(0, 10);
    const current = grouped.get(date) ?? { date, income: 0, expense: 0 };

    if (tx.type === "income") {
      current.income += tx.amount;
    } else {
      current.expense += tx.amount;
    }

    grouped.set(date, current);
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getReport(period)
      .then((response) => {
        setReport(response);
        setError("");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [period]);

  const categoryData = useMemo(() => buildCategoryData(report), [report]);
  const trendData = useMemo(() => buildTrendData(report), [report]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden border-blue-500 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 text-primary-foreground shadow-[0_28px_55px_-28px_hsl(226_83%_57%/0.95)]">
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-white/15" />
        <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-300/20" />
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="relative text-primary-foreground">Laporan keuangan</CardTitle>
            <CardDescription className="relative text-primary-foreground/80">
              Pilih periode dan lihat performa kas dalam visual yang lebih ringan.
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(value) => value && setPeriod(value)}>
            <SelectTrigger className="relative w-full border-white/30 bg-white/95 text-foreground md:w-44" aria-label="Pilih periode laporan">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Gagal mengambil laporan</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-40" />
                </CardHeader>
              </Card>
            ))
          : report && [
              { title: "Pemasukan", value: report.total_income, icon: TrendingUpIcon, tone: "from-blue-50 to-white text-blue-700" },
              { title: "Pengeluaran", value: report.total_expense, icon: TrendingDownIcon, tone: "from-slate-50 to-white text-slate-700" },
              { title: "Saldo", value: report.balance, icon: CircleDollarSignIcon, tone: "from-sky-50 to-white text-sky-700" },
            ].map((item) => (
              <Card key={item.title} className={`bg-gradient-to-br ${item.tone}`}>
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription className="text-current/70">{item.title}</CardDescription>
                    <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                      <item.icon className="size-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-semibold tracking-normal text-slate-950">
                    {formatCurrency(item.value)}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-gradient-to-br from-white to-blue-50/35">
          <CardHeader>
            <CardTitle>Komposisi per kategori</CardTitle>
            <CardDescription>Perbandingan pemasukan dan pengeluaran pada kategori aktif.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryData.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada data kategori untuk periode ini.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={categoryData} margin={{ top: 8, left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex min-w-36 items-center justify-between gap-4">
                            <span className="text-muted-foreground">{name}</span>
                            <span className="font-medium text-foreground">{formatCurrency(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="income" fill="var(--color-income)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-sky-50/35">
          <CardHeader>
            <CardTitle>Tren waktu</CardTitle>
            <CardDescription>Perubahan nilai transaksi berdasarkan tanggal pencatatan.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : trendData.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada tren yang bisa ditampilkan.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={trendData} margin={{ top: 8, left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatChartDate}
                  />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => formatChartDate(String(value))}
                        formatter={(value, name) => (
                          <div className="flex min-w-36 items-center justify-between gap-4">
                            <span className="text-muted-foreground">{name}</span>
                            <span className="font-medium text-foreground">{formatCurrency(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="var(--color-expense)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <CardTitle>Detail transaksi periode ini</CardTitle>
            <CardDescription>Daftar transaksi yang membentuk laporan periode ini.</CardDescription>
          </div>
          <Badge variant="secondary">{report?.transactions.length ?? 0} item</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-inner">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : report?.transactions.length ? (
                  report.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "income" ? "secondary" : "outline"}>
                          {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatChartDate(transaction.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Belum ada transaksi pada periode ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


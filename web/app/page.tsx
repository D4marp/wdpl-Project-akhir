"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowRightIcon, TrendingDownIcon, TrendingUpIcon, WalletCardsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type Summary, type Transaction } from "@/lib/api";
import { formatChartDate, formatCurrency, formatShortDateTime } from "@/lib/format";

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

function buildTrendData(transactions: Transaction[]) {
  const grouped = new Map<string, { date: string; income: number; expense: number }>();

  for (const tx of transactions) {
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

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSummary(), api.getTransactions(1, 12)])
      .then(([summaryData, transactionData]) => {
        setSummary(summaryData);
        setTransactions(transactionData.data);
        setError("");
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const trendData = useMemo(() => buildTrendData(transactions), [transactions]);

  const cards = summary
    ? [
        {
          title: "Saldo Bersih",
          value: summary.balance,
          hint: summary.balance >= 0 ? "Posisi kas sehat" : "Perlu kontrol pengeluaran",
          icon: WalletCardsIcon,
        },
        {
          title: "Total Pemasukan",
          value: summary.income,
          hint: "Akumulasi semua pemasukan tercatat",
          icon: TrendingUpIcon,
        },
        {
          title: "Total Pengeluaran",
          value: summary.expense,
          hint: "Akumulasi seluruh biaya operasional",
          icon: TrendingDownIcon,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Backend belum merespons</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))
          : cards.map((card, index) => (
              <Card
                key={card.title}
                className={
                  index === 0
                    ? "relative overflow-hidden border-blue-500 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-primary-foreground shadow-[0_28px_50px_-22px_hsl(226_83%_57%/0.95)] before:absolute before:-right-12 before:-top-12 before:size-36 before:rounded-full before:bg-white/15 after:absolute after:-bottom-16 after:left-12 after:size-40 after:rounded-full after:bg-sky-300/20"
                    : "overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_55px_-36px_hsl(224_70%_45%/0.6)]"
                }
              >
                <CardHeader className="relative h-full gap-4 py-6">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription
                      className={index === 0 ? "text-primary-foreground/80" : "text-muted-foreground"}
                    >
                      {card.title}
                    </CardDescription>
                    <div
                      className={
                        index === 0
                          ? "rounded-2xl bg-white/20 p-2.5 text-primary-foreground shadow-inner"
                          : "rounded-2xl bg-blue-50 p-2.5 text-primary"
                      }
                    >
                      <card.icon className="size-4" />
                    </div>
                  </div>
                  <CardTitle
                    className={
                      index === 0
                        ? "text-3xl font-semibold tracking-normal text-primary-foreground"
                        : "text-3xl font-semibold tracking-normal text-slate-950"
                    }
                  >
                    {formatCurrency(card.value)}
                  </CardTitle>
                  <div
                    className={
                      index === 0
                        ? "mt-auto rounded-2xl bg-white/15 px-3 py-2 text-sm text-primary-foreground/90"
                        : "mt-auto rounded-2xl bg-blue-50 px-3 py-2 text-sm text-muted-foreground"
                    }
                  >
                    {card.hint}
                  </div>
                </CardHeader>
              </Card>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="bg-gradient-to-br from-white to-blue-50/35">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <CardTitle>Arus kas terbaru</CardTitle>
              <CardDescription>
                Ringkasan pergerakan pemasukan dan pengeluaran terbaru.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/reports" />}>
              Lihat laporan
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : trendData.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada transaksi untuk divisualkan.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={trendData} margin={{ left: 8, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="url(#fillIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="var(--color-expense)" fill="url(#fillExpense)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 pb-4">
            <div className="space-y-1">
              <CardTitle>Transaksi terbaru</CardTitle>
              <CardDescription>Mutasi terakhir yang perlu cepat dipantau.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/transactions" />}>
              Semua
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada transaksi tercatat.
              </div>
            ) : (
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
                    {transactions.slice(0, 6).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{transaction.category}</div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.description || "Tanpa keterangan"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.type === "income" ? "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"}>
                            {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </TableCell>
                        <TableCell>{formatShortDateTime(transaction.created_at)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


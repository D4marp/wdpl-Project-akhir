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
  CardFooter,
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
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-4 w-full" />
                </CardFooter>
              </Card>
            ))
          : cards.map((card) => (
              <Card key={card.title} className="overflow-hidden border-border/70">
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription>{card.title}</CardDescription>
                    <div className="rounded-full border border-border/70 bg-muted p-2 text-muted-foreground">
                      <card.icon className="size-4" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-semibold tracking-tight">
                    {formatCurrency(card.value)}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="border-t bg-muted/30 py-3 text-sm text-muted-foreground">
                  {card.hint}
                </CardFooter>
              </Card>
            ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <CardTitle>Arus kas terbaru</CardTitle>
              <CardDescription>
                Dibangun dari transaksi terbaru yang diambil dari endpoint backend.
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Transaksi terbaru</CardTitle>
              <CardDescription>Snapshot cepat dari mutasi kas terakhir.</CardDescription>
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
              <div className="overflow-hidden rounded-lg border">
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
                          <div className="font-medium">{transaction.category}</div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.description || "Tanpa keterangan"}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}</TableCell>
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


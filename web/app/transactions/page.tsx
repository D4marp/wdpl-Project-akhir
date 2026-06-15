"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftIcon, ArrowRightIcon, CircleDollarSignIcon, ReceiptTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api, type Transaction } from "@/lib/api";
import { formatCurrency, formatShortDateTime } from "@/lib/format";
import {
  getTransactionPresentation,
  transactionFactory,
  type TransactionFormInput,
} from "@/lib/transaction-factory";
import {
  TransactionSubject,
} from "@/lib/transaction-observer";

const LIMIT = 15;

const defaultForm: TransactionFormInput = {
  type: "income",
  category: "",
  description: "",
  amount: "",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TransactionFormInput>(defaultForm);

  const loadTransactions = (targetPage: number) => {
    setLoading(true);
    api
      .getTransactions(targetPage, LIMIT)
      .then((response) => {
        setTransactions(response.data);
        setTotal(response.total);
        setError("");
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions(page);
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const product = transactionFactory.create(form);
      product.validate();
      const payload = product.getPayload();
      const response = await api.createTransaction(payload);
      const subject = new TransactionSubject();

      subject.subscribe({
        name: "history-observer",
        onTransactionCreated: () => {
          setPage(1);
          loadTransactions(1);
        },
      });
      subject.subscribe({
        name: "notification-observer",
        onTransactionCreated: async () => {
          await api.getNotifications();
        },
      });
      subject.subscribe({
        name: "form-observer",
        onTransactionCreated: () => setForm(defaultForm),
      });
      subject.subscribe({
        name: "toast-observer",
        onTransactionCreated: () => {
          toast.success("Transaksi berhasil disimpan");
        },
      });

      await subject.notifyTransactionCreated({
        transaction: response.data,
        payload,
        occurredAt: new Date(),
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Gagal menyimpan transaksi";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ReceiptTextIcon className="size-4" />
            <span className="text-sm font-medium">Input transaksi</span>
          </div>
          <CardTitle>Catat pemasukan & pengeluaran</CardTitle>
          <CardDescription>
            Toast Sonner hanya muncul pada hasil submit transaksi, sesuai permintaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transaction-type">Jenis transaksi</Label>
              <ToggleGroup
                id="transaction-type"
                multiple={false}
                value={[form.type]}
                onValueChange={(value) => {
                  const nextType = value[0] as TransactionFormInput["type"] | undefined;
                  if (nextType) {
                    setForm((current) => ({ ...current, type: nextType }));
                  }
                }}
                className="grid w-full grid-cols-2"
              >
                <ToggleGroupItem value="income">Pemasukan</ToggleGroupItem>
                <ToggleGroupItem value="expense">Pengeluaran</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                placeholder="misal: Penjualan, Bahan Baku"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Keterangan</Label>
              <Input
                id="description"
                placeholder="Opsional"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Nominal (Rp)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="0"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                required
              />
            </div>

            <Button type="submit" size="lg" disabled={saving}>
              <CircleDollarSignIcon data-icon="inline-start" />
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Riwayat transaksi</CardTitle>
            <CardDescription>
              Data ini tetap berasal dari endpoint backend `GET /api/transactions`.
            </CardDescription>
          </div>
          <Badge variant="secondary">{total} transaksi</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

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
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Belum ada data transaksi.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">{transaction.category}</div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.description || "Tanpa keterangan"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTransactionPresentation(transaction.type as TransactionFormInput["type"]).badgeVariant}>
                          {getTransactionPresentation(transaction.type as TransactionFormInput["type"]).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatShortDateTime(transaction.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={page === 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Sebelumnya
            </Button>
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
            <Button
              variant="outline"
              disabled={page === totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Selanjutnya
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

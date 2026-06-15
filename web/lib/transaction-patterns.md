# Observer dan Factory Pattern pada Web Transactions

Dokumen ini menjelaskan dua design pattern yang dipakai pada layer web untuk halaman Transactions:

- `transaction-observer.ts`: mengatur efek samping setelah transaksi berhasil dibuat.
- `transaction-factory.ts`: membuat objek/payload transaksi berdasarkan tipe transaksi.

Keduanya bekerja berurutan pada flow submit transaksi:

```txt
User submit form transaksi
        |
        v
TransactionFactory membuat product income/expense
        |
        v
Product validasi input dan membuat payload API
        |
        v
api.createTransaction(payload)
        |
        v
TransactionSubject notify observer setelah transaksi berhasil
        |
        v
Observer refresh riwayat, refresh notifikasi, reset form, tampilkan toast
```

## 1. Factory Pattern

Factory Pattern adalah pola untuk memusatkan proses pembuatan objek. Komponen pemakai tidak perlu tahu detail class/product yang dibuat. Pemakai cukup memberi input, lalu factory memilih product yang tepat.

Pada web ini, Factory Pattern dipakai di `web/lib/transaction-factory.ts` karena halaman Transactions punya dua jenis transaksi:

- `income` untuk pemasukan.
- `expense` untuk pengeluaran.

Tanpa factory, halaman `transactions/page.tsx` harus terus menyimpan banyak logic seperti:

```ts
if (form.type === "income") {
  // buat payload pemasukan
} else {
  // buat payload pengeluaran
}
```

Dengan factory, logic pembuatan payload, validasi, label UI, dan badge UI dipindahkan ke satu tempat.

### Struktur Factory

File `transaction-factory.ts` memiliki beberapa bagian penting:

```ts
export type TransactionType = "income" | "expense";
```

`TransactionType` membatasi tipe transaksi yang valid di web.

```ts
export type TransactionFormInput = {
  type: TransactionType;
  category: string;
  description: string;
  amount: string;
};
```

`TransactionFormInput` adalah bentuk data mentah dari form. Nilai `amount` masih string karena berasal dari input HTML.

```ts
export type TransactionProduct = {
  validate: () => void;
  getPayload: () => CreateTransactionPayload;
  getLabel: () => string;
  getBadgeVariant: () => BadgeVariant;
};
```

`TransactionProduct` adalah kontrak untuk semua product transaksi. Product harus bisa:

- memvalidasi input lewat `validate()`;
- membuat payload API lewat `getPayload()`;
- memberi label UI lewat `getLabel()`;
- memberi variant badge UI lewat `getBadgeVariant()`.

### Product Income dan Expense

Factory membuat salah satu product berikut:

```ts
class IncomeTransactionProduct extends BaseTransactionProduct {
  constructor(input: TransactionFormInput) {
    super(input, presentationByType.income);
  }
}
```

```ts
class ExpenseTransactionProduct extends BaseTransactionProduct {
  constructor(input: TransactionFormInput) {
    super(input, presentationByType.expense);
  }
}
```

Keduanya memakai base class yang sama karena saat ini aturan validasi dan pembuatan payload masih sama. Perbedaannya ada pada metadata presentasi:

```ts
const presentationByType = {
  income: { label: "Pemasukan", badgeVariant: "secondary" },
  expense: { label: "Pengeluaran", badgeVariant: "outline" },
};
```

Jika nanti aturan `income` dan `expense` berbeda, masing-masing product bisa override logic sendiri tanpa mengubah halaman Transactions.

### Cara Factory Membuat Product

Factory memilih product berdasarkan `input.type`:

```ts
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
```

Ini adalah inti Factory Pattern: pemakai memanggil `create`, lalu factory menentukan product yang sesuai.

### Contoh Pemakaian Factory

Contoh membuat payload transaksi pemasukan:

```ts
import { transactionFactory } from "@/lib/transaction-factory";

const product = transactionFactory.create({
  type: "income",
  category: " Penjualan ",
  description: " Tunai ",
  amount: "120000",
});

product.validate();

const payload = product.getPayload();
```

Hasil `payload`:

```ts
{
  type: "income",
  category: "Penjualan",
  description: "Tunai",
  amount: 120000,
}
```

Contoh membuat payload transaksi pengeluaran:

```ts
const product = transactionFactory.create({
  type: "expense",
  category: " Bahan Baku ",
  description: " Tepung ",
  amount: "50000",
});

product.validate();

const payload = product.getPayload();
```

Hasil `payload`:

```ts
{
  type: "expense",
  category: "Bahan Baku",
  description: "Tepung",
  amount: 50000,
}
```

### Validasi di Factory

Factory product memvalidasi dua hal penting:

```ts
if (!this.input.category.trim()) {
  throw new Error("kategori tidak boleh kosong");
}
```

Kategori tidak boleh kosong.

```ts
if (!Number.isFinite(this.amount) || this.amount <= 0) {
  throw new Error("amount harus lebih dari 0");
}
```

Nominal harus berupa angka valid dan lebih dari 0.

Validasi ini adalah validasi frontend. Backend tetap menjadi source of truth dan tetap melakukan validasi final.

### Penggunaan Factory di Transactions Page

Di halaman `transactions/page.tsx`, submit form tidak lagi membuat payload manual. Flow-nya menjadi:

```ts
const product = transactionFactory.create(form);
product.validate();
const payload = product.getPayload();
const response = await api.createTransaction(payload);
```

Keuntungannya:

- logic payload tidak tersebar di komponen React;
- validasi lebih mudah dites;
- label dan badge transaksi punya satu sumber data;
- jika tipe transaksi baru ditambah, perubahan utama ada di factory.

## 2. Observer Pattern

Observer Pattern adalah pola untuk membuat satu object utama memberi tahu banyak object lain saat sebuah event terjadi.

Pada web ini, Observer Pattern dipakai di `web/lib/transaction-observer.ts`. Event yang dipakai adalah transaksi berhasil dibuat.

Tujuannya adalah agar halaman Transactions tidak menaruh semua efek samping langsung di fungsi submit. Efek seperti refresh riwayat, refresh notifikasi, reset form, dan toast sukses dipisahkan menjadi observer.

### Struktur Observer

File `transaction-observer.ts` memiliki beberapa bagian penting:

```ts
export type CreateTransactionPayload = Omit<Transaction, "id" | "created_at">;
```

`CreateTransactionPayload` adalah data yang dikirim ke API saat membuat transaksi. Field `id` dan `created_at` tidak dikirim karena dibuat oleh backend.

```ts
export type TransactionCreatedEvent = {
  transaction: Transaction;
  payload: CreateTransactionPayload;
  occurredAt: Date;
};
```

`TransactionCreatedEvent` adalah data event yang dikirim ke semua observer. Event ini berisi:

- `transaction`: data transaksi hasil response backend;
- `payload`: payload yang dipakai saat request create;
- `occurredAt`: waktu event dibuat di frontend.

```ts
export type TransactionObserver = {
  name: string;
  onTransactionCreated: (event: TransactionCreatedEvent) => void | Promise<void>;
};
```

`TransactionObserver` adalah kontrak untuk semua observer. Setiap observer wajib punya:

- `name` untuk identitas observer;
- `onTransactionCreated` sebagai fungsi yang dijalankan saat transaksi berhasil dibuat.

### Subject sebagai Publisher

Subject adalah object yang menyimpan daftar observer dan memberi tahu mereka saat event terjadi.

```ts
export class TransactionSubject {
  private observers = new Set<TransactionObserver>();

  subscribe(observer: TransactionObserver) {
    this.observers.add(observer);
  }

  unsubscribe(observer: TransactionObserver) {
    this.observers.delete(observer);
  }

  async notifyTransactionCreated(event: TransactionCreatedEvent): Promise<ObserverResult[]> {
    const results: ObserverResult[] = [];

    for (const observer of Array.from(this.observers)) {
      try {
        await observer.onTransactionCreated(event);
        results.push({ name: observer.name, ok: true });
      } catch (error) {
        results.push({ name: observer.name, ok: false, error });
      }
    }

    return results;
  }
}
```

Ada tiga operasi utama:

- `subscribe`: mendaftarkan observer;
- `unsubscribe`: melepas observer;
- `notifyTransactionCreated`: mengirim event ke semua observer.

### Error Isolation

Observer dijalankan dengan `try/catch` per observer:

```ts
try {
  await observer.onTransactionCreated(event);
  results.push({ name: observer.name, ok: true });
} catch (error) {
  results.push({ name: observer.name, ok: false, error });
}
```

Artinya, jika satu observer gagal, observer berikutnya tetap berjalan. Ini penting karena efek samping tidak boleh saling menjatuhkan.

Contoh: jika refresh notifikasi gagal, reset form dan toast masih bisa tetap berjalan.

### Contoh Observer

Contoh observer untuk refresh riwayat transaksi:

```ts
subject.subscribe({
  name: "history-observer",
  onTransactionCreated: () => {
    setPage(1);
    loadTransactions(1);
  },
});
```

Contoh observer untuk refresh notifikasi:

```ts
subject.subscribe({
  name: "notification-observer",
  onTransactionCreated: async () => {
    await api.getNotifications();
  },
});
```

Contoh observer untuk reset form:

```ts
subject.subscribe({
  name: "form-observer",
  onTransactionCreated: () => setForm(defaultForm),
});
```

Contoh observer untuk toast sukses:

```ts
subject.subscribe({
  name: "toast-observer",
  onTransactionCreated: () => {
    toast.success("Transaksi berhasil disimpan");
  },
});
```

### Penggunaan Observer di Transactions Page

Observer hanya dipanggil setelah API berhasil membuat transaksi:

```ts
const response = await api.createTransaction(payload);

await subject.notifyTransactionCreated({
  transaction: response.data,
  payload,
  occurredAt: new Date(),
});
```

Jika API gagal, event tidak dipublish. Error ditangani langsung oleh submit:

```ts
catch (requestError) {
  const message = requestError instanceof Error
    ? requestError.message
    : "Gagal menyimpan transaksi";
  toast.error(message);
}
```

Ini menjaga aturan penting: observer hanya merespons transaksi yang benar-benar berhasil dibuat.

## 3. Hubungan Factory dan Observer

Factory dan Observer punya tanggung jawab berbeda.

| Pattern | Waktu Dipakai | Tanggung Jawab |
| --- | --- | --- |
| Factory | Sebelum API create transaction | Membuat product, validasi input, membuat payload |
| Observer | Setelah API create transaction sukses | Menjalankan efek samping UI |

Urutan lengkapnya:

```ts
const product = transactionFactory.create(form);
product.validate();

const payload = product.getPayload();
const response = await api.createTransaction(payload);

await subject.notifyTransactionCreated({
  transaction: response.data,
  payload,
  occurredAt: new Date(),
});
```

Dengan desain ini:

- Factory tidak tahu tentang toast, table, notification, atau observer.
- Observer tidak tahu cara payload dibuat.
- Page hanya mengatur flow utama.
- Backend tetap menjadi source of truth untuk penyimpanan dan validasi final.

## 4. Contoh Penambahan Tipe Transaksi Baru

Misalnya nanti ada tipe transaksi baru bernama `transfer`.

Perubahan yang perlu dilakukan:

1. Tambahkan tipe:

```ts
export type TransactionType = "income" | "expense" | "transfer";
```

2. Tambahkan metadata presentasi:

```ts
const presentationByType = {
  income: { label: "Pemasukan", badgeVariant: "secondary" },
  expense: { label: "Pengeluaran", badgeVariant: "outline" },
  transfer: { label: "Transfer", badgeVariant: "outline" },
};
```

3. Buat product baru:

```ts
class TransferTransactionProduct extends BaseTransactionProduct {
  constructor(input: TransactionFormInput) {
    super(input, presentationByType.transfer);
  }
}
```

4. Update factory:

```ts
case "transfer":
  return new TransferTransactionProduct(input);
```

Halaman Transactions tidak perlu menyimpan logic pembuatan payload untuk setiap tipe. Cukup tetap memakai:

```ts
const product = transactionFactory.create(form);
```

## 5. Ringkasan

Factory Pattern menjawab pertanyaan:

> Objek transaksi apa yang harus dibuat dari input form ini?

Observer Pattern menjawab pertanyaan:

> Setelah transaksi berhasil dibuat, siapa saja yang perlu diberi tahu?

Pada web Transactions:

- `transaction-factory.ts` membuat dan memvalidasi transaksi sebelum dikirim ke backend.
- `transaction-observer.ts` menjalankan efek samping setelah backend berhasil membuat transaksi.
- Keduanya membuat `transactions/page.tsx` lebih rapi, mudah dites, dan lebih siap diperluas.

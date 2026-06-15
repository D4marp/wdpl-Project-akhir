# UML Diagram: Transaction Factory dan Observer

Dokumen ini berisi UML diagram untuk dua pattern pada modul transaksi web:

- `transaction-factory.ts` sebagai Factory Pattern.
- `transaction-observer.ts` sebagai Observer Pattern.

Diagram menggunakan Mermaid, sehingga bisa dirender langsung oleh Markdown viewer yang mendukung Mermaid.

## 1. Class Diagram - Transaction Factory

Factory Pattern memusatkan pembuatan product transaksi. `TransactionsPage` tidak membuat payload secara manual, tetapi meminta `TransactionFactory` membuat `TransactionProduct` berdasarkan `TransactionFormInput.type`.

```mermaid
classDiagram
  direction TB

  class TransactionFactory {
    +create(input: TransactionFormInput) TransactionProduct
  }

  class TransactionProduct {
    <<interface>>
    +validate() void
    +getPayload() CreateTransactionPayload
    +getLabel() string
    +getBadgeVariant() BadgeVariant
  }

  class BaseTransactionProduct {
    <<abstract>>
    #input: TransactionFormInput
    -presentation: TransactionPresentation
    +validate() void
    +getPayload() CreateTransactionPayload
    +getLabel() string
    +getBadgeVariant() BadgeVariant
    -amount number
  }

  class IncomeTransactionProduct {
    +constructor(input: TransactionFormInput)
  }

  class ExpenseTransactionProduct {
    +constructor(input: TransactionFormInput)
  }

  class TransactionFormInput {
    +type: TransactionType
    +category: string
    +description: string
    +amount: string
  }

  class CreateTransactionPayload {
    +type: string
    +category: string
    +description: string
    +amount: number
  }

  class TransactionPresentation {
    +label: string
    +badgeVariant: BadgeVariant
  }

  TransactionFactory ..> TransactionFormInput : receives
  TransactionFactory ..> TransactionProduct : creates
  TransactionProduct <|.. BaseTransactionProduct
  BaseTransactionProduct <|-- IncomeTransactionProduct
  BaseTransactionProduct <|-- ExpenseTransactionProduct
  BaseTransactionProduct ..> CreateTransactionPayload : returns
  BaseTransactionProduct --> TransactionPresentation : uses
```

### Penjelasan

- `TransactionFactory` adalah pembuat product.
- `TransactionProduct` adalah kontrak yang harus dipenuhi product transaksi.
- `BaseTransactionProduct` berisi logic umum: validasi, trim field, konversi amount, dan pembuatan payload.
- `IncomeTransactionProduct` dan `ExpenseTransactionProduct` adalah product konkret.
- `TransactionPresentation` menyimpan metadata tampilan seperti label dan variant badge.

## 2. Sequence Diagram - Factory saat Submit Transaksi

Diagram ini menunjukkan alur saat user submit form transaksi sampai payload siap dikirim ke API.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Page as TransactionsPage
  participant Factory as TransactionFactory
  participant Product as TransactionProduct
  participant API as api.createTransaction

  User->>Page: Submit form transaksi
  Page->>Factory: create(form)

  alt form.type == income
    Factory-->>Page: IncomeTransactionProduct
  else form.type == expense
    Factory-->>Page: ExpenseTransactionProduct
  else type tidak dikenal
    Factory-->>Page: throw Error
  end

  Page->>Product: validate()

  alt input valid
    Product-->>Page: valid
    Page->>Product: getPayload()
    Product-->>Page: CreateTransactionPayload
    Page->>API: createTransaction(payload)
  else input tidak valid
    Product-->>Page: throw Error
  end
```

### Penjelasan

- Page hanya memberi form input ke factory.
- Factory memilih product berdasarkan tipe transaksi.
- Product melakukan validasi.
- Product membuat payload API.
- API hanya dipanggil jika validasi berhasil.

## 3. Class Diagram - Transaction Observer

Observer Pattern memisahkan efek samping setelah transaksi berhasil dibuat. `TransactionSubject` menyimpan daftar observer dan mengirim event `TransactionCreatedEvent` ke setiap observer.

```mermaid
classDiagram
  direction TB

  class TransactionSubject {
    -observers: Set~TransactionObserver~
    +subscribe(observer: TransactionObserver) void
    +unsubscribe(observer: TransactionObserver) void
    +notifyTransactionCreated(event: TransactionCreatedEvent) Promise~ObserverResult[]~
  }

  class TransactionObserver {
    <<interface>>
    +name: string
    +onTransactionCreated(event: TransactionCreatedEvent) void | Promise~void~
  }

  class TransactionCreatedEvent {
    +transaction: Transaction
    +payload: CreateTransactionPayload
    +occurredAt: Date
  }

  class ObserverResult {
    +name: string
    +ok: boolean
    +error: unknown
  }

  class HistoryObserver {
    +name: "history-observer"
    +onTransactionCreated(event) void
  }

  class NotificationObserver {
    +name: "notification-observer"
    +onTransactionCreated(event) Promise~void~
  }

  class FormObserver {
    +name: "form-observer"
    +onTransactionCreated(event) void
  }

  class ToastObserver {
    +name: "toast-observer"
    +onTransactionCreated(event) void
  }

  TransactionSubject o-- TransactionObserver : stores
  TransactionSubject ..> TransactionCreatedEvent : publishes
  TransactionSubject ..> ObserverResult : returns

  TransactionObserver <|.. HistoryObserver
  TransactionObserver <|.. NotificationObserver
  TransactionObserver <|.. FormObserver
  TransactionObserver <|.. ToastObserver
```

### Penjelasan

- `TransactionSubject` adalah subject/publisher.
- `TransactionObserver` adalah kontrak observer.
- `TransactionCreatedEvent` adalah data event yang dikirim setelah transaksi berhasil dibuat.
- `ObserverResult` menyimpan status sukses/gagal setiap observer.
- Observer konkret pada `TransactionsPage` dibuat sebagai object literal:
  - `history-observer`: refresh riwayat transaksi.
  - `notification-observer`: refresh notifikasi.
  - `form-observer`: reset form.
  - `toast-observer`: tampilkan toast sukses.

## 4. Sequence Diagram - Observer setelah API Sukses

Diagram ini menunjukkan alur setelah transaksi berhasil dibuat oleh API.

```mermaid
sequenceDiagram
  autonumber
  participant Page as TransactionsPage
  participant API as api.createTransaction
  participant Subject as TransactionSubject
  participant History as history-observer
  participant Notif as notification-observer
  participant Form as form-observer
  participant Toast as toast-observer

  Page->>API: createTransaction(payload)

  alt API sukses
    API-->>Page: response.data transaction
    Page->>Subject: subscribe(history-observer)
    Page->>Subject: subscribe(notification-observer)
    Page->>Subject: subscribe(form-observer)
    Page->>Subject: subscribe(toast-observer)
    Page->>Subject: notifyTransactionCreated(event)

    Subject->>History: onTransactionCreated(event)
    History-->>Subject: setPage(1), loadTransactions(1)

    Subject->>Notif: onTransactionCreated(event)
    Notif-->>Subject: api.getNotifications()

    Subject->>Form: onTransactionCreated(event)
    Form-->>Subject: setForm(defaultForm)

    Subject->>Toast: onTransactionCreated(event)
    Toast-->>Subject: toast.success(...)

    Subject-->>Page: ObserverResult[]
  else API gagal
    API-->>Page: throw Error
    Page-->>Page: toast.error(message)
  end
```

### Penjelasan

- Observer hanya dipanggil setelah API berhasil.
- Jika API gagal, event tidak dipublish.
- Setiap observer menjalankan satu tanggung jawab.
- `TransactionSubject` menangkap error per observer sehingga observer lain tetap bisa berjalan.

## 5. Combined Flow Diagram

Diagram ini menggabungkan Factory Pattern dan Observer Pattern dalam satu alur transaksi.

```mermaid
flowchart TD
  A[User submit form] --> B[TransactionsPage submit]
  B --> C[TransactionFactory.create form]
  C --> D{Transaction type}
  D -->|income| E[IncomeTransactionProduct]
  D -->|expense| F[ExpenseTransactionProduct]
  D -->|unknown| G[Throw invalid type error]

  E --> H[product.validate]
  F --> H
  H --> I{Input valid?}
  I -->|No| J[toast.error validation message]
  I -->|Yes| K[product.getPayload]
  K --> L[api.createTransaction payload]
  L --> M{API success?}
  M -->|No| N[toast.error API message]
  M -->|Yes| O[TransactionSubject.notifyTransactionCreated]
  O --> P[history-observer refresh table]
  O --> Q[notification-observer refresh notifications]
  O --> R[form-observer reset form]
  O --> S[toast-observer show success]
```

## 6. Ringkasan Peran Pattern

| Pattern | File | Dipakai Saat | Tanggung Jawab |
| --- | --- | --- | --- |
| Factory | `transaction-factory.ts` | Sebelum request API | Membuat product transaksi, validasi, membuat payload, metadata UI |
| Observer | `transaction-observer.ts` | Setelah request API sukses | Menjalankan efek samping UI setelah transaksi dibuat |

Factory menjawab:

> Product transaksi apa yang harus dibuat dari input form ini?

Observer menjawab:

> Setelah transaksi berhasil dibuat, bagian mana saja yang perlu diberi tahu?

Kombinasi keduanya membuat halaman Transactions lebih rapi karena logic pembuatan payload dan efek samping tidak menumpuk di satu fungsi submit.

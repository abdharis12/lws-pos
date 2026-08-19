# ⚡ Performance & Database Query Audit Report — LW's POS

> **Auditor:** AI Performance Auditor · **Date:** 2026-08-19
> **Scope:** `app/Http/Controllers` (29), `app/Services` (12), `app/Models` (23), `app/Events`, `database/migrations`, `config/cache.php`
> **Stack:** Laravel 13 · PHP 8.4 · MySQL (db_lws) · Redis cache · Inertia/React
> **Cache driver:** `CACHE_STORE=redis` (dipakai untuk `Cache::remember` / `Cache::flexible` / `Cache::memo`)

---

## 1. Executive Summary

Audit dilakukan terhadap seluruh Eloquent query & relasi di `app/`. Ditemukan **3 kategori masalah**:

> ### ✅ Status: SELESAI SEMUA (2026-08-19)
> Seluruh **27 temuan** telah diimplementasikan (N1-N6, C1-C10, I1-I11), migration index dijalankan, dan **test suite lulus `258 passed / 897 assertions`**.

| Kategori | 🔴 Critical | 🟠 High | 🟡 Medium | Total | ✅ Selesai |
|----------|-----------|---------|-----------|-------|-----------|
| N+1 Query Problems | 2 | 2 | 2 | **6** | **6** |
| Heavy Queries / Caching | 0 | 5 | 2+3 bonus | **10** | **10** |
| Database Indexing | 5 | 5 | 1 | **11** | **11** |
| **Total** | **7** | **12** | **5** | **27** | **27** |

### Kondisi Baik (sudah benar)
- ✅ Eager loading sudah benar di mayoritas controller (`MenuCategoryController`, `OptionGroupController`, `TableController`, `PayrollController`, `PayslipController`, `Settings/*`)
- ✅ `CheckPendingPayments` command sudah memakai `chunkById()` untuk batch update
- ✅ `OrderItemBuilder` dan `SelfOrderService` memakai `whereIn()` keyed-by-id
- ✅ Semua query memakai parameter binding (tidak ada SQL injection — lihat `security-audit.md`)
- ✅ `Cache::forget("menu_categories_outlet_{$outletId}")` sudah terpasang di `MenuController::clearMenuCache()` — tinggal melengkapi sisi `Cache::remember`-nya

### 🔴 Kondisi Terparah (query count impact)

| Lokasi | Perilaku saat ini | Estimasi query (volume khas) | Setelah fix |
|--------|-------------------|-----------------------------|-------------|
| `OwnerDashboardController::activeOrders` | 1 + 2 eager + 1 COUNT/order | **~43** (40 order aktif) | **~5** |
| `PayrollService::generatePayslips` | 1 + 5 eager + 1 payslip-status/employee + 1 upsert/employee | **~106** (50 karyawan) | **~57** |
| `EmployeeController::attachRoles` | 1 + 1 eager + ~2 roles/employee | **~22** (10 baris) | **~3** |
| `OwnerDashboardController` (buildDashboard) | 19+ aggregation query per load + scan seluruh orders | **~20+** | **~6 + cache** |
| `PosController::categories` (katalog menu) | Reload seluruh katalog per halaman | 4 query berat/load | **1× cache** |
| `ReportController::waiterPoints` | 2 full scan bulanan identik | **~2×800 baris** | **1 aggregate** |

---

## 2. N+1 Query Problems

> **Pola umum:** relasi diakses dalam loop tanpa eager loading → query per baris. Prioritaskan menghilangkan lazy-load di loop.

### 🔴 Critical

- [x] **N1 — `OwnerDashboardController::activeOrders()` N+1 count per order**
  - Lokasi: `app/Http/Controllers/OwnerDashboardController.php:125-138`
  - Masalah: `$o->items()->count()` menjalankan query `COUNT(*)` terpisah untuk setiap order aktif; tanpa `limit()` dan tanpa filter outlet.
  - Dampak: `~43 query` (40 order aktif).
  - Solusi:
    ```php
    return Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Processing])
        ->forOutlet($outletId)
        ->with('tableSession.table')
        ->withCount('items')
        ->latest('created_at')
        ->limit(50)
        ->get()
        ->map(fn ($o) => [
            'id' => $o->id,
            'table_code' => $o->tableSession?->table?->code ?? '-',
            'status' => $o->status,
            'items_count' => $o->items_count,
            'created_at' => $o->created_at->format('H:i'),
        ])
        ->all();
    ```

- [x] **N2 — `PayrollService::generatePayslips()` N+1 lookup status payslip**
  - Lokasi: `app/Services/PayrollService.php:29-34` (map) → `payslipStatus()` L90-95
  - Masalah: `buildForEmployee()` dipanggil per karyawan; masing-masing mengeksekusi `Payslip::where(employee_id, period)->first()` (1 query/karyawan).
  - Dampak: **~50 query tambahan** untuk 50 karyawan.
  - Solusi: preload sekali di awal, teruskan status ke `buildForEmployee()`:
    ```php
    $existing = Payslip::where('period', $period)
        ->whereIn('employee_id', $employees->pluck('id'))
        ->pluck('status', 'employee_id');
    // pasa `$existing[$employee->id] ?? null` ke buildForEmployee()
    ```

- [x] **N3 — `EmployeeController::attachRoles()` N+1 roles per karyawan**
  - Lokasi: `app/Http/Controllers/EmployeeController.php:32` (panggilan), `:125-132` (definisi)
  - Masalah: `$employee->user->roles` tidak di-eager-load — `Employee::with('user')` tanpa `with('user.roles')`.
  - Dampak: **~20 query tambahan** di halaman daftar karyawan (10 baris).
  - Solusi: `Employee::with('user.roles')` pada index; di `show()` tambahkan `$employee->load('user.roles')`.

### 🟠 High

- [x] **N4 — `SelfOrderController::orderStatus/thankYou/pollStatus` lazy-load `tableSession.table`**
  - Lokasi: `app/Http/Controllers/SelfOrderController.php:149-154, 161-166, 269-273`
  - Masalah: `$order->load(['items.menu', 'items.options.optionItem'])` tidak menyertakan `tableSession.table`; `assertTableOwner()` juga menyentuh relasi yang belum dimuat → 2-3 query lazy per screen/request.
  - Dampak: 2-3 query per screen Status, ThankYou, dan tiap `pollStatus` (tiap 5-15 detik).
  - Solusi: `$order->load(['items.menu', 'items.options.optionItem', 'tableSession.table'])`.

- [x] **N5 — Event `OrderStatusUpdated` / `OrderCreated` — relasi dimuat berulang**
  - Lokasi: `app/Events/OrderStatusUpdated.php:27-49`; `app/Events/OrderCreated.php:24-25`
  - Masalah: `broadcastOn()` mengakses `tableSession.table` (lazy), lalu `broadcastWith()` memanggil `refresh()` (menghapus relasi yang sudah dimuat) dan `loadMissing()` ulang → 6-8 query per broadcast. `OrderCreated` juga tidak memuat `createdBy.employee`.
  - Dampak: **6-8 query × frekuensi perubahan status** (bisa puluhan/jam saat dapur ramai).
  - Solusi: muat relasi sekali di constructor, `broadcastOn()` pakai data yang sudah dimuat, hapus `refresh()` dari `broadcastWith()`, dan tambahkan `createdBy.employee` pada `OrderCreated`.

### 🟡 Medium

- [x] **N6 — `PosController::pendingOrders()` tidak dibatasi & tanpa filter outlet**
  - Lokasi: `app/Http/Controllers/PosController.php:365-371`
  - Masalah: Muat seluruh order pending + item + options + menu + payment dalam sekali render tanpa `limit()` dan tanpa `forOutlet()`. `index()` juga memanggil `lastOrder()` yang memuat ulang relasi yang sama.
  - Dampak: 6-8 query berat, payload tak terbatas di shift ramai.
  - Solusi: `->forOutlet($outletId)->limit(50)`; temukan `lastOrder` dari koleksi `pendingOrders` yang sudah dimuat (hindari query kedua).

---

## 3. Heavy Queries & Caching

> Aplikasi praktis **NOL cache** saat ini. `Cache::forget` di `MenuController` ada tapi `Cache::remember` tidak pernah diisi. Pakai `Cache::flexible()` untuk stale-while-revalidate pada data realtime, `Cache::remember()` untuk data statis, `Cache::memo()` untuk dedup per-request.

### 🟠 High

- [x] **C1 — `OwnerDashboardController::buildDashboard()` 19+ aggregation query per load**
  - Lokasi: `app/Http/Controllers/OwnerDashboardController.php`
    - `avgCookingTime()` L154-162: **memuat seluruh order history** (`->get(['created_at','updated_at'])`) lalu rata-rata di PHP → pindahkan ke SQL:
      ```php
      Order::whereIn('status', [OrderStatus::Ready, OrderStatus::Completed])
          ->whereNotNull('updated_at')
          ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_min')
          ->value('avg_min');
      ```
    - `salesTrend()` L173-183: **7 query SUM terpisah** dalam loop → 1 query `GROUP BY DATE(created_at)`.
  - Dampak: ~19+ query + potensi scan seluruh tabel per load.
  - Solusi: SQL-ify seperti di atas + bungkus `buildDashboard()` dengan `Cache::flexible("owner_dashboard:{$outletId}:".today()->toDateString(), [60, 300], fn () => $this->buildDashboard($outletId, $today))`.
  - Invalidation: `Cache::forget` pada listener event `OrderPaid` & `OrderStatusUpdated`.

- [x] **C2 — `DashboardController::index()` query berulang & identik**
  - Lokasi: `app/Http/Controllers/DashboardController.php:23-31`
  - Masalah: `todaySales` (SUM) dan `todayOrdersCount` (COUNT) memakai WHERE identik (status + date + forOutlet) → 2 query untuk 2 angka. `scopeForOutlet` sendiri = 2 subquery (whereHas), jadi total 6 subquery per load.
  - Solusi: gabung jadi satu query:
    ```php
    Order::whereIn('status', $paidStatuses)
        ->whereDate('created_at', $today)
        ->forOutlet($outletId)
        ->selectRaw('COALESCE(SUM(total),0) as sales, COUNT(*) as cnt')
        ->first();
    ```
  - Bonus: bungkus payload seluruh dashboard dengan `Cache::flexible("dashboard:today:{$outletId}:".$today->toDateString(), [60, 300], ...)`.

- [x] **C3 — Katalog menu tidak pernah di-cache (key cache sudah siap)**
  - Lokasi: `app/Http/Controllers/PosController.php:342-349` (categories), `app/Http/Controllers/SelfOrderController.php:36-40` (show), `app/Http/Controllers/MenuController.php:211-217` (clearMenuCache)
  - Masalah: Seluruh katalog (categories → menus → optionGroups → optionItems) di-reload dari DB di setiap halaman POS & self-order. **Ini data statis** yang hanya berubah saat CRUD menu.
  - **`Cache::forget("menu_categories_outlet_{$outletId}")` sudah terpasang di `clearMenuCache()`** — tinggal mengisi sisi read-nya:
    ```php
    return Cache::remember("menu_categories_outlet_{$outletId}", 3600, fn () =>
        MenuCategory::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get()
    );
    ```
  - **Perbaikan invalidation:** `MenuCategoryController::store/update/destroy` (L37-86) dan `OptionGroupController` juga harus memanggil `clearMenuCache()` agar katalog tak basi. `SelfOrderController::show` harus memakai key yang sama.

- [x] **C4 — `ReportController` beberapa scan + agregasi di PHP**
  - Lokasi: `app/Http/Controllers/ReportController.php`
    - `hourlyData()` L216-232: memuat seluruh order hari itu lalu bucket per jam di PHP (24× filter) → ganti `GROUP BY HOUR(created_at)` (500 baris → 24 baris).
    - `reconciliation()` L75-84: range payment discan **dua kali** (sekali utk `$allPayments`, sekali utk paginated list) → jadikan ringkasan satu SQL `SUM(CASE WHEN status IN (...) ...)`.
    - `waiterPoints()` L154-160 + `waiterPointsMap()` L435-443: **dua query identik** pull semua order selesai bulan itu → satu `GROUP BY served_by` + `pluck`.
    - `attendance()` L99,112,331-334: `activeEmployees()` dipanggil **dua kali** identik → muat sekali, pluck id dari collection sama.
  - Dampak: 2× full monthly scan + ribuan baris dihidrasi per laporan.
  - Solusi: SQL-ify di atas + `Cache::remember("report:{$name}:{$startDate}:{$endDate}", 300, ...)`; jangan cache paginated list (state pagination).

- [x] **C5 — `KitchenDisplayController::kitchenOrders()` tanpa batas**
  - Lokasi: `app/Http/Controllers/KitchenDisplayController.php:31-37`
  - Masalah: Muat semua order status `paid/processing/ready` + tree items/menu/options + tableSession.table tanpa limit dan tanpa batas tanggal — query paling sering di-poll di aplikasi.
  - Solusi: `->whereDate('created_at', today())->limit(100)` + index `(status, created_at)`; jika polling HTTP, bungkus `Cache::flexible("kds:active_orders", [5, 10], fn () => ...)`.

### 🟡 Medium

- [x] **C6 — `PosSessionController::currentSession()` memuat seluruh order hari ini**
  - Lokasi: `app/Http/Controllers/PosSessionController.php:96-103`
  - Masalah: `with(['openedBy','closedBy','orders.payment'])` menghidrasi ratusan order + payment untuk menampilkan 2 angka ringkasan (cash/non-cash) di `buildShiftSummaries()`.
  - Solusi: hitung total di SQL: `SUM(CASE WHEN payment.method = 'cash' THEN ... END)`; cache `Cache::flexible("pos_session:{$outletId}:".today()->toDateString(), [30, 90], ...)`.

- [x] **C7 — `AttendanceController` query outlet & employee berulang dalam 1 request**
  - Lokasi: `app/Http/Controllers/AttendanceController.php:60-64` (`outlet()`), `:164-176` (`employees()`)
  - Masalah: `Outlet::find($outletId)` dipanggil ≥3× per request (index), employees dimuat 2× (`$outlet->load('employees')` + `employees()`).
  - Solusi: `Cache::memo("attendance_outlet:{$outletId}", fn () => Outlet::find($outletId))`; muat employee sekali. Geofence settings near-static → `Cache::remember("outlet:{$outletId}", 3600, ...)` dengan invalidation di `OutletController::update`.

### Bonus (Perbaikan ringan yang sama-sama membantu)

- [x] **C8 — `OrderKitchenStatusResolver::resolve()` log debug unconditional**
  - Lokasi: `app/Services/OrderKitchenStatusResolver.php:32-39`
  - `\Log::info(..., items dump ...)` dieksekusi pada **setiap call** (tiap poll KDS & tiap perubahan) → spam log + cost serialisasi. Bungkus dengan `if (app()->environment('local'))`.
- [x] **C9 — Nyalakan `Model::preventLazyLoading()` di development**
  - Lokasi: `app/Providers/AppServiceProvider.php:28-35`
  - `Model::preventLazyLoading(! app()->isProduction())` di `boot()` → langsung melempar exception jika ada lazy-load baru yang lolos, mencegah N+1 regresi ke depan.
- [x] **C10 — Cache list periode payslip & aksi activity log**
  - `PayslipController.php:29-32` & `PayrollController.php:22` (`select('period')->distinct()` full scan) → `Cache::remember('payslip_periods', 3600, ...)` + forget saat generate/approve.
  - `ActivityLogController.php:21` (`select('action')->distinct()`) → `Cache::remember('activity_log_actions', 3600, ...)`.

---

## 4. Database Indexing

> Metode: `SHOW INDEX` live vs query pattern di `app/` + `routes/`. Catatan penting: `whereDate('created_at', $x)` di-compile Laravel 13 menjadi `date(created_at) = ?` (**non-SARGable**) — index baru hanya benar-benar memotong scan jika query diubah ke range predicate (`>= startOfDay` / `< nextDay`).

### 🔴 High Impact

- [x] **I1 — `orders (status, created_at)`**
  - `ALTER TABLE orders ADD INDEX orders_status_created_at_index (status, created_at);`
  - Semua dashboard/report/POS history filter `status IN (paid, completed)` + `created_at` + `ORDER BY created_at`. Index `status` yang ada low-cardinality (tidak memangkas history).
  - Pemakai: `DashboardController:23-31,56-63`; `OwnerDashboardController:55-183`; `PosController:72-117,367-371`; `KitchenDisplayController:31-37`; `ReportController:189-285`; `CheckPendingPayments:30-32`; `SalesReportExport:19-30`.
  - ⚠ Refactor `whereDate` → range predicate agar index efektif.

- [x] **I2 — `activity_logs (created_at)`**
  - `ALTER TABLE activity_logs ADD INDEX activity_logs_created_at_index (created_at);`
  - Listing admin `latest()->paginate(20)` tanpa filter = full scan + filesort seluruh log (append-only, tak pernah bersih).
  - Pemakai: `ActivityLogController.php:19`.

- [x] **I3 — `table_sessions (table_id, status)`**
  - `ALTER TABLE table_sessions ADD INDEX table_sessions_table_id_status_index (table_id, status);`
  - Pola "get-or-create active session" di **setiap pembuatan order** (POS + self-order) + tiap lock/move/merge/release meja.
  - Pemakai: `PosOrderService:39`, `SelfOrderService:21`, `PosTableService:15-70`, `PosController:380-383,589`, `ResetTablesDaily:17`.

- [x] **I4 — `payslips (period, created_at)`**
  - `ALTER TABLE payslips ADD INDEX payslips_period_created_at_index (period, created_at);`
  - UNIQUE(`employee_id, period`) tidak bisa melayani `WHERE period = ?` (period bukan kolom pertama).
  - Pemakai: `PayslipController:25-32`, `PayrollController:21`, `PayrollReportExport:18-21`.

- [x] **I5 — `payments (created_at)`**
  - `ALTER TABLE payments ADD INDEX payments_created_at_index (created_at);`
  - Rekonsiliasi + dashboard owner memfilter rentang tanggal; indeks tanggal sama sekali tidak ada.
  - Pemakai: `OwnerDashboardController:166-169`, `ReportController:75-84,207-214`.

### 🟡 Medium Impact

- [x] **I6 — `attendances (clock_in_at)`**
  - `ALTER TABLE attendances ADD INDEX attendances_clock_in_at_index (clock_in_at);`
  - Query "absensi hari ini" tanpa `employee_id` → komposit `(employee_id, clock_in_at)` tidak terpakai.
  - Pemakai: `AttendanceController:180-183`, `OwnerDashboardController:116`.

- [x] **I7 — `shifts (shift_date)`**
  - `ALTER TABLE shifts ADD INDEX shifts_shift_date_index (shift_date);`
  - View minggu/bulan filter `shift_date` saja; UNIQUE(`employee_id, shift_date, shift_number`) tak terpakai.
  - Pemakai: `ShiftController:145-149,171-195`, `ReportController:107-110`, `PosSessionController:118-121`.

- [x] **I8 — `pos_sessions (outlet_id, session_date, status)`**
  - `ALTER TABLE pos_sessions ADD INDEX pos_sessions_outlet_date_status_index (outlet_id, session_date, status);`
  - Lookup session aktif tiap load halaman POS & buka/tutup session.
  - Pemakai: `PosSessionController:98-103,107-113,181-184`, `PosController:415-418`.

- [x] **I9 — `bonuses (employee_id, period)` & `deductions (employee_id, period)`**
  - `ALTER TABLE bonuses ADD INDEX bonuses_employee_id_period_index (employee_id, period);`
  - `ALTER TABLE deductions ADD INDEX deductions_employee_id_period_index (employee_id, period);`
  - Payroll generation & payslip detail filter `employee_id IN (...) AND period = ?`.
  - Pemakai: `PayrollService:21-22,44-45`, `PayslipController:23,47`, `PdfController:21`.

- [x] **I10 — `orders (status, served_at)`**
  - `ALTER TABLE orders ADD INDEX orders_status_served_at_index (status, served_at);`
  - Leaderboard waiter & laporan poin filter `status=completed AND served_at >= ...`.
  - Pemakai: `WaiterController:73-89`, `ReportController:154-159,437-443`.

### 🟢 Low Impact (opsional)

- [x] **I11 — Refactor `whereDate()` / `whereYear()` / `whereMonth()` ke range predicate (SARGable)**
  - Berlaku di `orders.created_at` (I1), `payments.created_at` (I5), `attendances.clock_in_at` (I6), `shifts.shift_date` (I7), `pos_sessions.session_date`.
  - Pola: ganti `->whereDate('created_at', $today)` menjadi `->where('created_at', '>=', $today->startOfDay())->where('created_at', '<', $today->addDay()->startOfDay())`. Tanpa ini, index baru hanya menghapus filesort, bukan scan.

### Sudah ada (tidak perlu ditambah)

| Tabel | Index | Keterangan |
|-------|-------|------------|
| `orders` | `status`, `served_at`, FK lainnya | sudah ada, diganti/pakai komposit I1 |
| `attendances` | `(employee_id, clock_in_at)` | cukup utk query per-karyawan |
| `payslips` | UNIQUE(`employee_id, period`) | cukup utk `payslipStatus()` |
| `shifts` | UNIQUE(`employee_id, shift_date, shift_number`) | cukup utk query shift per-karyawan |
| `payments` | UNIQUE(`midtrans_transaction_id`) | idempotency webhook |

---

## 5. ✅ Sudah Dikerjakan

> **Eksekusi:** 2026-08-19 — seluruh 27 temuan telah diimplementasikan dan lolos test suite (`258 passed`).

- [x] **Order::scopeForOutlet — filter order per outlet**
  - Lokasi: `app/Models/Order.php`
  - Menyediakan scope `forOutlet(?int $outletId)` yang memfilter order melalui relasi `tableSession.table.outlet_id` **atau** `posSession.outlet_id` (orders tidak punya kolom `outlet_id` langsung); saat `null` mengembalikan `whereRaw('0 = 1')` (tidak membocorkan data lintas outlet).
  - Memperbaiki error `SQLSTATE[42S22]: Unknown column 'outlet_id'` pada `DashboardController` sekaligus mencegah kebocoran data lintas outlet.
- [x] **DashboardController pakai forOutlet untuk agregasi hari ini** (lihat C2)

---

## 6. Ringkasan Progress

| Kategori | Total Task | ✅ Selesai | Belum |
|----------|-----------|-----------|-------|
| N+1 Query Problems | 6 | **6** | 0 |
| Heavy Queries & Caching | 10 | **10** | 0 |
| Database Indexing | 11 | **11** | 0 |
| Sudah Dikerjakan (sebelumnya) | 2 | **2** | 0 |
| **Total** | **29** | **29** | **0** |

> **Status:** ✅ Semua temuan telah diimplementasikan, migration index dijalankan, dan test suite lulus (`258 passed / 897 assertions`). Frontend build sukses.

### Catatan Implementasi (file yang diubah)

| Kategori | File utama |
|----------|-----------|
| N1 | `app/Http/Controllers/OwnerDashboardController.php` — `withCount('items')`, `when($outletId, forOutlet)`, `limit(50)` |
| N2 | `app/Services/PayrollService.php` — batch `pluck('status','employee_id')` sekali per periode |
| N3 | `app/Http/Controllers/EmployeeController.php` — `with('user.roles')` di index & show |
| N4 | `app/Http/Controllers/SelfOrderController.php` — eager load `tableSession.table` di status/thankYou/pollStatus |
| N5 | `app/Events/OrderStatusUpdated.php`, `app/Events/OrderCreated.php` — preload di constructor, hapus `refresh()`/`loadMissing()` berulang |
| N6 | `app/Http/Controllers/PosController.php` — `when($outletId, forOutlet)` + `limit(50)` |
| C1 | `app/Http/Controllers/OwnerDashboardController.php` — `avgCookingTime` SQL aggregate (driver-aware), `salesTrend` 1× `GROUP BY DATE`, `Cache::flexible` 60/300s |
| C2 | `app/Http/Controllers/DashboardController.php` — gabung SUM+COUNT jadi 1 query, `withCount`, range predicate, `Cache::flexible` |
| C3 | `app/Services/MenuCatalogService.php` (baru) + `PosController`, `SelfOrderController`, `MenuController`, `MenuCategoryController`, `OptionGroupController` — `Cache::remember` 1 jam + invalidation kategori/option |
| C4 | `app/Http/Controllers/ReportController.php` — `hourlyData` GROUP BY (portable), reconciliation 1× SQL summary, waiterPoints 1 grouped query, attendance dedup |
| C5 | `app/Http/Controllers/KitchenDisplayController.php` — batas 2 hari + `limit(100)` |
| C6 | `app/Http/Controllers/PosSessionController.php` — eager-load kolom ramping (`slimOrders`) |
| C7 | `app/Http/Controllers/AttendanceController.php` — memoize `outlet()`, hapus duplicate `load('employees')` |
| C8 | `app/Services/OrderKitchenStatusResolver.php` — log hanya di `local` |
| C9 | `app/Providers/AppServiceProvider.php` — `Model::preventLazyLoading(! production)` |
| C10 | `app/Http/Controllers/PayslipController.php`, `PayrollController.php`, `ActivityLogController.php` — cache `payslip_periods` & `activity_log_actions` + invalidation |
| I1-I10 | `database/migrations/2026_08_19_210113_add_performance_indexes.php` — 11 index (sudah `php artisan migrate`) |
| I11 | Range predicate (`>= startOfDay` / `< nextDay`) di Dashboard, OwnerDashboard, Report, Attendance, PosController, PosSession, Shift, PayrollService, SalesReportExport, ActivityLogController |
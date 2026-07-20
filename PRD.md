# Product Requirements Document (PRD)
# Sistem POS "Bubur Kang Lw"

| | |
|---|---|
| **Nama Produk** | POS Bubur Kang Lw |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 20 Juli 2026 |
| **Status** | Draft untuk Review |
| **Pemilik Produk** | Abd Haris |

---

## 1. Ringkasan Eksekutif

Bubur Kang Lw membutuhkan sistem Point of Sale (POS) modern yang setara dengan yang digunakan restoran-restoran besar (contoh referensi pengalaman: MOKA POS, ESB, GoBiz Merchant, atau sistem self-order ala McDonald's/Chatime). Sistem ini bukan sekadar kasir digital, melainkan platform operasional restoran yang mencakup:

- **Self-Service Ordering** via scan QR code di meja (pelanggan pesan sendiri dari HP)
- **Kitchen Display System (KDS)** realtime yang otomatis menerima order begitu pembayaran sukses
- **Pembayaran QRIS terintegrasi Midtrans** dengan konfirmasi status pembayaran otomatis (webhook)
- **Manajemen Karyawan** mencakup absensi, shift, role & akses
- **Manajemen Meja, Menu, dan Laporan Penjualan**

Sistem dibangun di atas **Laravel 13 + Inertia.js + React 18 + Laravel Reverb** untuk pengalaman realtime tanpa perlu membangun REST API terpisah secara penuh, dengan keamanan menjadi prioritas utama karena sistem menangani transaksi keuangan dan data karyawan.

---

## 2. Latar Belakang & Masalah yang Diselesaikan

| Masalah Saat Ini | Solusi yang Ditawarkan |
|---|---|
| Pencatatan pesanan manual rawan salah & lambat saat jam ramai | Self-order via QR code, pesanan langsung masuk sistem |
| Dapur menerima order lewat teriakan/nota kertas, sering tertukar | Kitchen Display System realtime per station |
| Kasir harus mengecek manual apakah pelanggan sudah bayar QRIS | Integrasi Midtrans dengan webhook otomatis, status real-time |
| Absensi karyawan manual (buku/Excel), rawan manipulasi | Absensi digital dengan geofencing/foto & timestamp tervalidasi |
| Tidak ada data histori penjualan yang bisa dianalisis | Dashboard laporan penjualan, produk terlaris, jam sibuk |

---

## 3. Tujuan Produk (Goals)

1. Mempercepat proses pemesanan hingga **≥ 40%** dibanding sistem manual.
2. Menghilangkan selisih pembayaran karena rekonsiliasi QRIS otomatis via webhook Midtrans.
3. Pesanan yang statusnya "paid" tampil di Kitchen Display **dalam waktu < 2 detik** (via WebSocket, bukan polling).
4. Transparansi kehadiran karyawan dengan log absensi yang tidak bisa dimanipulasi kasir/karyawan lain.
5. Owner bisa memantau penjualan & kinerja outlet dari mana saja (real-time dashboard).
6. Primary Color adalah : #4F6B6A dan secondary color adalah 
#CfC0A4

### Non-Goals (di luar cakupan versi 1.0)
- Multi-outlet/cabang (disiapkan arsitekturnya, tapi UI multi-tenant penuh masuk fase 2)
- Payroll otomatis penuh (baru rekap jam kerja, bukan penggajian otomatis)
- Aplikasi mobile native (native app) — versi 1 berbasis web responsive (PWA-ready)
- Sistem loyalti/membership pelanggan

---

## 4. Target Pengguna & Role

| Role | Deskripsi | Akses Utama |
|---|---|---|
| **Owner/Manager** | Pemilik bisnis | Semua modul + laporan finansial + manajemen karyawan |
| **Admin/Supervisor** | Pengelola harian outlet | Manajemen menu, meja, karyawan, laporan (tanpa hapus data sensitif) |
| **Kasir (Cashier)** | Petugas kasir | POS order manual, konfirmasi pembayaran cash, cetak struk |
| **Dapur (Kitchen Staff)** | Petugas dapur | Kitchen Display System, update status masak/selesai |
| **Waiter/Pramusaji** | Pelayan | Bantu input order, antar makanan, update status meja |
| **Pelanggan (Guest)** | Tamu restoran | Self-order via QR code, bayar QRIS, tidak perlu akun/login |

---

## 5. Tech Stack & Justifikasi

| Layer | Teknologi | Catatan |
|---|---|---|
| Backend Framework | **Laravel 13** (PHP 8.3+) | ORM, Queue, Validation, Policy/Gate bawaan kuat untuk RBAC |
| Frontend | **React 18 + TypeScript** | Component-based, cocok untuk KDS & POS yang interaktif |
| Bridge FE-BE | **Inertia.js** | SPA experience tanpa membangun REST API terpisah untuk web app internal |
| Realtime | **Laravel Reverb** (WebSocket server) | Broadcast event pesanan baru ke KDS & update status meja secara instan |
| Database | **PostgreSQL 16** | ACID kuat untuk transaksi keuangan, mendukung JSONB untuk struktur menu fleksibel |
| Payment Gateway | **Midtrans (Snap/Core API - QRIS)** | Dukungan QRIS nasional, webhook notifikasi status |
| Cache/Queue | **Redis** | Queue untuk job broadcasting, cache session, rate limiting |
| Auth | **Laravel Sanctum / Fortify** | Session-based auth untuk staff, token terpisah untuk API eksternal jika diperlukan |
| Styling | **Tailwind CSS + shadcn/ui** | UI modern, konsisten, mendukung dark mode untuk KDS |
| Export Laporan | **Laravel Excel (maatwebsite/excel)** | Generate file .xlsx untuk semua laporan (penjualan, kehadiran, payroll) |
| Hosting/Infra saran | VPS/Cloud (mis. AWS/DO) + Nginx + Supervisor (queue worker & Reverb process) | HTTPS wajib (Let's Encrypt) |

**Catatan versi**: Per Juli 2026, pastikan tim mengecek rilis stabil Laravel 13 dan compatibility matrix Reverb + Inertia v2 sebelum mulai development, karena versi minor bisa memengaruhi API broadcasting.

---

## 6. Arsitektur Sistem (High-Level)

```
[Pelanggan HP] --scan QR--> [Halaman Self-Order (Inertia/React, public)]
        |
        v
   [Order Dibuat: status = pending_payment]
        |
        v
   [Request Snap Token / QRIS ke Midtrans Core API]
        |
        v
[Pelanggan scan QRIS & bayar] --> [Midtrans]
        |
        v (Webhook / HTTP Notification)
[Laravel: MidtransWebhookController]
        |
        |-- Verifikasi signature key (SHA512)
        |-- Update order.status = paid
        |-- Dispatch Event: OrderPaid
        v
[Laravel Reverb Broadcast] --> [Channel: kitchen-display.{outlet_id}]
        |
        v
[Kitchen Display (React, realtime listener)] -- menampilkan order baru otomatis
        |
        v
[Dapur update status: cooking -> ready] --broadcast--> [Waiter/Kasir notifikasi meja siap]
```

**Prinsip kunci**: Kitchen Display **tidak pernah** menampilkan order yang belum `paid` (kecuali mode "bayar di kasir" yang dikonfirmasi manual oleh kasir dengan izin role tertentu).

---

## 7. Fitur Detail

### 7.1 Self-Service Ordering (QR Code per Meja)

**Alur pengguna:**
1. Pelanggan duduk di meja bernomor, scan QR code unik yang tertempel di meja.
2. QR code mengarah ke URL unik: `https://order.buburkanglw.id/t/{table_token}` — token per meja, bukan sekadar nomor meja polos (mencegah orang menebak/mengakses meja lain).
3. Halaman menampilkan menu (kategori, foto, harga, status stok "habis"/"tersedia").
4. Pelanggan tap sebuah menu → muncul **detail modal interaktif** (bukan langsung masuk keranjang) berisi foto besar, deskripsi, dan pilihan varian/add-on (lihat 7.6.1) → pelanggan atur qty, pilih varian, lalu "Tambah ke Keranjang".
5. Checkout → pilih metode bayar (QRIS via Midtrans) → sistem generate QRIS dinamis.
6. Pelanggan bayar via e-wallet/mobile banking apapun yang support QRIS.
7. Setelah pembayaran sukses (dikonfirmasi via webhook Midtrans), halaman pelanggan otomatis update ("Pesanan diterima dapur") dan order **saat itu juga** tayang di Kitchen Display.
8. Pelanggan dapat memantau status order real-time: `Menunggu Pembayaran → Dibayar → Diproses → Siap Diantar → Selesai`.

**Aturan bisnis penting:**
- Order dengan status `pending_payment` **tidak** dikirim ke dapur.
- Jika pembayaran gagal/timeout (QRIS Midtrans expired default 15 menit), order otomatis di-cancel dan meja bisa order ulang.
- Satu meja bisa punya multiple order aktif dalam satu sesi kunjungan (order tambahan/repeat order) — dikelompokkan dalam satu "sesi meja" (table session) agar kasir bisa closing bill gabungan.

### 7.2 POS Kasir (Cashier Terminal)

- Input order manual untuk pelanggan yang tidak/kurang familiar dengan self-order.
- Dukungan multi metode bayar: Cash, QRIS (Midtrans), kartu debit/kredit (EDC manual-record).
- Split bill per item atau merata per orang.
- Diskon (persen/nominal, dengan approval role Admin untuk diskon besar).
- Cetak struk (thermal printer 58mm/80mm via browser print / ESC-POS).
- Void/cancel order **hanya** oleh role Admin/Owner dengan alasan wajib diisi (audit log).

### 7.3 Kitchen Display System (KDS)

- Layar dapur (tablet/monitor) menampilkan kartu order realtime, dikelompokkan per station bila perlu (mis. station gorengan, station bubur, minuman).
- Order baru masuk dengan **notifikasi suara** + animasi highlight.
- Tombol aksi: `Mulai Masak` → `Selesai/Siap` → otomatis notifikasi ke waiter/kasir bahwa pesanan siap diantar.
- Color-coded berdasarkan waktu tunggu (hijau < 5 menit, kuning 5–10 menit, merah > 10 menit) — mendorong SLA dapur.
- Mode tampilan cocok untuk layar besar, kontras tinggi, dark mode default (nyaman untuk lingkungan dapur).

### 7.4 Integrasi Pembayaran Midtrans QRIS

- Gunakan **Midtrans Core API** (bukan Snap redirect) agar QRIS bisa ditampilkan langsung di halaman self-order tanpa pelanggan diarahkan keluar aplikasi.
- Endpoint webhook: `POST /webhooks/midtrans/notification` — **wajib**:
  - Verifikasi `signature_key` (SHA512 dari order_id + status_code + gross_amount + server_key) sebelum memproses payload apapun.
  - Idempotency: cek apakah notifikasi untuk `order_id` yang sama sudah pernah diproses (mencegah double processing bila Midtrans retry).
  - Selalu **konfirmasi status transaksi ke Midtrans API** (get status), jangan hanya percaya payload webhook mentah, untuk mencegah spoofing.
- Status mapping: `settlement`/`capture` (accept) → `paid`; `expire`/`cancel`/`deny` → `failed`; `pending` → tetap `pending_payment`.
- Polling fallback: jika webhook gagal diterima (jaringan bermasalah), sistem punya scheduled job tiap 1 menit untuk cek status order yang masih `pending_payment` > 2 menit langsung ke Midtrans API.

### 7.5 Manajemen Karyawan

**Absensi (Attendance)**
- Clock-in/clock-out via halaman khusus (bisa di device outlet, bukan device pribadi karyawan, untuk kontrol lokasi).
- Opsional: validasi lokasi (geofencing radius outlet) jika absensi dari HP masing-masing diizinkan.
- Foto selfie saat absen (opsional, anti-titip absen).
- Rekap otomatis: jam masuk, jam keluar, total jam kerja, keterlambatan.
- Manajemen shift (pagi/siang/malam), penjadwalan mingguan oleh Admin.

**Karyawan & Role**
- CRUD data karyawan (data pribadi, tanggal mulai kerja, role, gaji pokok/basic).
- RBAC granular berbasis Laravel Policy: Owner > Admin > Kasir/Dapur/Waiter.
- Log aktivitas penting (void order, diskon besar, ubah harga menu) tercatat dengan `user_id`, `timestamp`, `action`.

**Cuti/Izin (opsional fase 2)**
- Pengajuan izin/cuti sederhana dengan approval Admin.

**Gaji, Bonus & Potongan (Payroll — Semi-Otomatis)**

Bukan payroll penuh (belum terintegrasi transfer bank/pajak), namun sistem menghitung dan merekap komponen gaji secara otomatis berdasarkan data absensi & input Admin, sehingga Owner tinggal review dan bayar manual:

- **Komponen gaji per karyawan**, dikonfigurasi Admin:
  - Gaji pokok (bulanan atau harian/per-shift, tergantung tipe karyawan)
  - Tunjangan tetap (mis. tunjangan makan, transport) — nominal per hari kerja
  - **Bonus**: input manual per periode (mis. bonus kinerja, bonus penjualan target tercapai), dengan kolom keterangan & disetujui oleh Owner/Admin
  - **Uang lembur (overtime)**: dihitung dari selisih jam kerja aktual vs jam shift terjadwal (dari data `attendances`), dengan rate per jam yang bisa diatur
  - **Potongan**: keterlambatan (dihitung otomatis dari data absensi), kasbon/pinjaman karyawan, potongan lain (manual)
- **Slip Gaji (Payslip)**: sistem generate rekap otomatis per periode (biasanya bulanan) berisi rincian: gaji pokok + tunjangan + bonus + lembur − potongan = **Take Home Pay**. Bisa diekspor PDF per karyawan.
- **Riwayat Penggajian**: histori payslip per karyawan per bulan, status `draft → disetujui Owner → dibayar`. Proses pembayaran **sepenuhnya manual** (Owner transfer/bayar cash di luar sistem), sistem hanya mencatat status dan tanggal/metode pembayaran sebagai referensi — **tidak ada integrasi transfer bank otomatis**.
- **THR (Tunjangan Hari Raya)**: dihitung berdasarkan **kebijakan internal Bubur Kang Lw sendiri** (bukan mengikuti rumus pemerintah secara baku). Admin/Owner bisa mengatur bebas: nominal flat per karyawan, persentase dari gaji pokok, atau rasio berdasarkan masa kerja — sepenuhnya dikonfigurasi lewat pengaturan sistem, bukan hard-code.
- Akses modul payroll **dibatasi ketat** hanya untuk role Owner (dan Admin bila diberi izin eksplisit) — data gaji adalah data paling sensitif dalam sistem, tidak boleh terlihat oleh Kasir/Dapur/Waiter.

### 7.6 Manajemen Menu & Meja

- CRUD menu: kategori, nama, harga, foto, status tersedia/habis (real-time update ke halaman self-order via broadcast).
- Manajemen meja: nomor meja, kapasitas, status (kosong/terisi/reserved), generate & cetak QR code per meja (regenerate token bila QR hilang/disalahgunakan).

#### 7.6.1 Menu Interaktif dengan Varian & Add-on (ala POS Restoran Modern)

Terinspirasi dari pengalaman order di POS restoran besar (mis. McDonald's, Chatime, Kopi Kenangan) — setiap menu bisa punya **grup opsi** yang dikonfigurasi bebas oleh Admin, tanpa perlu ubah kode:

- **Grup Opsi (Option Group)**, contoh:
  - *Level Pedas* — wajib pilih satu (radio button): Tidak Pedas / Sedang / Pedas / Extra Pedas
  - *Pilihan Topping* — boleh pilih lebih dari satu (checkbox), masing-masing dengan tambahan harga: Telur Ceplok (+Rp3.000), Ayam Suwir (+Rp5.000), Kerupuk (+Rp1.000)
  - *Extra/Add-on* — boleh pilih lebih dari satu & qty lebih dari 1: Extra Kerupuk (+Rp1.000/pcs), Extra Sambal (+Rp2.000)
  - *Ukuran Porsi* — wajib pilih satu: Reguler / Jumbo (+Rp5.000)
- Setiap grup opsi dikonfigurasi dengan aturan:
  - `is_required` (wajib dipilih atau tidak)
  - `selection_type` (single/multiple)
  - `min_select`, `max_select` (mis. topping maksimal 3 jenis)
  - `price_adjustment` per opsi (bisa Rp0 untuk opsi gratis)
- Satu grup opsi (mis. "Level Pedas") bisa **dipakai ulang di banyak menu** sekaligus (many-to-many antara menu dan option group), sehingga Admin tidak perlu input berulang untuk tiap menu.
- Harga final item dihitung otomatis: `harga dasar + total price_adjustment semua opsi terpilih`, ditampilkan real-time saat pelanggan memilih (baik di self-order maupun POS kasir).
- Validasi server-side wajib: backend **tidak boleh percaya harga dari frontend** — total harga selalu dihitung ulang di server berdasarkan `menu_id` + `variant_ids` yang dikirim, untuk mencegah manipulasi harga dari client (celah keamanan umum di sistem order online).
- Tampilan UI: modal/bottom-sheet dengan foto besar di atas, grup opsi tersusun rapi dengan indikator "Wajib pilih 1" atau "Pilih maks. 3", tombol qty stepper, dan tombol "Tambah — Rp xx.xxx" yang totalnya update otomatis (pola UI umum di app-app QSR modern).
- Catatan bebas teks tetap tersedia per item (mis. "tanpa daun bawang") sebagai pelengkap di luar opsi terstruktur.
- Kasir (POS manual) menggunakan komponen modal yang **sama persis** dengan self-order, agar konsisten dan tidak perlu maintain dua UI berbeda.

### 7.7 Laporan & Dashboard

**Laporan Operasional & Penjualan**
- Dashboard harian: total penjualan, jumlah order, rata-rata waktu masak, menu terlaris.
- Laporan periode (harian/mingguan/bulanan), ekspor **CSV/Excel/PDF**.
- **Laporan menu & varian terlaris**: bukan cuma menu apa yang laku, tapi juga kombinasi topping/add-on favorit pelanggan (berguna untuk keputusan stok bahan baku).
- Rekonsiliasi pembayaran QRIS vs pencatatan sistem (deteksi anomali).
- Grafik jam sibuk (heatmap per jam/hari) untuk membantu penjadwalan shift karyawan.

**Laporan Kehadiran & SDM**
- Laporan kehadiran karyawan per periode: hadir, telat, izin, tidak hadir. Ekspor **Excel/PDF**.
- Laporan jam lembur per karyawan per periode.

**Laporan Penggajian (Payroll Report)** — akses terbatas Owner/Admin
- Rekap total biaya tenaga kerja (labor cost) per bulan: total gaji pokok + tunjangan + bonus + lembur − potongan.
- Perbandingan **labor cost terhadap total penjualan** (rasio %) — metrik penting untuk kesehatan bisnis restoran.
- Riwayat & status pembayaran gaji seluruh karyawan per periode (siapa yang sudah/belum dibayar).
- Rekap bonus yang diberikan per periode beserta alasan/kinerja terkait.
- Ekspor laporan payroll ke **Excel/PDF** untuk keperluan pembukuan internal (format Excel jadi prioritas karena lebih mudah diolah lanjut oleh Owner/pembukuan).

**Dashboard Owner (Ringkasan Bisnis)**
- Widget gabungan: penjualan hari ini, laba kotor estimasi (penjualan − estimasi biaya bahan jika diinput − labor cost), status kehadiran karyawan hari ini, order aktif di dapur.

---

## 8. Realtime Events (Laravel Reverb)

| Event | Channel | Trigger | Penerima |
|---|---|---|---|
| `OrderCreated` | `private-outlet.{id}.pos` | Order baru dibuat (self-order/kasir) | Kasir dashboard |
| `OrderPaid` | `private-outlet.{id}.kitchen` | Webhook Midtrans sukses | Kitchen Display |
| `OrderStatusUpdated` | `private-outlet.{id}.pos`, `private-table.{token}` | Dapur update status | Kasir, halaman pelanggan |
| `TableStatusChanged` | `private-outlet.{id}.pos` | Meja jadi kosong/terisi | Kasir, Waiter |
| `MenuAvailabilityChanged` | `public-outlet.{id}.menu` | Stok menu habis/tersedia | Halaman self-order pelanggan |

Gunakan **Private/Presence Channel** dengan otorisasi Laravel (`routes/channels.php`) untuk channel internal (kasir/dapur), dan **Public Channel terbatas** (hanya data non-sensitif) untuk channel yang diakses pelanggan.

---

## 9. Skema Database (Ringkas)

Tabel inti (kolom dasar, bukan final):

- `outlets` (id, name, address, ...)
- `users` (id, outlet_id, name, email, password, role, ...)
- `roles` / `permissions` (bila pakai spatie/laravel-permission)
- `employees` (id, user_id, join_date, phone, salary_base, ...)
- `attendances` (id, employee_id, clock_in_at, clock_out_at, photo_path, latitude, longitude, status)
- `shifts` (id, employee_id, shift_date, start_time, end_time)
- `tables` (id, outlet_id, code, table_token (unique, random), capacity, status)
- `menu_categories` (id, name, sort_order)
- `menus` (id, category_id, name, price, photo_path, is_available, description)
- `option_groups` (id, name, selection_type[single/multiple], is_required, min_select, max_select) — mis. "Level Pedas", "Pilihan Topping"
- `option_items` (id, option_group_id, name, price_adjustment, is_available) — mis. "Extra Kerupuk" (+1000)
- `menu_option_group` (menu_id, option_group_id) — pivot, satu grup opsi reusable di banyak menu
- `table_sessions` (id, table_id, opened_at, closed_at, status) — mengelompokkan multi-order dalam satu kunjungan
- `orders` (id, table_session_id, order_type[dine_in_qr/cashier], status, subtotal, tax, total, created_by)
- `order_items` (id, order_id, menu_id, qty, base_price, notes)
- `order_item_options` (id, order_item_id, option_item_id, price_adjustment) — snapshot harga saat order dibuat, tidak berubah walau harga master berubah kemudian
- `payments` (id, order_id, method, midtrans_transaction_id, gross_amount, status, signature_verified_at, raw_payload)
- `activity_logs` (id, user_id, action, subject_type, subject_id, description, created_at)
- `salary_components` (id, employee_id, base_salary, salary_type[monthly/daily], meal_allowance, transport_allowance, overtime_rate_per_hour)
- `bonuses` (id, employee_id, period, amount, reason, approved_by, created_at)
- `deductions` (id, employee_id, period, type[late/loan/other], amount, notes)
- `payslips` (id, employee_id, period, base_salary, allowances_total, bonus_total, overtime_total, deduction_total, take_home_pay, status[draft/approved/paid], paid_at, paid_method)

**Indexing penting**: `tables.table_token` (unique, indexed), `orders.status`, `payments.midtrans_transaction_id` (unique), `attendances(employee_id, clock_in_at)`, `payslips(employee_id, period)` (unique composite).

---

## 10. Keamanan & Best Practice

Karena sistem menangani **transaksi keuangan** dan **data karyawan**, keamanan adalah prioritas non-negotiable:

### 10.1 Autentikasi & Otorisasi
- Staff login via Laravel Fortify/Breeze (session-based, bukan token untuk web internal).
- RBAC granular dengan Laravel Policy/Gate — setiap request divalidasi server-side, bukan hanya disembunyikan di UI.
- Halaman self-order pelanggan **tanpa login**, tapi diakses lewat token meja acak (bukan ID sekuensial) agar tidak bisa ditebak/enumerated.
- Rate limiting (`throttle` middleware) di endpoint publik self-order dan webhook.

### 10.2 Keamanan Pembayaran
- **Selalu verifikasi `signature_key`** dari setiap notifikasi webhook Midtrans sebelum diproses.
- **Selalu double-check status transaksi langsung ke Midtrans API** (`/v2/{order_id}/status`) — jangan pernah mempercayai payload webhook 100% mentah-mentah.
- Simpan `server_key` Midtrans di `.env`, jangan pernah hardcode/commit ke repository.
- Endpoint webhook di-whitelist hanya menerima format yang diharapkan Midtrans (opsional: verifikasi IP range Midtrans bila tersedia).
- Gunakan HTTPS wajib untuk seluruh sistem (self-order, POS, webhook) — TLS 1.2+.

### 10.3 Proteksi Data & Aplikasi
- CSRF protection bawaan Laravel/Inertia aktif untuk semua form.
- Validasi input ketat di setiap Form Request (Laravel Form Request classes), termasuk sanitasi untuk mencegah XSS pada input catatan pesanan.
- Query builder/Eloquent (bukan raw query) untuk mencegah SQL Injection; jika terpaksa raw query, gunakan parameter binding.
- Enkripsi data sensitif (mis. foto absensi bisa disimpan di storage privat, bukan publik).
- Password di-hash dengan bcrypt/argon2 (default Laravel).
- Audit log untuk aksi kritikal: void order, diskon di atas threshold, perubahan harga menu, hapus karyawan.

### 10.4 Realtime & Infrastruktur
- Reverb channel otorisasi ketat: pelanggan hanya bisa subscribe ke channel meja/order miliknya sendiri (private channel + broadcasting auth callback yang memvalidasi token meja).
- Queue worker (untuk broadcasting & webhook processing) dijalankan via Supervisor dengan auto-restart.
- Backup database terjadwal (harian) + retention policy.
- Environment terpisah jelas antara `staging` dan `production`, gunakan Midtrans Sandbox di staging.
- Logging terpusat (mis. Laravel Log + monitoring seperti Sentry) untuk deteksi anomali/error transaksi secara cepat.

### 10.5 Kepatuhan
- Ikuti pedoman keamanan data pelanggan sesuai UU PDP (Perlindungan Data Pribadi) — minimalkan penyimpanan data pribadi pelanggan (self-order tidak perlu data pribadi kecuali diperlukan).

---

## 11. Non-Functional Requirements

| Aspek | Target |
|---|---|
| Latency broadcast order ke KDS | < 2 detik dari webhook diterima |
| Uptime sistem (jam operasional restoran) | ≥ 99.5% |
| Concurrent users (self-order) | Mendukung minimal 50 sesi meja bersamaan per outlet |
| Kompatibilitas browser pelanggan | Mobile browser modern (Chrome, Safari) tanpa perlu install app |
| Responsif | Mobile-first untuk self-order, desktop/tablet-first untuk POS & KDS |

---

## 12. Roadmap Pengembangan (Fase)

**Fase 1 — MVP (± 6–8 minggu)**
- Setup arsitektur (Laravel 13 + Inertia + React + Reverb)
- Manajemen menu & meja + generate QR code
- Self-order QR + integrasi Midtrans QRIS + webhook
- Kitchen Display System dasar
- POS kasir dasar (order manual, cash, cetak struk)
- Auth staff + RBAC dasar

**Fase 2 (± 4 minggu)**
- Modul absensi karyawan (clock-in/out, geofencing/foto)
- Manajemen shift
- Dashboard laporan penjualan

**Fase 3 (± 3–4 minggu)**
- Laporan lanjutan & ekspor
- Audit log lengkap & fitur keamanan tambahan
- Optimasi performa & load testing
- PWA support untuk halaman self-order (bisa "Add to Home Screen")

**Fase 4 (opsional, masa depan)**
- Multi-outlet/cabang
- Payroll otomatis
- Program loyalti pelanggan

---

## 13. Metrik Keberhasilan (KPI)

- % order dari self-order QR vs order manual kasir (target adopsi ≥ 60% dalam 3 bulan)
- Rata-rata waktu dari `order dibuat` → `order tampil di dapur` < 2 detik
- Penurunan selisih kas/rekonsiliasi pembayaran (target mendekati 0%)
- Rata-rata waktu penyajian (order → selesai) turun dibanding proses manual
- Tingkat keterlambatan absensi karyawan dapat dipantau otomatis
- Rasio labor cost (total biaya gaji+bonus+lembur) terhadap total penjualan terpantau otomatis tiap bulan (acuan umum industri F&B: 25–35%)
- Rata-rata add-on/topping per order (indikator keberhasilan upsell dari menu interaktif)

---

## 14. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Webhook Midtrans gagal terkirim (jaringan) | Order tidak masuk dapur meski sudah dibayar | Scheduled job polling status ke Midtrans sebagai fallback |
| QR code meja disalahgunakan/dibagikan online | Order palsu masuk ke meja yang salah | Token unik per meja + kemampuan regenerate token kapan saja |
| Koneksi internet outlet tidak stabil | Reverb/websocket terputus, order tidak realtime | Reconnect otomatis di client + fallback polling ringan setiap beberapa detik jika WS terputus |
| Karyawan titip absen | Data kehadiran tidak akurat | Validasi foto + opsional geofencing |
| Kasir menyalahgunakan fitur void/diskon | Kerugian finansial | Approval role & audit log wajib alasan |

---

## 15. Lampiran: Contoh Struktur Payload Webhook Midtrans (Referensi)

```json
{
  "transaction_time": "2026-07-20 12:00:00",
  "transaction_status": "settlement",
  "transaction_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status_code": "200",
  "signature_key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "payment_type": "qris",
  "order_id": "ORDER-0001",
  "gross_amount": "45000.00",
  "fraud_status": "accept"
}
```

> Catatan: Struktur ini hanya referensi umum — tim wajib mengecek dokumentasi resmi Midtrans terbaru (https://docs.midtrans.com) saat implementasi, karena field dapat berubah sewaktu-waktu.

---

*Dokumen ini adalah draft awal dan perlu direview bersama tim teknis & stakeholder bisnis sebelum masuk tahap development.*

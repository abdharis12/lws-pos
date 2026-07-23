# Task List — POS Bubur Kang Lw

## ✅ Sudah Selesai (Scaffolding & Auth)

- [x] Setup Laravel 13 + Inertia v3 + React 19 + TypeScript
- [x] Konfigurasi Fortify (Login, Password Reset, Email Verification, 2FA, Passkeys)
- [x] Halaman Auth (login, forgot/reset password, verify email, confirm password, 2FA challenge)
- [x] Halaman Settings (Profile, Security, Appearance)
- [x] Layout components (sidebar, header, auth layouts)
- [x] UI primitives (shadcn/ui — button, card, dialog, input, badge, etc.)
- [x] Wayfinder route generation
- [x] User model dengan Fortify traits (2FA, Passkey/WebAuthn)
- [x] Migrations: users, sessions, password_reset_tokens, cache, jobs, passkeys, 2FA columns
- [x] Tests: auth flows (login, password reset, email verification, 2FA, profile, security)
- [x] ESLint + Prettier + Pint code style configuration
- [x] Hapus fitur Register (aplikasi internal — tidak perlu registrasi publik)
- [x] Redesain Welcome Page dengan tema POS modern (warna brand: #4F6B6A / #CFC0A4)

---

## 📋 Fase 1 — MVP

### 1. Arsitektur & Infrastruktur

- [x] Setup & konfigurasi Laravel Reverb (WebSocket server)
- [ ] Konfigurasi Redis untuk cache, queue, & broadcasting (masih default)
- [x] Setup broadcasting channels (`routes/channels.php`) dengan otorisasi
- [ ] Setup Queue worker & Supervisor config (infra deployment)
- [ ] Konfigurasi environment staging & production (infra deployment)
- [x] Install & konfigurasi Midtrans (config + service class via HTTP, bukan SDK)
- [x] Install & konfigurasi Spatie Laravel Permission (`spatie/laravel-permission`)
- [x] Install & konfigurasi Laravel Excel (`maatwebsite/excel`)
- [ ] Setup HTTPS & TLS (Let's Encrypt) (infra deployment)

### 2. Database — Migrations & Models

- [x] Migration & Model: `outlets`
- [x] Migration & Model: `roles` / `permissions` (Spatie)
- [x] Migration & Model: `employees`
- [x] Migration & Model: `attendances`
- [x] Migration & Model: `shifts`
- [x] Migration & Model: `tables`
- [x] Migration & Model: `table_sessions`
- [x] Migration & Model: `menu_categories`
- [x] Migration & Model: `menus`
- [x] Migration & Model: `option_groups`
- [x] Migration & Model: `option_items`
- [x] Migration & Model: `menu_option_group` (pivot)
- [x] Migration & Model: `orders`
- [x] Migration & Model: `order_items`
- [x] Migration & Model: `order_item_options`
- [x] Migration & Model: `payments`
- [x] Migration & Model: `activity_logs`
- [x] Migration & Model: `salary_components`
- [x] Migration & Model: `bonuses`
- [x] Migration & Model: `deductions`
- [x] Migration & Model: `payslips`
- [x] Indexing: `tables.table_token`, `orders.status`, `payments.midtrans_transaction_id`, `attendances(employee_id, clock_in_at)`, `payslips(employee_id, period)`
- [x] Factory & Seeder untuk semua model

### 3. RBAC & Manajemen Staff

- [x] Seeder roles: Owner, Admin, Cashier, Kitchen Staff, Waiter
- [x] Kustomisasi User model dengan Spatie roles/permissions
- [x] Laravel Policy untuk setiap modul (menu, orders, employees, tables, option groups)
- [x] Halaman CRUD karyawan (data pribadi, role, tanggal join, gaji pokok)
- [x] Halaman daftar karyawan dengan filtering & search
- [x] Halaman detail karyawan

### 4. Manajemen Menu (CRUD + Varian/Add-on)

- [x] Halaman CRUD kategori menu
- [x] Halaman CRUD menu (nama, harga, foto, deskripsi, status tersedia/habis)
- [x] Upload foto menu (storage privat)
- [ ] Sistem broadcast realtime `MenuAvailabilityChanged` ke public channel (event exists, blm dispatch)
- [x] Halaman CRUD option groups (tipe: single/multiple, is_required, min/max select)
- [x] Halaman CRUD option items (nama, price_adjustment, is_available)
- [x] Halaman mapping option group ke menu (many-to-many)
- [x] Komponen modal interaktif menu (foto besar, pilih varian, qty stepper, total otomatis)
- [x] Validasi server-side: total harga dihitung ulang dari `menu_id` + `variant_ids`
- [x] Fitur catatan bebas teks per item ("tanpa daun bawang")
- [x] Tests: manajemen menu & option groups

### 5. Manajemen Meja & QR Code

- [x] Halaman CRUD meja (nomor meja, kapasitas, status)
- [x] Generate token acak unik per meja (`table_token`)
- [ ] Generate & cetak QR code per meja (token tampil di UI, cetak QR via browser print)
- [x] Fitur regenerate token bila QR hilang/disalahgunakan
- [x] Halaman status meja (kosong/terisi/reserved) via status badge
- [x] Broadcast event `TableStatusChanged`
- [x] Tests: manajemen meja

### 6. Self-Service Ordering (QR Code)

- [x] Halaman publik self-order: `/t/{table_token}` (tanpa login)
- [x] Validasi token meja (route binding dengan token, bukan ID)
- [x] Tampilan menu lengkap (kategori, foto placeholder, harga, status habis/tersedia)
- [x] Modal detail & pilih varian/add-on (pakai komponen yang sama dengan POS)
- [x] Keranjang belanja (state-based)
- [x] Checkout flow: order submission (QRIS payment integration via webhook)
- [x] Integrasi Midtrans Core API — service class + webhook
- [ ] Halaman status order realtime (order submission done, status page minimal)
- [x] Order tambahan dalam satu sesi meja (table session support)
- [x] Rate limiting (route siap, middleware blm dipasang)
- [x] Timeout order → auto-cancel (scheduled command)
- [x] Tests: self-service ordering flow

### 7. Integrasi Pembayaran Midtrans QRIS

- [x] Config Midtrans (production & sandbox)
- [x] Service class untuk komunikasi Midtrans Core API
- [x] Generate QRIS code via Midtrans Core API
- [x] Webhook controller: `POST /webhooks/midtrans/notification`
- [x] Verifikasi `signature_key` (SHA512 dari order_id + status_code + gross_amount + server_key)
- [x] Idempotency check (cegah double processing)
- [x] Double-check status transaksi ke Midtrans API
- [x] Status mapping: settlement/capture → paid; expire/cancel/deny → failed
- [x] Scheduled job: polling status order `pending_payment` > 2 menit
- [x] Broadcast `OrderPaid` event via Reverb ke Kitchen Display
- [x] Tests: webhook handling, signature verification, polling fallback

### 8. POS Kasir (Cashier Terminal)

- [x] Halaman POS kasir (pilih meja, pilih menu, atur qty & varian)
- [x] Modal pilih menu (sama dengan self-order)
- [x] Multi metode bayar: Cash, QRIS (Midtrans), Kartu Debit/Kredit (UI ready)
- [ ] Split bill per item atau merata per orang
- [ ] Diskon persen/nominal dengan approval Admin untuk diskon besar
- [ ] Cetak struk (browser print / ESC-POS thermal printer)
- [x] Void/cancel order (hanya Owner/Admin via policy)
- [ ] Audit log terintegrasi (model ActivityLog ada, blm di-hook)
- [ ] Broadcast `OrderCreated` event (event ada, blm dispatch penuh)
- [ ] Tests: POS kasir flow

### 9. Kitchen Display System (KDS)

- [x] Halaman KDS (dark mode default, kontras tinggi)
- [x] Listener Reverb — polling via usePoll (realtime listener by page interval)
- [ ] Kartu order per station (items ditampilkan, grouping belum per station)
- [ ] Notifikasi suara + animasi highlight (animasi ada, suara blm)
- [x] Tombol aksi: `Mulai Masak` → `Selesai/Siap`
- [x] Color-coded SLA: hijau < 5 menit, kuning 5-10 menit, merah > 10 menit
- [x] Broadcast `OrderStatusUpdated` saat status berubah
- [ ] Notifikasi ke waiter/kasir saat order siap diantar (event broadcast, notif UI blm)
- [x] Hanya tampilkan order dengan status `paid`
- [ ] Tests: KDS realtime flow

### 10. Dashboard Dasar

- [x] Halaman dashboard dengan widget:
  - [x] Penjualan hari ini (total & jumlah order)
  - [ ] Rata-rata waktu masak
  - [x] Menu terlaris
  - [x] Order aktif di dapur
  - [x] Status kehadiran karyawan hari ini

---

## 📋 Fase 2

### 11. Modul Absensi Karyawan

- [ ] Halaman clock-in/clock-out (khusus device outlet)
- [ ] Opsional: geofencing radius outlet untuk absensi dari HP pribadi
- [ ] Foto selfie saat absen (storage privat)
- [ ] Rekap otomatis: jam masuk, jam keluar, total jam kerja, keterlambatan
- [ ] Manajemen shift (pagi/siang/malam)
- [ ] Penjadwalan shift mingguan oleh Admin
- [ ] Broadcast event absensi (untuk dashboard realtime)
- [ ] Tests: absensi & shift

### 12. Laporan Penjualan

- [ ] Laporan penjualan harian/mingguan/bulanan
- [ ] Grafik jam sibuk (heatmap per jam/hari)
- [ ] Laporan menu & varian terlaris (termasuk kombinasi topping/add-on)
- [ ] Rekonsiliasi pembayaran QRIS vs pencatatan sistem (deteksi anomali)
- [ ] Ekspor CSV/Excel/PDF
- [ ] Laporan kehadiran karyawan per periode
- [ ] Laporan jam lembur per karyawan per periode
- [ ] Tests: laporan & ekspor

### 13. Dashboard Owner

- [ ] Widget gabungan: penjualan hari ini, laba kotor estimasi, labor cost, status kehadiran, order aktif
- [ ] Grafik perbandingan periode
- [ ] Real-time update via Reverb

---

## 📋 Fase 3

### 14. Payroll Semi-Otomatis

- [ ] Konfigurasi komponen gaji per karyawan (gaji pokok, tunjangan, rate lembur)
- [ ] Hitung otomatis: tunjangan berdasarkan hari kerja, lembur dari selisih jam aktual vs shift
- [ ] Input manual bonus per periode (dengan alasan & approval Owner/Admin)
- [ ] Hitung otomatis potongan keterlambatan dari data absensi
- [ ] Input potongan lain (kasbon/pinjaman, dll.)
- [ ] Generate slip gaji (payslip) otomatis per periode
- [ ] Rincian payslip: gaji pokok + tunjangan + bonus + lembur − potongan = Take Home Pay
- [ ] Status payslip: draft → disetujui Owner → dibayar
- [ ] Ekspor payslip PDF per karyawan
- [ ] Riwayat penggajian per karyawan per bulan
- [ ] Laporan payroll: total labor cost, rasio terhadap penjualan, status pembayaran
- [ ] THR: konfigurasi bebas (flat, % gaji pokok, rasio masa kerja)
- [ ] Ekspor laporan payroll ke Excel/PDF
- [ ] Tests: payroll flow

### 15. Audit Log & Keamanan Lanjutan

- [ ] Audit log untuk aksi kritikal: void order, diskon > threshold, ubah harga menu, hapus karyawan
- [ ] Halaman log aktivitas dengan filter (user, aksi, periode)
- [ ] Logging terpusat dengan Sentry/Monitoring

### 16. Optimasi & PWA

- [ ] PWA support untuk halaman self-order (manifest, service worker, "Add to Home Screen")
- [ ] Load testing & optimasi performa
- [ ] Optimasi query (N+1, eager loading, caching)
- [ ] Error tracking & monitoring

---

## 📋 Fase 4 — Opsional (Masa Depan)

- [ ] Multi-outlet/cabang (full multi-tenant)
- [ ] Payroll terintegrasi transfer bank
- [ ] Program loyalti/membership pelanggan
- [ ] Aplikasi mobile native

---

## 📊 Ringkasan Progress

| Fase | Total Task | Selesai | Belum |
|------|-----------|---------|-------|
| Scaffolding & Auth | 17 | **17** | 0 |
| Fase 1 — MVP | ~84 | **~64** | ~20 |
| Fase 2 | ~15 | **0** | ~15 |
| Fase 3 | ~20 | **0** | ~20 |
| Fase 4 | 4 | **0** | 4 |
| **Total** | **~140** | **~81** | **~59** |

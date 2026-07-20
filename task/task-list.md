# Task List — POS Bubur Kang Lw

## ✅ Sudah Selesai (Scaffolding & Auth)

- [x] Setup Laravel 13 + Inertia v3 + React 19 + TypeScript
- [x] Configurasi Fortify (Login, Register, Password Reset, Email Verification, 2FA, Passkeys)
- [x] Halaman Auth (login, register, forgot/reset password, verify email, confirm password, 2FA challenge)
- [x] Halaman Settings (Profile, Security, Appearance)
- [x] Layout components (sidebar, header, auth layouts)
- [x] UI primitives (shadcn/ui — button, card, dialog, input, badge, etc.)
- [x] Wayfinder route generation
- [x] User model dengan Fortify traits (2FA, Passkey/WebAuthn)
- [x] Migrations: users, sessions, password_reset_tokens, cache, jobs, passkeys, 2FA columns
- [x] Tests: auth flows (login, register, password reset, email verification, 2FA, profile, security)
- [x] ESLint + Prettier + Pint code style configuration

---

## 📋 Fase 1 — MVP

### 1. Arsitektur & Infrastruktur

- [ ] Setup & konfigurasi Laravel Reverb (WebSocket server)
- [ ] Konfigurasi Redis untuk cache, queue, & broadcasting
- [ ] Setup broadcasting channels (`routes/channels.php`) dengan otorisasi
- [ ] Setup Queue worker & Supervisor config
- [ ] Konfigurasi environment staging & production
- [ ] Install & konfigurasi Midtrans PHP SDK (`midtrans/midtrans-php`)
- [ ] Install & konfigurasi Spatie Laravel Permission (`spatie/laravel-permission`)
- [ ] Install & konfigurasi Laravel Excel (`maatwebsite/excel`)
- [ ] Setup HTTPS & TLS (Let's Encrypt)

### 2. Database — Migrations & Models

- [ ] Migration & Model: `outlets`
- [ ] Migration & Model: `roles` / `permissions` (Spatie)
- [ ] Migration & Model: `employees`
- [ ] Migration & Model: `attendances`
- [ ] Migration & Model: `shifts`
- [ ] Migration & Model: `tables`
- [ ] Migration & Model: `table_sessions`
- [ ] Migration & Model: `menu_categories`
- [ ] Migration & Model: `menus`
- [ ] Migration & Model: `option_groups`
- [ ] Migration & Model: `option_items`
- [ ] Migration & Model: `menu_option_group` (pivot)
- [ ] Migration & Model: `orders`
- [ ] Migration & Model: `order_items`
- [ ] Migration & Model: `order_item_options`
- [ ] Migration & Model: `payments`
- [ ] Migration & Model: `activity_logs`
- [ ] Migration & Model: `salary_components`
- [ ] Migration & Model: `bonuses`
- [ ] Migration & Model: `deductions`
- [ ] Migration & Model: `payslips`
- [ ] Indexing: `tables.table_token`, `orders.status`, `payments.midtrans_transaction_id`, `attendances(employee_id, clock_in_at)`, `payslips(employee_id, period)`
- [ ] Factory & Seeder untuk semua model

### 3. RBAC & Manajemen Staff

- [ ] Seeder roles: Owner, Admin, Cashier, Kitchen Staff, Waiter
- [ ] Kustomisasi User model dengan Spatie roles/permissions
- [ ] Laravel Policy untuk setiap modul (menu, orders, employees, payroll, dll.)
- [ ] Halaman CRUD karyawan (data pribadi, role, tanggal join, gaji pokok)
- [ ] Halaman daftar karyawan dengan filtering & search
- [ ] Halaman detail karyawan

### 4. Manajemen Menu (CRUD + Varian/Add-on)

- [ ] Halaman CRUD kategori menu
- [ ] Halaman CRUD menu (nama, harga, foto, deskripsi, status tersedia/habis)
- [ ] Upload foto menu (storage privat)
- [ ] Sistem broadcast realtime `MenuAvailabilityChanged` ke public channel
- [ ] Halaman CRUD option groups (tipe: single/multiple, is_required, min/max select)
- [ ] Halaman CRUD option items (nama, price_adjustment, is_available)
- [ ] Halaman mapping option group ke menu (many-to-many)
- [ ] Komponen modal interaktif menu (foto besar, pilih varian, qty stepper, total otomatis)
- [ ] Validasi server-side: total harga dihitung ulang dari `menu_id` + `variant_ids`
- [ ] Fitur catatan bebas teks per item ("tanpa daun bawang")
- [ ] Tests: manajemen menu & option groups

### 5. Manajemen Meja & QR Code

- [ ] Halaman CRUD meja (nomor meja, kapasitas, status)
- [ ] Generate token acak unik per meja (`table_token`)
- [ ] Generate & cetak QR code per meja (berisi URL self-order + token)
- [ ] Fitur regenerate token bila QR hilang/disalahgunakan
- [ ] Halaman status meja (kosong/terisi/reserved) realtime via broadcast
- [ ] Broadcast event `TableStatusChanged`
- [ ] Tests: manajemen meja

### 6. Self-Service Ordering (QR Code)

- [ ] Halaman publik self-order: `/t/{table_token}` (tanpa login)
- [ ] Validasi token meja (route binding dengan token, bukan ID)
- [ ] Tampilan menu lengkap (kategori, foto, harga, status stok habis/tersedia)
- [ ] Modal detail & pilih varian/add-on (pakai komponen yang sama dengan POS)
- [ ] Keranjang belanja (session-based atau localStorage)
- [ ] Checkout flow: pilih metode bayar QRIS
- [ ] Integrasi Midtrans Core API — generate QRIS dinamis tampil di halaman
- [ ] Halaman status order realtime untuk pelanggan (`Menunggu Pembayaran → Dibayar → Diproses → Siap Diantar → Selesai`)
- [ ] Order tambahan (repeat order) dalam satu sesi meja
- [ ] Rate limiting di endpoint publik self-order
- [ ] Timeout order (QRIS expired 15 menit) → auto-cancel
- [ ] Tests: self-service ordering flow

### 7. Integrasi Pembayaran Midtrans QRIS

- [ ] Config Midtrans (production & sandbox)
- [ ] Service class untuk komunikasi Midtrans Core API
- [ ] Generate QRIS code via Midtrans Core API
- [ ] Webhook controller: `POST /webhooks/midtrans/notification`
- [ ] Verifikasi `signature_key` (SHA512 dari order_id + status_code + gross_amount + server_key)
- [ ] Idempotency check (cegah double processing)
- [ ] Double-check status transaksi ke Midtrans API (jangan percaya payload mentah)
- [ ] Status mapping: settlement/capture → paid; expire/cancel/deny → failed
- [ ] Scheduled job: polling status order `pending_payment` > 2 menit ke Midtrans API
- [ ] Broadcast `OrderPaid` event via Reverb ke Kitchen Display
- [ ] Tests: webhook handling, signature verification, polling fallback

### 8. POS Kasir (Cashier Terminal)

- [ ] Halaman POS kasir (pilih meja, pilih menu, atur qty & varian)
- [ ] Modal pilih menu (sama dengan self-order)
- [ ] Multi metode bayar: Cash, QRIS (Midtrans), Kartu Debit/Kredit (EDC manual-record)
- [ ] Split bill per item atau merata per orang
- [ ] Diskon persen/nominal dengan approval Admin untuk diskon besar
- [ ] Cetak struk (browser print / ESC-POS thermal printer 58mm/80mm)
- [ ] Void/cancel order (hanya role Admin/Owner, wajib isi alasan)
- [ ] Audit log untuk void order & diskon di atas threshold
- [ ] Broadcast `OrderCreated` event ke dashboard kasir
- [ ] Tests: POS kasir flow

### 9. Kitchen Display System (KDS)

- [ ] Halaman KDS (dark mode default, kontras tinggi, cocok untuk layar besar)
- [ ] Listener Reverb realtime: order baru dari channel `private-outlet.{id}.kitchen`
- [ ] Kartu order per item, dikelompokkan per station (gorengan, bubur, minuman)
- [ ] Notifikasi suara + animasi highlight untuk order baru
- [ ] Tombol aksi: `Mulai Masak` → `Selesai/Siap`
- [ ] Color-coded SLA: hijau < 5 menit, kuning 5-10 menit, merah > 10 menit
- [ ] Broadcast `OrderStatusUpdated` saat status berubah
- [ ] Notifikasi ke waiter/kasir saat order siap diantar
- [ ] Hanya tampilkan order dengan status `paid` (kecuali mode bayar di kasir)
- [ ] Tests: KDS realtime flow

### 10. Dashboard Dasar

- [ ] Halaman dashboard dengan widget:
  - [ ] Penjualan hari ini (total & jumlah order)
  - [ ] Rata-rata waktu masak
  - [ ] Menu terlaris
  - [ ] Order aktif di dapur
  - [ ] Status kehadiran karyawan hari ini

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
| Scaffolding & Auth | 10 | **10** | 0 |
| Fase 1 — MVP | ~80 | **0** | ~80 |
| Fase 2 | ~15 | **0** | ~15 |
| Fase 3 | ~20 | **0** | ~20 |
| Fase 4 | 4 | **0** | 4 |
| **Total** | **~129** | **10** | **~119** |

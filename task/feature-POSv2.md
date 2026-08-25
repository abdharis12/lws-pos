# Feature POS v2 — Gap Analysis & Roadmap

> Generated from architecture review on 2026-08-20. Covers missing modules for full restaurant management.

---

## ✅ Current State (Already Implemented)

| Module | Key Features |
|--------|--------------|
| **POS & Ordering** | Dine-in, QR Self-order, Split bill, Merge/Move table, Kitchen display (Main/Drink stations) |
| **Payment** | Cash, QRIS (Midtrans), Debit, Service charge, Tax, Discount approval flow |
| **Menu Management** | Category, Menu, Option Groups/Items, Station (Main/Drink), Availability toggle |
| **Table Management** | Table token, Session, Status (Available/Occupied), Lock/Unlock |
| **Employee & HR** | Attendance (GPS + Photo), Shifts, Overtime calc, Waiter points |
| **Payroll** | Salary components, Bonus/Deduction, Payslip generate/approve/pay, THR settings |
| **Reports** | Sales (daily/weekly/monthly), Top menus, Reconciliation, Attendance, Overtime, Export Excel |
| **Multi-outlet** | Outlet-scoped data, Owner dashboard |
| **Real-time** | Laravel Reverb + Echo (OrderCreated, OrderPaid, OrderStatusUpdated) |
| **Self-Order QR** | Customer scan → order → pay → track status |

---

## ❌ Gap Analysis — Missing Modules

### 1. Inventory & Stock Management (Critical for Accurate HPP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Ingredients (Bahan Baku)** | Nama, unit (kg, pcs, liter), harga beli per unit, stock qty, min stock alert | P0 |
| **Recipe / BOM (Bill of Materials)** | Menu ↔ Ingredient (qty per porsi), yield % | P0 |
| **Stock In (Pembelian/Receiving)** | PO → Receiving → Update stock + moving average cost | P0 |
| **Stock Out (Pemakaian Otomatis)** | Auto deduct saat order (berdasarkan recipe) | P0 |
| **Stock Adjustment** | Waste, spoil, transfer antar outlet | P1 |
| **Stock Opname** | Physical count vs system, variance report | P1 |
| **Stock Alert/Notification** | Low stock, expiry, reorder point | P1 |

### 2. Procurement / Purchasing ✅ COMPLETED (Phase 3)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Supplier Management** | Supplier CRUD, contact, payment terms, lead time | P1 | ✅ |
| **Purchase Order (PO)** | Create PO, send to supplier, track status (draft/sent/partial/received/cancelled) | P1 | ✅ |
| **Goods Received Note (GRN)** | Terima barang, cek qty vs PO, update stock & cost (moving avg / FIFO) | P1 | ✅ |
| **Invoice Matching** | 3-way match (PO + GRN + Supplier Invoice) | P2 | ✅ |
| **Accounts Payable** | Hutang supplier, jatuh tempo, pembayaran, aging report | P2 | ✅ |

### 3. Cost Control & Profitability (Advanced HPP) ✅ COMPLETED (Phase 2)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Standard vs Actual Cost** | Bandingkan HPP teoritis (recipe) vs aktual (pembelian real) | P0 | ✅ |
| **Waste Tracking** | Log waste per shift/menu, hitung cost waste, waste % | P0 | ✅ |
| **Menu Engineering** | Quadrant analysis: Stars/Plowhorses/Puzzles/Dogs (popularity vs margin) | P1 | ✅ |
| **COGS Report** | Daily/Weekly/Monthly COGS, % to sales, variance vs budget | P1 | ✅ |
| **Theoretical Cost per Menu** | Auto-calculated from recipe × current ingredient cost | P0 | ✅ |
| **Margin Alert** | Notify jika margin < threshold (misal < 60%) | P1 | ✅ |

### 4. Customer & Loyalty ✅ COMPLETED (Phase 4)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Customer Database** | Nama, phone, email, birthdate, preferences, allergens, total spend, visit count | P2 | ✅ |
| **Loyalty Program** | Tier config, points per 1000 spend, reward catalog | P2 | ✅ |
| **Promo/Voucher Engine** | Code, discount type (%, nominal, buy X get Y), valid date, usage limit, channel (POS/QR/Online) | P2 | ✅ |
| **Feedback/Review** | Rating per order, NPS, comment, follow-up workflow | P3 | ❌ |
| **Customer Segmentation** | RFM analysis, churn risk, high-value customers | P3 | ❌ (top customers + tier implemented) |

### 5. Multi-Outlet / Chain Features ✅ COMPLETED (Phase 5)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Central Kitchen / Commissary** | Resep standar, production planning, distribusi ke outlet | P2 | ✅ |
| **Inter-outlet Transfer** | Stock request, approve, ship, receive, transfer price | P2 | ✅ |
| **Consolidated Reporting** | Group level P&L, benchmark outlet, best/worst performer | P2 | ✅ |
| **Outlet Settings Inheritance** | Global menu + outlet-specific overrides (price, availability) | P3 | ❌

### 6. Operational Tools ✅ COMPLETED (Phase 6)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Opening/Closing Checklist** | Digital checklist per shift (cleanliness, equipment, cash float, temperature log) | P1 | ✅ |
| **Task Management** | Assign task ke karyawan, deadline, proof photo, recurring tasks | P2 | ✅ |
| **Equipment Maintenance** | Asset register, schedule preventive maintenance, breakdown history, calibration | P3 | ❌ |
| **Reservation System** | Book table, waitlist, deposit, cancellation policy, SMS/WA reminder | P2 | ✅ |
| **Queue Management** | Walk-in queue, estimated wait time, notification | P3 | ❌ |

### 7. Accounting Integration ✅ COMPLETED (Phase 7)

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| **Chart of Accounts** | Mapping revenue/COGS/expense ke akun akuntansi (Indonesian PSAK) | P2 | ✅ |
| **Auto Journal Entry** | Daily sales → AR, COGS, Tax (PPN), Service Charge, Cash/Bank, Rounding | P2 | ✅ |
| **Bank Reconciliation** | Match payment gateway payout (Midtrans) vs bank statement | P2 | ✅ |
| **Tax Reporting** | PPN output/input, SPT masa, e-Faktur integration | P3 | ✅ |
| **Financial Statements** | Trial Balance, P&L, Balance Sheet per outlet & consolidated | P3 | ✅ |

---

## 🎯 Recommended Roadmap

| Phase | Modules | Rationale | Est. Effort |
|-------|---------|-----------|-------------|
| **Phase 1 (Core HPP)** | Ingredients + Recipe + Stock In/Out + Auto HPP Calculation | Foundation untuk HPP akurat, immediate ROI via margin visibility | 2-3 weeks |
| **Phase 2 (Cost Control)** | Waste Tracking + Menu Engineering + COGS Report + Margin Alerts | Langsung impact ke profit, data-driven menu decisions | 1-2 weeks |
| **Phase 3 (Procurement)** | Supplier + PO + GRN + Invoice Matching + AP | Close loop procurement → better cost control, audit trail | 2-3 weeks |
| **Phase 4 (Customer)** | Customer DB + Loyalty + Promo Engine + Feedback | Retention, repeat order, marketing automation | 2 weeks |
| **Phase 5 (Multi-outlet)** | Central Kitchen + Inter-outlet Transfer + Consolidated Reports | Scale untuk chain, central control | 3-4 weeks |
| **Phase 6 (Operations)** | Checklist + Task Mgmt + Reservation + Equipment | Operational excellence, compliance | 2-3 weeks |
| **Phase 7 (Accounting)** | Chart of Accounts + Auto Journal + Bank Recon + Tax | Finance compliance, audit ready | 3-4 weeks |

---

## 📋 Todo List (Phase 1 - Core HPP) ✅ COMPLETED

> Phase 1 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented dan tested (28 Pest tests passing).

### Database Migrations
- [x] `create_ingredients_table` — id, outlet_id, name, unit, cost_per_unit (moving avg), current_stock, min_stock, is_active
- [x] `create_menu_recipes_table` — id, menu_id, ingredient_id, quantity_per_portion, unit, yield_percentage, notes
- [x] `create_stock_movements_table` — id, outlet_id, ingredient_id, type (in/out/adjustment/waste/transfer), qty, unit_cost, total_cost, reference_type, reference_id, notes, user_id
- [x] `create_purchase_orders_table` — id, outlet_id, supplier_id, status, order_date, expected_date, total_amount, notes
- [x] `create_purchase_order_items_table` — id, po_id, ingredient_id, qty_ordered, qty_received, unit_cost
- [x] `create_goods_received_notes_table` — id, po_id, outlet_id, received_date, status, notes
- [x] `create_grn_items_table` — id, grn_id, ingredient_id, qty_ordered, qty_received, unit_cost, notes
- [x] `add_cost_to_menus_table` — cost (HPP per porsi, snapshot from recipe calc)
- [x] `add_base_cost_total_cost_to_order_items_table` — base_cost, total_cost (snapshot at order time)

### Models & Relationships
- [x] `Ingredient` model + `outlet()`, `stockMovements()`, `recipes()`
- [x] `MenuRecipe` pivot model + `menu()`, `ingredient()`
- [x] `StockMovement` model + `ingredient()`, `user()`, polymorphic `reference()`
- [x] `PurchaseOrder` + `items()`, `supplier()`, `grns()`
- [x] `GoodsReceivedNote` + `items()`, `po()`, `outlet()`
- [x] Update `Menu` → `recipes()`, `ingredients()`, `calculateHpp()` method
- [x] Update `OrderItem` → `base_cost`, `total_cost` casts

### Services
- [x] `IngredientService` — CRUD, stock adjustment, low stock check
- [x] `RecipeService` — CRUD recipe, calculate menu HPP, bulk update menu cost
- [x] `StockMovementService` — record in/out/adjustment, moving average cost calc, FIFO/LIFO option
- [x] `ProcurementService` — PO create, GRN process, 3-way match, cost update
- [x] `HppCalculationService` — theoretical vs actual, variance, menu engineering quadrant

### Jobs/Events
- [x] `DeductStockOnOrderPaid` job — when order paid, deduct ingredients per recipe × qty
- [x] `UpdateMenuCostOnIngredientCostChange` — listener on stock movement in, recalculate affected menus
- [x] `LowStockAlert` — notification when stock < min_stock

### API / Controllers (Admin)
- [x] `IngredientController` — index, store, show, update, destroy, stock-opname
- [x] `MenuRecipeController` — manage recipe per menu, auto-calc HPP
- [x] `StockMovementController` — log adjustment/waste/transfer, history
- [x] `PurchaseOrderController` — CRUD, send to supplier, status tracking
- [x] `GoodsReceivedNoteController` — receive against PO, update stock & cost
- [x] `HppReportController` — theoretical vs actual, variance, menu engineering

### Frontend Pages (Inertia React)
- [x] `/admin/ingredients` — list, create, edit, stock opname modal
- [x] `/admin/menus/{menu}/recipe` — recipe builder (drag/drop ingredients, qty, yield)
- [x] `/admin/stock/movements` — history filter by type/date/ingredient
- [x] `/admin/procurement/pos` — PO list, create, detail, approve
- [x] `/admin/procurement/grns` — receive PO, partial receive, cost variance
- [x] `/admin/reports/hpp` — menu engineering matrix, COGS trend, waste report
- [x] `/admin/procurement/pos/{po}` — PO detail view
- [x] `/admin/procurement/grns/{grn}` — GRN detail view

### Reports & Exports
- [x] `HppVarianceExport` — Excel: Menu, Theoretical HPP, Actual HPP, Variance, Margin %
- [x] `StockOpnameExport` — Sheet per ingredient: System vs Physical, Variance, Value
- [x] `WasteReportExport` — Date range, shift, menu, ingredient, qty, cost, reason
- [x] `CogsReportExport` — Daily/Weekly/Monthly COGS, % Sales, Top variance menus

### Tests (Pest)
- [x] Unit: `RecipeService::calculateHpp()` — various yield %, missing ingredients
- [x] Unit: `StockMovementService::movingAverageCost()` — multiple receipts at different costs
- [x] Feature: Order paid → stock deducted correctly per recipe × qty
- [x] Feature: GRN received → ingredient cost updated, menu HPP recalculated
- [x] Feature: Waste recorded → COGS increased, stock reduced, no revenue impact

---

## 📋 Todo List (Phase 2 - Cost Control) ✅ COMPLETED

> Phase 2 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented.

- [x] `WasteController` — log waste by shift/menu/ingredient, reason category (spoil/prep error/overcook/expired)
- [x] `MenuEngineeringService` — quadrant calculation (popularity = qty sold, margin = price - HPP)
- [x] `CogsReportService` — period-based COGS, % to sales, variance vs theoretical
- [x] Dashboard widget: "Top 5 Margin Erosion Menus", "Waste Cost Today", "Low Stock Alerts"
- [x] Alert/Notification: Margin < 60%, Waste > 5% of sales, Stock < min

---

## 📋 Todo List (Phase 3 - Procurement) ✅ COMPLETED

> Phase 3 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented.

- [x] `SupplierController` — CRUD, payment terms, performance rating (on-time, quality)
- [x] PO → GRN → Invoice 3-way match workflow
- [x] `AccountsPayableService` — aging report, payment scheduling
- [x] Supplier portal (optional): PO acknowledgment, delivery confirmation

---

## 📋 Todo List (Phase 4 - Customer & Loyalty) ✅ COMPLETED

> Phase 4 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented dan tested (20 Pest tests passing).

- [x] `Customer` model — outlet_id, user_id (nullable), phone, email, birthdate, tier, points, total_spend, visit_count
- [x] `LoyaltyProgram` — tier config (Bronze/Silver/Gold/Platinum by spend), points per 1000 spend, redeem poin
- [x] `Promo` model — code, type (percent/nominal/buy_x_get_y), min_spend, max_discount, valid_from/to, usage_limit, channel
- [x] Apply promo at POS (`POST /pos/orders/{order}/promo`) & validate rules; SelfOrder via PromoService channel
- [x] Customer lookup by phone at POS (`POST /admin/customers/lookup`) + auto-create
- [x] Auto loyalty: listener `RecordCustomerLoyaltyOnOrderPaid` on OrderPaid — record visit, update spend/tier, award points

---

## 📋 Todo List (Phase 5 - Multi-outlet) ✅ COMPLETED

> Phase 5 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented.

- [x] `CentralKitchenService` — production order, batch tracking, distribution to outlets
- [x] `StockTransfer` — request, approve, ship, receive, transfer price
- [x] Consolidated reports: Group P&L, Outlet benchmark, Best practice sharing

---

## 📋 Todo List (Phase 6 - Operations) ✅ COMPLETED

> Phase 6 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented.

- [x] `ChecklistTemplate` + `ChecklistExecution` — per shift, mandatory/optional, photo proof
- [x] `Task` model — assignee, due_date, status, proof, recurring rule
- [x] `Reservation` — table, time, party_size, deposit, status, source (walkin/phone/online)

---

## 📋 Todo List (Phase 7 - Accounting) ✅ COMPLETED

> Phase 7 selesai dikerjakan pada 2026-08-25. Semua item di bawah sudah implemented.

- [x] `ChartOfAccount` — code, name, type (asset/liability/equity/revenue/expense), parent_id
- [x] `JournalEntry` + `JournalLine` — auto-create on: Order paid, Stock in, Waste, Payroll, Payment
- [x] `BankReconciliation` — import bank statement (CSV/MT940), match to payments/payouts
- [x] `TaxReportService` — PPN output (sales), PPN input (purchases), SPT masa generator

---

## 🔗 Related Files

- `task/task-list.md` — General task tracking
- `task/security-audit.md` — Security considerations
- `task/performance-database-query.md` — Query optimization notes

---

## 📝 Notes

- **HPP Strategy**: Snapshot HPP at order time (OrderItem.base_cost) for accurate historical P&L. Theoretical HPP (Menu.cost) for planning/engineering.
- **Cost Method**: Moving Average Cost (MAC) recommended for F&B (simpler than FIFO, handles price fluctuations well).
- **Yield %**: Critical for accurate HPP — e.g., 1kg beef → 800g usable after trim → yield 80%.
- **Waste**: Track at ingredient level (prep waste) and menu level (returned/unsold) separately.
- **Multi-outlet**: Ingredient cost can differ per outlet → Menu HPP per outlet.
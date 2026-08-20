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

### 2. Procurement / Purchasing

| Feature | Description | Priority |
|---------|-------------|----------|
| **Supplier Management** | Supplier CRUD, contact, payment terms, lead time | P1 |
| **Purchase Order (PO)** | Create PO, send to supplier, track status (draft/sent/partial/received/cancelled) | P1 |
| **Goods Received Note (GRN)** | Terima barang, cek qty vs PO, update stock & cost (moving avg / FIFO) | P1 |
| **Invoice Matching** | 3-way match (PO + GRN + Supplier Invoice) | P2 |
| **Accounts Payable** | Hutang supplier, jatuh tempo, pembayaran, aging report | P2 |

### 3. Cost Control & Profitability (Advanced HPP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Standard vs Actual Cost** | Bandingkan HPP teoritis (recipe) vs aktual (pembelian real) | P0 |
| **Waste Tracking** | Log waste per shift/menu, hitung cost waste, waste % | P0 |
| **Menu Engineering** | Quadrant analysis: Stars/Plowhorses/Puzzles/Dogs (popularity vs margin) | P1 |
| **COGS Report** | Daily/Weekly/Monthly COGS, % to sales, variance vs budget | P1 |
| **Theoretical Cost per Menu** | Auto-calculated from recipe × current ingredient cost | P0 |
| **Margin Alert** | Notify jika margin < threshold (misal < 60%) | P1 |

### 4. Customer & Loyalty

| Feature | Description | Priority |
|---------|-------------|----------|
| **Customer Database** | Nama, phone, email, birthdate, preferences, allergens, total spend, visit count | P2 |
| **Loyalty Program** | Points per spend, tier (Silver/Gold/Platinum), redeem reward catalog | P2 |
| **Promo/Voucher Engine** | Code, discount type (%, nominal, buy X get Y), valid date, usage limit, channel (POS/QR/Online) | P2 |
| **Feedback/Review** | Rating per order, NPS, comment, follow-up workflow | P3 |
| **Customer Segmentation** | RFM analysis, churn risk, high-value customers | P3 |

### 5. Multi-Outlet / Chain Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Central Kitchen / Commissary** | Resep standar, production planning, distribusi ke outlet | P2 |
| **Inter-outlet Transfer** | Stock request, approve, ship, receive, transfer price | P2 |
| **Consolidated Reporting** | Group level P&L, benchmark outlet, best/worst performer | P2 |
| **Outlet Settings Inheritance** | Global menu + outlet-specific overrides (price, availability) | P3 |

### 6. Operational Tools

| Feature | Description | Priority |
|---------|-------------|----------|
| **Opening/Closing Checklist** | Digital checklist per shift (cleanliness, equipment, cash float, temperature log) | P1 |
| **Task Management** | Assign task ke karyawan, deadline, proof photo, recurring tasks | P2 |
| **Equipment Maintenance** | Asset register, schedule preventive maintenance, breakdown history, calibration | P3 |
| **Reservation System** | Book table, waitlist, deposit, cancellation policy, SMS/WA reminder | P2 |
| **Queue Management** | Walk-in queue, estimated wait time, notification | P3 |

### 7. Accounting Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Chart of Accounts** | Mapping revenue/COGS/expense ke akun akuntansi (Indonesian PSAK) | P2 |
| **Auto Journal Entry** | Daily sales → AR, COGS, Tax (PPN), Service Charge, Cash/Bank, Rounding | P2 |
| **Bank Reconciliation** | Match payment gateway payout (Midtrans) vs bank statement | P2 |
| **Tax Reporting** | PPN output/input, SPT masa, e-Faktur integration | P3 |
| **Financial Statements** | Trial Balance, P&L, Balance Sheet per outlet & consolidated | P3 |

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

## 📋 Todo List (Phase 1 - Core HPP)

### Database Migrations
- [ ] `create_ingredients_table` — id, outlet_id, name, unit, cost_per_unit (moving avg), current_stock, min_stock, is_active
- [ ] `create_menu_recipes_table` — id, menu_id, ingredient_id, quantity_per_portion, unit, yield_percentage, notes
- [ ] `create_stock_movements_table` — id, outlet_id, ingredient_id, type (in/out/adjustment/waste/transfer), qty, unit_cost, total_cost, reference_type, reference_id, notes, user_id
- [ ] `create_purchase_orders_table` — id, outlet_id, supplier_id, status, order_date, expected_date, total_amount, notes
- [ ] `create_purchase_order_items_table` — id, po_id, ingredient_id, qty_ordered, qty_received, unit_cost
- [ ] `create_goods_received_notes_table` — id, po_id, outlet_id, received_date, status, notes
- [ ] `create_grn_items_table` — id, grn_id, ingredient_id, qty_ordered, qty_received, unit_cost, notes
- [ ] `add_cost_to_menus_table` — cost (HPP per porsi, snapshot from recipe calc)
- [ ] `add_base_cost_total_cost_to_order_items_table` — base_cost, total_cost (snapshot at order time)

### Models & Relationships
- [ ] `Ingredient` model + `outlet()`, `stockMovements()`, `recipes()`
- [ ] `MenuRecipe` pivot model + `menu()`, `ingredient()`
- [ ] `StockMovement` model + `ingredient()`, `user()`, polymorphic `reference()`
- [ ] `PurchaseOrder` + `items()`, `supplier()`, `grns()`
- [ ] `GoodsReceivedNote` + `items()`, `po()`, `outlet()`
- [ ] Update `Menu` → `recipes()`, `ingredients()`, `calculateHpp()` method
- [ ] Update `OrderItem` → `base_cost`, `total_cost` casts

### Services
- [ ] `IngredientService` — CRUD, stock adjustment, low stock check
- [ ] `RecipeService` — CRUD recipe, calculate menu HPP, bulk update menu cost
- [ ] `StockMovementService` — record in/out/adjustment, moving average cost calc, FIFO/LIFO option
- [ ] `ProcurementService` — PO create, GRN process, 3-way match, cost update
- [ ] `HppCalculationService` — theoretical vs actual, variance, menu engineering quadrant

### Jobs/Events
- [ ] `DeductStockOnOrderPaid` job — when order paid, deduct ingredients per recipe × qty
- [ ] `UpdateMenuCostOnIngredientCostChange` — listener on stock movement in, recalculate affected menus
- [ ] `LowStockAlert` — notification when stock < min_stock

### API / Controllers (Admin)
- [ ] `IngredientController` — index, store, show, update, destroy, stock-opname
- [ ] `MenuRecipeController` — manage recipe per menu, auto-calc HPP
- [ ] `StockMovementController` — log adjustment/waste/transfer, history
- [ ] `PurchaseOrderController` — CRUD, send to supplier, status tracking
- [ ] `GoodsReceivedNoteController` — receive against PO, update stock & cost
- [ ] `HppReportController` — theoretical vs actual, variance, menu engineering

### Frontend Pages (Inertia React)
- [ ] `/admin/ingredients` — list, create, edit, stock opname modal
- [ ] `/admin/menus/{menu}/recipe` — recipe builder (drag/drop ingredients, qty, yield)
- [ ] `/admin/stock/movements` — history filter by type/date/ingredient
- [ ] `/admin/procurement/pos` — PO list, create, detail, approve
- [ ] `/admin/procurement/grns` — receive PO, partial receive, cost variance
- [ ] `/admin/reports/hpp` — menu engineering matrix, COGS trend, waste report

### Reports & Exports
- [ ] `HppVarianceExport` — Excel: Menu, Theoretical HPP, Actual HPP, Variance, Margin %
- [ ] `StockOpnameExport` — Sheet per ingredient: System vs Physical, Variance, Value
- [ ] `WasteReportExport` — Date range, shift, menu, ingredient, qty, cost, reason
- [ ] `CogsReportExport` — Daily/Weekly/Monthly COGS, % Sales, Top variance menus

### Tests (Pest)
- [ ] Unit: `RecipeService::calculateHpp()` — various yield %, missing ingredients
- [ ] Unit: `StockMovementService::movingAverageCost()` — multiple receipts at different costs
- [ ] Feature: Order paid → stock deducted correctly per recipe × qty
- [ ] Feature: GRN received → ingredient cost updated, menu HPP recalculated
- [ ] Feature: Waste recorded → COGS increased, stock reduced, no revenue impact

---

## 📋 Todo List (Phase 2 - Cost Control)

- [ ] `WasteController` — log waste by shift/menu/ingredient, reason category (spoil/prep error/overcook/expired)
- [ ] `MenuEngineeringService` — quadrant calculation (popularity = qty sold, margin = price - HPP)
- [ ] `CogsReportService` — period-based COGS, % to sales, variance vs theoretical
- [ ] Dashboard widget: "Top 5 Margin Erosion Menus", "Waste Cost Today", "Low Stock Alerts"
- [ ] Alert/Notification: Margin < 60%, Waste > 5% of sales, Stock < min

---

## 📋 Todo List (Phase 3 - Procurement)

- [ ] `SupplierController` — CRUD, payment terms, performance rating (on-time, quality)
- [ ] PO → GRN → Invoice 3-way match workflow
- [ ] `AccountsPayableService` — aging report, payment scheduling
- [ ] Supplier portal (optional): PO acknowledgment, delivery confirmation

---

## 📋 Todo List (Phase 4 - Customer & Loyalty)

- [ ] `Customer` model — outlet_id, user_id (nullable), phone, email, birthdate, tier, points, total_spend, visit_count
- [ ] `LoyaltyProgram` — tier config, points per 1000 spend, reward catalog
- [ ] `Promo` model — code, type, value, min_spend, max_discount, valid_from/to, usage_limit, channel
- [ ] Apply promo at POS & Self-Order, validate rules
- [ ] Customer lookup by phone at POS

---

## 📋 Todo List (Phase 5 - Multi-outlet)

- [ ] `CentralKitchenService` — production order, batch tracking, distribution to outlets
- [ ] `StockTransfer` — request, approve, ship, receive, transfer price
- [ ] Consolidated reports: Group P&L, Outlet benchmark, Best practice sharing

---

## 📋 Todo List (Phase 6 - Operations)

- [ ] `ChecklistTemplate` + `ChecklistExecution` — per shift, mandatory/optional, photo proof
- [ ] `Task` model — assignee, due_date, status, proof, recurring rule
- [ ] `Reservation` — table, time, party_size, deposit, status, source (walkin/phone/online)

---

## 📋 Todo List (Phase 7 - Accounting)

- [ ] `ChartOfAccount` — code, name, type (asset/liability/equity/revenue/expense), parent_id
- [ ] `JournalEntry` + `JournalLine` — auto-create on: Order paid, Stock in, Waste, Payroll, Payment
- [ ] `BankReconciliation` — import bank statement (CSV/MT940), match to payments/payouts
- [ ] `TaxReportService` — PPN output (sales), PPN input (purchases), SPT masa generator

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
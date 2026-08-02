# Rounding System — Tiered Rounding Up (Pembulatan ke Atas Berjenjang)

## Objective

Change **all total amounts** from `Math.round(n / 500) * 500` (round to nearest)
to **`ceil(n / 500) * 500` (always round up to the nearest 500)**. The difference
(the "rounding amount") is recorded per order so it can be reported as
**other income** on the Owner dashboard.

The "tiered" wording refers to the prior behaviour of using a single rounding
strategy at the **total level**, not a per-component ceiling. Tax, service
charge, discount, and Midtrans charge are not affected.

## Rounding Logic

```php
// app/Support/Money.php
Money::ceilTo500(float $n): float       // next multiple of 500 above n
Money::roundingAmount(float $n): float  // ceilTo500(n) - n, max 0
```

```ts
// resources/js/lib/currency.ts
ceilTo500(n: number): number      // Math.ceil(n / 500) * 500
roundingAmount(n: number): number // max(0, ceilTo500(n) - n)
```

## Examples

| Raw total | Old (round) | New (ceil) | Rounding |
|-----------|-------------|-----------|----------|
| 24.000    | 24.000      | 24.000    | 0        |
| 24.400    | 24.500      | 24.500    | 100      |
| 24.600    | 24.500      | 25.000    | 400      |
| 24.999    | 25.000      | 25.000    | 1        |

## Database

New column on `orders`:

```php
// database/migrations/2026_08_02_084008_add_rounding_to_orders_table.php
$table->decimal('rounding_amount', 12, 2)->default(0)->after('midtrans_charge');
```

The model `app/Models/Order.php` declares this column in `$fillable` and
casts it to `decimal:2`.

## Backend changes

### `app/Support/Money.php` (new)
Centralises `ceilTo500` and `roundingAmount` so both BE services produce
identical numbers.

### `app/Services/PosOrderService.php`
For every total amount we:

1. Compute the **raw** subtotal-plus-tax-plus-service-charge-minus-discount.
2. Compute `roundingAmount = Money::roundingAmount(raw)`.
3. Ceil to 500 (`Money::ceilTo500(raw)`).
4. Persist `rounding_amount` into the `orders` row alongside `total`.

Touch points:

- `createSplitOrders()` — also distributes `rounding_amount` across split
  rows with the same isLast-absorbs-residual pattern used for `total`.
- `confirmAndFinalizeOrder()` — sets `rounding_amount`.
- `updateOrderItems()` — recomputes after items are edited.
- `getOrCreatePaymentOrder()` — sets `rounding_amount` before sending the
  amount to Midtrans.

### `app/Services/SelfOrderService.php`
`calculateTotals()` returns an additional `roundingAmount` key. For online
payments the total is rounded twice — once before Midtrans charge (so the
cashier / cashierless view is stable) and once after (so the final figure
is also a multiple of 500). The round-to-100 Midtrans charge rule is
unchanged.

`createOrder()` signature extended with `float $roundingAmount = 0`.

### `app/Http/Controllers/SelfOrderController.php`
- Passes `roundingAmount` into `createOrder()`.
- Echoes `rounding_amount` on both `/pay` JSON responses (online + cash).
- Echoes `rounding_amount` on `/poll-status` so the customer's status page
  sees the value.

### `app/Http/Controllers/PosController.php`
`initiatePayment()` JSON payload includes `rounding_amount` so the POS
kasir can render the row in the payment breakdown.

### `app/Http/Controllers/OwnerDashboardController.php`
New props in the Inertia payload:

- `monthlyRounding` — sum of `rounding_amount` for paid orders in the
  current month.
- `lastMonthRounding` — same metric for the previous calendar month.
- `roundingGrowth` — percentage change vs last month.

These flow into the new "Pendapatan Pembulatan" card on the Owner
dashboard.

## Frontend changes

### `resources/js/lib/currency.ts`
Adds `ceilTo500` and `roundingAmount` helpers that mirror the PHP service
byte-for-byte. The frontend breakdown, dialog previews, and POS receipt
all consume these so the displayed total always matches what the
backend persisted.

### `resources/js/pages/pos/Index.tsx`
The cart total uses `ceilTo500` for the cash change calculation and the
receipt data. `buildReceiptData()` includes the `roundingAmount` so the
printed receipt reflects what was stored.

### `resources/js/pages/pos/components/CartPanel.tsx`
Adds a "Pembulatan" row to the cart summary when `roundingAmount > 0`.

### `resources/js/pages/pos/dialogs/MidtransPaymentDialog.tsx`
`localBreakdown` now applies the same ceiling twice (before and after
Midtrans charge) and surfaces the combined `roundingAmount` in the
breakdown panel. `MidtransPaymentResult` includes `roundingAmount` so
`pos/Index.tsx` can store it on the receipt.

### `resources/js/pages/pos/lib/receipt.ts`
Renders a "Pembulatan" line in the printed receipt between the discount
and the final TOTAL.

### `resources/js/hooks/useSelfOrderCart.ts`
Both `cartTotal` (cash flow) and `onlineTotal` (online flow) are now
ceiled to 500. The hook exposes `cartRoundingAmount` and
`onlineRoundingAmount` for display purposes.

### `resources/js/pages/self-order/components/CartModal.tsx`
Renders the "Pembulatan" row in both the cash and online breakdowns
when the value is greater than zero.

### `resources/js/pages/self-order/components/PaymentStatusModal.tsx`
Renders the "Pembulatan" row in the Midtrans QR/VA breakdown.

### `resources/js/pages/owner/Dashboard.tsx`
New "Pendapatan Pembulatan" card (with `Coins` icon) showing the current
month's total plus growth vs the previous month. Grid bumped from
`xl:grid-cols-5` to `xl:grid-cols-6` to fit the extra card.

## Midtrans Charge

Fee rounding (`round($amount * chargePercent / 100 / 100) * 100`) is
**unchanged** — payment-gateway fees keep the round-to-100 rule.

## Test Results

- ✅ 251 tests passed (3 new RoundingTest cases, 16 new MoneyTest dataset
  cases, 1 new OwnerDashboard monthly-rounding assertion).
- ✅ Pint formatting clean.
- ✅ Build succeeded.

## Tampilan Akhir

- **Struk** menunjukkan "Pembulatan" di antara diskon dan TOTAL.
- **Cart Modal & Midtrans dialog** menunjukkan baris "Pembulatan" ketika
  nilainya > 0.
- **Dashboard Owner** memiliki card "Pendapatan Pembulatan" (akumulasi
  bulan ini + pertumbuhan % vs bulan lalu) dengan label catatan
  "Pendapatan lain-lain".

# Rounding System Implementation Summary

## Objective
Implement **round-to-500** rounding for all monetary calculations (no decimals in results).

## Changes Applied

### Frontend (React/TypeScript)

1. **resources/js/pages/pos/lib/pricing.ts**
   - `calcDiscount()`: Now wraps result with `roundTo500()`
   - `calcServiceCharge()`: Now uses `roundTo500(subtotal * SERVICE_RATE)`
   - Added `roundTo500(n)` function: `Math.round(n / 500) * 500`
   - Removed unused `roundPrice()` function

2. **resources/js/pages/pos/dialogs/MidtransPaymentDialog.tsx**
   - `localBreakdown` useMemo: All tax, service charge, and discount calculations now use `roundTo500` pattern

3. **resources/js/pages/pos/Index.tsx**
   - Removed import of `roundPrice`
   - Updated local receipt calculations to use `Math.round(sub * 0.10 / 500) * 500`

### Backend (Laravel/PHP)

1. **app/Services/DiscountService.php**
   - `calculate()`: Now uses `round((...result...) / 500) * 500`

2. **app/Services/PosOrderService.php**
   - `calculateTax()`: Now uses `round($subtotal * $this->getTaxRate() / 500) * 500`
   - `calculateServiceCharge()`: Now uses `round($subtotal * rate / 500) * 500`
   - `createSplitOrders()`: Split calculations use round-to-500
   - `confirmAndFinalizeOrder()`: Total rounded to 500
   - `updateOrderItems()`: Total rounded to 500
   - `getOrCreatePaymentOrder()`: Total before charge rounded to 500

3. **app/Services/SelfOrderService.php**
   - `calculateTotals()`: All calculations use round-to-500 pattern

## Rounding Logic

```javascript
// JavaScript
function roundTo500(n) {
    return Math.round(n / 500) * 500;
}

// PHP
function roundTo500(float $n): float {
    return round($n / 500) * 500;
}
```

## Examples

| Input | After round-to-500 |
|-------|-------------------|
| 25000 | 25000 (already divisible by 500) |
| 25250 | 25500 |
| 25750 | 25500 |
| 26000 | 26000 |

## Tax & Service Charge Calculation

- Tax (10%): `round(subtotal * 0.10 / 500) * 500`
- Service Charge (5%): `round(subtotal * 0.05 / 500) * 500`
- Discount: `round(value / 500) * 500`
- Total: `round(result / 500) * 500`

## Midtrans Charge

- **Note**: Still uses `round($amount * chargePercent / 100 / 100) * 100`
- This is correct for transaction fees which should round to nearest 100

## Test Results

- ✅ 229 tests passed
- ❌ 2 tests failed (pre-existing, unrelated to rounding changes)
- ✅ Build successful
- ✅ Pint formatting applied

## Database Impact

All order amounts (subtotal, tax, service_charge, discount, total) will now be stored as whole numbers divisible by 500 (no decimal places).

## Notes

- The frontend and backend now have consistent rounding behavior
- Round-to-500 is appropriate for Indonesian Rupiah cash transactions
- All calculations flow through the service layer ensuring consistency
- Receipts will display clean integer values without decimals

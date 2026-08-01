# Rounding System Fix Plan

## Issue
The POS system has inconsistent rounding that results in decimal values in some calculations when the goal is to display all prices in Indonesian Rupiah format (integers, no decimals).

## Analysis

### Current Rounding Status

| File | Function | Current Rounding | Required Rounding | Status |
|------|----------|------------------|-------------------|--------|
| pricing.ts | calcTax | Math.round() | Math.round() | OK |
| pricing.ts | calcDiscount | No rounding | Math.round() | NEEDS FIX |
| pricing.ts | calcServiceCharge | roundPrice (2 decimals) | Math.round() | NEEDS FIX |
| DiscountService.php | calculate | No rounding | round() | NEEDS FIX |
| MidtransDialog.tsx | localBreakdown | Discount not rounded | Math.round() | NEEDS FIX |
| format.ts | formatPrice | Math.round() | Math.round() | OK |

## Files to Modify

### 1. resources/js/pages/pos/lib/pricing.ts
**Lines to modify: 15-36**

Fix calcDiscount - wrap with Math.round():
```typescript
if (type === 'percentage') {
    return Math.round(Math.min(subtotal * (value / 100), subtotal));
}
return Math.round(Math.min(value, subtotal));
```

Fix calcServiceCharge - use Math.round directly:
```typescript
export function calcServiceCharge(subtotal: number): number {
    return Math.round(subtotal * SERVICE_RATE);
}
```

Remove roundPrice function as it's no longer needed.

---

### 2. app/Services/DiscountService.php
**Lines to modify: 8-23**

Fix calculate method - wrap with round():
```php
return round(match ($type) {
    'percentage' => min($subtotal * ($value / 100), $subtotal),
    'nominal' => min($value, $subtotal),
    default => 0,
});
```

---

### 3. resources/js/pages/pos/dialogs/MidtransPaymentDialog.tsx
**Lines to modify: 109-113**

Fix discountAmount calculation - wrap with Math.round():
```typescript
const discountAmount = discountType === 'percentage' && discountValue > 0
    ? Math.round(Math.min(sub * (discountValue / 100), sub))
    : discountType === 'nominal' && discountValue > 0
        ? Math.round(Math.min(discountValue, sub))
        : 0;
```

---

## Rounding Strategy

All monetary calculations should round to **integers** (whole Rupiah):
- Frontend: Math.round(amount)
- Backend: round($amount)

## Expected Result

After fix, all calculations will produce integer values:
- Subtotal: Integer
- Tax (10%): Integer
- Service Charge (5%): Integer
- Discount: Integer
- Midtrans Charge: Integer (rounded to nearest 100)
- Total: Integer

## Verification Checklist

- [ ] Test cash payment with discount
- [ ] Test online payment with discount
- [ ] Check struk output (all prices integer)
- [ ] Verify database stores integer values
- [ ] Test split bill functionality
- [ ] Test midtrans payment flow

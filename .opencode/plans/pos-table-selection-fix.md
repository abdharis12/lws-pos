# POS Table Selection Fix

## Problem
- Tombol meja bisa diklik tapi tidak ada visual feedback (ring putih di atas background warna tidak terlihat)
- Tombol order tetap aktif meskipun belum pilih meja

## Changes in `resources/js/pages/pos/Index.tsx`

### 1. Add Check icon import
```tsx
import { Plus, Minus, X, ShoppingCart, Search, Wallet, QrCode, Check } from 'lucide-react';
```

### 2. Desktop sidebar — add checkmark + better ring
Replace lines 299-312:
```tsx
{tables.map(table => (
    <button
        key={table.id}
        onClick={() => setSelectedTableId(table.id === selectedTableId ? null : table.id)}
        className={cn(
            'flex flex-col items-center rounded-lg p-3 text-sm font-medium text-white transition-all',
            tableColors[table.status] || 'bg-gray-400',
            selectedTableId === table.id && 'ring-2 ring-[#CFC0A4] ring-offset-2 ring-offset-background scale-105'
        )}
    >
        <span className="text-lg font-bold">{table.code}</span>
        <span className="mt-0.5 text-[10px] opacity-80">{table.capacity} org</span>
        {selectedTableId === table.id && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#CFC0A4] text-[#233433]">
                <Check className="size-3" />
            </span>
        )}
    </button>
))}
```

### 3. Mobile bar — same treatment
Replace lines 318-330:
```tsx
{tables.map(table => (
    <button
        key={table.id}
        onClick={() => setSelectedTableId(table.id === selectedTableId ? null : table.id)}
        className={cn(
            'flex-shrink-0 rounded-lg px-4 py-2 text-xs font-medium text-white relative',
            tableColors[table.status] || 'bg-gray-400',
            selectedTableId === table.id && 'ring-2 ring-[#CFC0A4] ring-offset-2 scale-105'
        )}
    >
        {table.code}
        {selectedTableId === table.id && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#CFC0A4] text-[#233433]">
                <Check className="size-2.5" />
            </span>
        )}
    </button>
))}
```

### 4. Disable order buttons when no table selected
Update CartPanel to accept `tableSelected` prop and disable buttons:

Line 85 — update interface:
```tsx
function CartPanel({
    items,
    processing,
    onUpdateQty,
    onRemove,
    onOrder,
    tableSelected = true,
}: {
    items: CartItem[];
    processing: boolean;
    onUpdateQty: (index: number, qty: number) => void;
    onRemove: (index: number) => void;
    onOrder: (method?: string) => void;
    tableSelected?: boolean;
}) {
```

Line 161-167 — disable buttons:
```tsx
<Button onClick={() => onOrder('cash')} disabled={items.length === 0 || processing || !tableSelected} className="w-full" size="lg">
    <Wallet className="mr-2 size-4" /> Bayar Cash
</Button>
<Button onClick={() => onOrder('qris')} disabled={items.length === 0 || processing || !tableSelected} variant="secondary" className="w-full" size="lg">
    <QrCode className="mr-2 size-4" /> Bayar QRIS
</Button>
<Button onClick={() => onOrder()} disabled={items.length === 0 || processing || !tableSelected} variant="outline" className="w-full">
    Simpan
</Button>
```

Line 377 — pass prop:
```tsx
<CartPanel
    items={cartItems}
    processing={processing}
    tableSelected={selectedTableId !== null}
    onUpdateQty={...}
    onRemove={...}
    onOrder={handleOrder}
/>
```

Line 404 — same for mobile sheet:
```tsx
<CartPanel
    items={cartItems}
    processing={processing}
    tableSelected={selectedTableId !== null}
    onUpdateQty={...}
    onRemove={...}
    onOrder={handleOrder}
/>
```

### 5. Guard handleOrder
Add to beginning of handleOrder:
```tsx
function handleOrder(paymentMethod?: string) {
    if (cartItems.length === 0) return;
    if (!selectedTableId) return;
    ...
}
```

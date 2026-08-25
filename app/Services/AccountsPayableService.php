<?php

namespace App\Services;

use App\Models\AccountsPayable;
use App\Models\GrnItem;
use App\Models\SupplierInvoice;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AccountsPayableService
{
    /**
     * Record an invoice. Auto-creates AP entry from PO + GRN for 3-way match.
     */
    public function recordInvoice(int $outletId, array $data, ?User $user = null): SupplierInvoice
    {
        return DB::transaction(function () use ($outletId, $data, $user) {
            $invoiceNumber = $this->generateInvoiceNumber($outletId);

            $dueDate = isset($data['due_date'])
                ? Carbon::parse($data['due_date'])
                : Carbon::parse($data['invoice_date'])->addDays($this->termsToDays($data['payment_terms'] ?? 'net_30'));

            $totalAmount = collect($data['items'])->sum(fn ($item) => (float) $item['qty'] * (float) $item['unit_price']);

            $invoice = SupplierInvoice::create([
                'outlet_id' => $outletId,
                'supplier_id' => $data['supplier_id'],
                'po_id' => $data['po_id'] ?? null,
                'grn_id' => $data['grn_id'] ?? null,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $data['invoice_date'],
                'due_date' => $dueDate,
                'total_amount' => $totalAmount,
                'tax_amount' => $data['tax_amount'] ?? 0,
                'status' => SupplierInvoice::STATUS_PENDING,
                'payment_terms' => $data['payment_terms'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user?->id,
            ]);

            foreach ($data['items'] as $item) {
                SupplierInvoiceItem::create([
                    'supplier_invoice_id' => $invoice->id,
                    'ingredient_id' => $item['ingredient_id'],
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => (float) $item['qty'] * (float) $item['unit_price'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            // Auto-create AP
            AccountsPayable::create([
                'outlet_id' => $outletId,
                'supplier_id' => $data['supplier_id'],
                'supplier_invoice_id' => $invoice->id,
                'amount_due' => $totalAmount + ($data['tax_amount'] ?? 0),
                'amount_paid' => 0,
                'balance' => $totalAmount + ($data['tax_amount'] ?? 0),
                'due_date' => $dueDate,
                'status' => AccountsPayable::STATUS_UNPAID,
            ]);

            // 3-way match check (PO + GRN + Invoice)
            if ($invoice->po_id && $invoice->grn_id) {
                $this->performThreeWayMatch($invoice);
            }

            return $invoice->fresh(['items.ingredient', 'supplier', 'purchaseOrder', 'goodsReceivedNote']);
        });
    }

    public function performThreeWayMatch(SupplierInvoice $invoice): array
    {
        $issues = [];

        if (! $invoice->po_id || ! $invoice->grn_id) {
            return ['matched' => false, 'issues' => ['Invoice missing PO or GRN reference']];
        }

        $po = $invoice->purchaseOrder;
        $grn = $invoice->goodsReceivedNote;

        if (! $po || ! $grn) {
            return ['matched' => false, 'issues' => ['PO or GRN not found']];
        }

        // Compare quantities per ingredient
        foreach ($invoice->items as $item) {
            $poItem = $po->items()->where('ingredient_id', $item->ingredient_id)->first();
            $grnItem = GrnItem::where('grn_id', $grn->id)
                ->where('ingredient_id', $item->ingredient_id)
                ->first();

            if (! $poItem || ! $grnItem) {
                $issues[] = "Item ingredient #{$item->ingredient_id} not found in PO/GRN";

                continue;
            }

            $qtyTolerance = (float) $poItem->qty_ordered * 0.05; // 5% tolerance
            if (abs((float) $poItem->qty_ordered - (float) $item->qty) > $qtyTolerance) {
                $issues[] = "Qty mismatch for ingredient #{$item->ingredient_id}: PO=".(float) $poItem->qty_ordered.', Invoice='.(float) $item->qty;
            }

            if (abs((float) $poItem->unit_cost - (float) $item->unit_price) > 0.01) {
                $issues[] = "Price mismatch for ingredient #{$item->ingredient_id}: PO=".(float) $poItem->unit_cost.', Invoice='.(float) $item->unit_price;
            }
        }

        if (empty($issues)) {
            $invoice->update(['status' => SupplierInvoice::STATUS_MATCHED]);

            return ['matched' => true, 'issues' => []];
        }

        $invoice->update(['status' => SupplierInvoice::STATUS_DISPUTED]);

        return ['matched' => false, 'issues' => $issues];
    }

    public function recordPayment(int $apId, float $amount, string $method, ?string $reference = null, ?User $user = null): AccountsPayable
    {
        return DB::transaction(function () use ($apId, $amount, $method, $reference, $user) {
            $ap = AccountsPayable::lockForUpdate()->findOrFail($apId);

            if ($ap->isPaid()) {
                throw new \InvalidArgumentException('Invoice ini sudah lunas.');
            }

            if ($amount > (float) $ap->balance) {
                throw new \InvalidArgumentException('Jumlah bayar melebihi sisa tagihan.');
            }

            $newPaid = (float) $ap->amount_paid + $amount;
            $newBalance = (float) $ap->amount_due - $newPaid;

            $ap->update([
                'amount_paid' => $newPaid,
                'balance' => $newBalance,
                'status' => $newBalance <= 0.01 ? AccountsPayable::STATUS_PAID : AccountsPayable::STATUS_PARTIAL,
                'payment_method' => $method,
                'reference_number' => $reference,
                'paid_at' => $newBalance <= 0.01 ? now() : null,
                'paid_by' => $newBalance <= 0.01 ? $user?->id : null,
                'notes' => $newBalance <= 0.01 ? $ap->notes : ($ap->notes."\nBayar: ".number_format($amount, 0, ',', '.')." ({$method})"),
            ]);

            if ($newBalance <= 0.01) {
                $invoice = $ap->supplierInvoice;
                $invoice->update([
                    'status' => SupplierInvoice::STATUS_PAID,
                    'paid_at' => now(),
                    'paid_by' => $user?->id,
                ]);
            } else {
                $ap->supplierInvoice->update(['status' => SupplierInvoice::STATUS_PARTIALLY_PAID]);
            }

            return $ap->fresh(['supplierInvoice', 'supplier', 'paidBy']);
        });
    }

    public function getAgingReport(int $outletId, ?string $asOf = null): array
    {
        $asOf = $asOf ? Carbon::parse($asOf) : Carbon::now();
        $ap = AccountsPayable::where('outlet_id', $outletId)
            ->with('supplier')
            ->get();

        $buckets = [
            'current' => 0,
            '1-30' => 0,
            '31-60' => 0,
            '61-90' => 0,
            '90+' => 0,
            'paid' => 0,
        ];

        $bySupplier = [];

        foreach ($ap as $entry) {
            $days = $entry->isPaid() ? 0 : max(0, (int) $asOf->startOfDay()->diffInDays($entry->due_date, false) * -1);

            if ($entry->isPaid()) {
                $buckets['paid'] += (float) $entry->amount_paid;
            } elseif ($days <= 0) {
                $buckets['current'] += (float) $entry->balance;
            } elseif ($days <= 30) {
                $buckets['1-30'] += (float) $entry->balance;
            } elseif ($days <= 60) {
                $buckets['31-60'] += (float) $entry->balance;
            } elseif ($days <= 90) {
                $buckets['61-90'] += (float) $entry->balance;
            } else {
                $buckets['90+'] += (float) $entry->balance;
            }

            $supplierId = $entry->supplier_id;
            if (! isset($bySupplier[$supplierId])) {
                $bySupplier[$supplierId] = [
                    'supplier_id' => $supplierId,
                    'supplier_name' => $entry->supplier->name,
                    'total_due' => 0,
                    'total_paid' => 0,
                    'outstanding' => 0,
                    'overdue_count' => 0,
                ];
            }
            $bySupplier[$supplierId]['total_due'] += (float) $entry->amount_due;
            $bySupplier[$supplierId]['total_paid'] += (float) $entry->amount_paid;
            $bySupplier[$supplierId]['outstanding'] += (float) $entry->balance;
            if (! $entry->isPaid() && $days > 0) {
                $bySupplier[$supplierId]['overdue_count']++;
            }
        }

        return [
            'as_of' => $asOf->toDateString(),
            'buckets' => $buckets,
            'total_outstanding' => $ap->whereNotIn('status', [AccountsPayable::STATUS_PAID])->sum('balance'),
            'total_overdue' => array_sum(array_intersect_key($buckets, array_flip(['1-30', '31-60', '61-90', '90+']))),
            'by_supplier' => collect($bySupplier)->sortByDesc('outstanding')->values(),
        ];
    }

    public function getUnpaidInvoices(int $outletId, ?int $supplierId = null): Collection
    {
        $query = AccountsPayable::where('outlet_id', $outletId)
            ->whereIn('status', [AccountsPayable::STATUS_UNPAID, AccountsPayable::STATUS_PARTIAL, AccountsPayable::STATUS_OVERDUE])
            ->with(['supplier', 'supplierInvoice']);

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        return $query->orderBy('due_date')->get();
    }

    public function markOverdueEntries(int $outletId): int
    {
        return AccountsPayable::where('outlet_id', $outletId)
            ->whereIn('status', [AccountsPayable::STATUS_UNPAID, AccountsPayable::STATUS_PARTIAL])
            ->where('due_date', '<', Carbon::today())
            ->update(['status' => AccountsPayable::STATUS_OVERDUE]);
    }

    protected function generateInvoiceNumber(int $outletId): string
    {
        $prefix = 'INV-'.now()->format('ymd');
        $last = SupplierInvoice::where('outlet_id', $outletId)
            ->where('invoice_number', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $seq = $last ? (int) substr($last->invoice_number, -4) + 1 : 1;

        return $prefix.str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    protected function termsToDays(?string $terms): int
    {
        return match ($terms) {
            'cash' => 0,
            'net_7' => 7,
            'net_14' => 14,
            'net_30' => 30,
            'net_60' => 60,
            default => 30,
        };
    }
}

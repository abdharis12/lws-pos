<?php

namespace App\Services;

use App\Models\GoodsReceivedNote;
use App\Models\GrnItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProcurementService
{
    public function createPo(int $outletId, array $data, ?User $user = null): PurchaseOrder
    {
        return DB::transaction(function () use ($outletId, $data, $user) {
            $poNumber = $this->generatePoNumber($outletId);

            $po = PurchaseOrder::create([
                'outlet_id' => $outletId,
                'supplier_id' => $data['supplier_id'],
                'po_number' => $poNumber,
                'status' => 'draft',
                'order_date' => $data['order_date'] ?? now()->toDateString(),
                'expected_date' => $data['expected_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user?->id,
            ]);

            $totalAmount = 0;
            foreach ($data['items'] as $item) {
                $poItem = PurchaseOrderItem::create([
                    'po_id' => $po->id,
                    'ingredient_id' => $item['ingredient_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'unit_cost' => $item['unit_cost'],
                ]);
                $totalAmount += $poItem->qty_ordered * $poItem->unit_cost;
            }

            $po->update(['total_amount' => $totalAmount]);

            return $po->fresh(['items.ingredient']);
        });
    }

    public function sendPo(PurchaseOrder $po): PurchaseOrder
    {
        if (! $po->isDraft()) {
            throw new \InvalidArgumentException('Hanya PO dengan status draft yang bisa dikirim.');
        }

        return $po->updateAndReturn(['status' => 'sent']);
    }

    public function cancelPo(PurchaseOrder $po): PurchaseOrder
    {
        if ($po->isCompleted()) {
            throw new \InvalidArgumentException('PO yang sudah diterima tidak bisa dibatalkan.');
        }

        return $po->updateAndReturn(['status' => 'cancelled']);
    }

    public function createGrn(int $poId, array $data, ?User $user = null): GoodsReceivedNote
    {
        return DB::transaction(function () use ($poId, $data, $user) {
            $po = PurchaseOrder::with('items.ingredient')->findOrFail($poId);

            if (! in_array($po->status, ['sent', 'partial'])) {
                throw new \InvalidArgumentException('PO harus status sent atau partial untuk membuat GRN.');
            }

            $grnNumber = $this->generateGrnNumber($po->outlet_id);

            $grn = GoodsReceivedNote::create([
                'po_id' => $po->id,
                'outlet_id' => $po->outlet_id,
                'grn_number' => $grnNumber,
                'received_date' => $data['received_date'] ?? now()->toDateString(),
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
                'received_by' => $user?->id,
            ]);

            $allFullyReceived = true;

            foreach ($data['items'] as $itemData) {
                $poItem = $po->items()->where('ingredient_id', $itemData['ingredient_id'])->firstOrFail();

                $qtyReceived = $itemData['qty_received'];
                $unitCost = $itemData['unit_cost'] ?? $poItem->unit_cost;

                GrnItem::create([
                    'grn_id' => $grn->id,
                    'ingredient_id' => $itemData['ingredient_id'],
                    'qty_ordered' => $poItem->qty_ordered,
                    'qty_received' => $qtyReceived,
                    'unit_cost' => $unitCost,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $poItem->increment('qty_received', $qtyReceived);

                if ($poItem->qty_received < $poItem->qty_ordered) {
                    $allFullyReceived = false;
                }

                $notes = "GRN: {$grn->grn_number}";
                if (! empty($itemData['notes'])) {
                    $notes .= ' - '.$itemData['notes'];
                }

                app(StockMovementService::class)->recordIn(
                    $po->outlet_id,
                    $itemData['ingredient_id'],
                    $qtyReceived,
                    $unitCost,
                    $notes,
                    'goods_received_note',
                    $grn->id,
                    $user
                );
            }

            $newPoStatus = $allFullyReceived ? 'received' : 'partial';
            $po->update(['status' => $newPoStatus]);

            $grn->update(['status' => $allFullyReceived ? 'completed' : 'partial']);

            return $grn->fresh(['items.ingredient', 'purchaseOrder.supplier']);
        });
    }

    public function getPos(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = PurchaseOrder::where('outlet_id', $outletId)
            ->with(['supplier', 'items.ingredient', 'createdBy'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('order_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('order_date', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getGrns(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = GoodsReceivedNote::where('outlet_id', $outletId)
            ->with(['purchaseOrder.supplier', 'items.ingredient', 'receivedBy'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['po_id'])) {
            $query->where('po_id', $filters['po_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('received_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('received_date', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getPoDetail(int $poId): ?PurchaseOrder
    {
        return PurchaseOrder::with(['supplier', 'items.ingredient', 'grns.items.ingredient', 'createdBy'])->find($poId);
    }

    protected function generatePoNumber(int $outletId): string
    {
        $prefix = 'PO-'.now()->format('ymd');
        $lastPo = PurchaseOrder::where('outlet_id', $outletId)
            ->where('po_number', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $sequence = $lastPo ? (int) substr($lastPo->po_number, -4) + 1 : 1;

        return $prefix.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    protected function generateGrnNumber(int $outletId): string
    {
        $prefix = 'GRN-'.now()->format('ymd');
        $lastGrn = GoodsReceivedNote::where('outlet_id', $outletId)
            ->where('grn_number', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $sequence = $lastGrn ? (int) substr($lastGrn->grn_number, -4) + 1 : 1;

        return $prefix.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}

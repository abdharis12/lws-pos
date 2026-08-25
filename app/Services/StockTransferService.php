<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StockTransferService
{
    public function createTransfer(int $outletFromId, int $outletToId, array $items, ?User $user = null): StockTransfer
    {
        return DB::transaction(function () use ($outletFromId, $outletToId, $items, $user) {
            foreach ($items as $item) {
                $ingredient = Ingredient::where('outlet_id', $outletFromId)
                    ->where('id', $item['ingredient_id'])
                    ->firstOrFail();

                if ($ingredient->current_stock < $item['qty_requested']) {
                    throw new \InvalidArgumentException(
                        "Stok {$ingredient->name} tidak mencukupi di outlet asal. Tersedia: {$ingredient->current_stock}, Dibutuhkan: {$item['qty_requested']}"
                    );
                }
            }

            $transferNumber = $this->generateTransferNumber();

            $transfer = StockTransfer::create([
                'outlet_from_id' => $outletFromId,
                'outlet_to_id' => $outletToId,
                'transfer_number' => $transferNumber,
                'status' => StockTransfer::STATUS_REQUESTED,
                'notes' => $items[0]['notes'] ?? null,
                'requested_by' => $user?->id,
                'requested_at' => now(),
            ]);

            foreach ($items as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'ingredient_id' => $item['ingredient_id'],
                    'qty_requested' => $item['qty_requested'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $transfer->fresh(['items.ingredient', 'outletFrom', 'outletTo']);
        });
    }

    public function approveTransfer(StockTransfer $transfer, ?User $user = null): StockTransfer
    {
        if (! $transfer->canApprove()) {
            throw new \InvalidArgumentException('Transfer hanya bisa disetujui dari status requested.');
        }

        $transfer->update([
            'status' => StockTransfer::STATUS_APPROVED,
            'approved_by' => $user?->id,
            'approved_at' => now(),
        ]);

        return $transfer->fresh();
    }

    public function shipTransfer(StockTransfer $transfer, ?User $user = null): StockTransfer
    {
        if (! $transfer->canShip()) {
            throw new \InvalidArgumentException('Transfer hanya bisa dikirim dari status approved.');
        }

        $transfer->items()->update(['qty_shipped' => DB::raw('qty_requested')]);

        $transfer->update([
            'status' => StockTransfer::STATUS_SHIPPED,
            'shipped_by' => $user?->id,
            'shipped_at' => now(),
        ]);

        return $transfer->fresh(['items.ingredient']);
    }

    public function receiveTransfer(StockTransfer $transfer, ?User $user = null): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $user) {
            if (! $transfer->canReceive()) {
                throw new \InvalidArgumentException('Transfer hanya bisa diterima dari status shipped.');
            }

            $transfer->items()->update(['qty_received' => DB::raw('qty_shipped')]);

            $stockMovementService = app(StockMovementService::class);

            foreach ($transfer->items as $item) {
                $ingredient = Ingredient::where('outlet_id', $transfer->outlet_from_id)
                    ->where('id', $item->ingredient_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $stockMovementService->recordOut(
                    $transfer->outlet_from_id,
                    $item->ingredient_id,
                    $item->qty_received,
                    "Transfer keluar #{$transfer->transfer_number}",
                    'stock_transfer',
                    $transfer->id,
                    $user
                );

                $stockMovementService->recordIn(
                    $transfer->outlet_to_id,
                    $item->ingredient_id,
                    $item->qty_received,
                    $item->unit_cost,
                    "Transfer masuk #{$transfer->transfer_number}",
                    'stock_transfer',
                    $transfer->id,
                    $user
                );
            }

            $transfer->update([
                'status' => StockTransfer::STATUS_RECEIVED,
                'received_by' => $user?->id,
                'received_at' => now(),
            ]);

            return $transfer->fresh(['items.ingredient', 'outletFrom', 'outletTo']);
        });
    }

    public function cancelTransfer(StockTransfer $transfer): StockTransfer
    {
        if (in_array($transfer->status, [StockTransfer::STATUS_RECEIVED, StockTransfer::STATUS_CANCELLED])) {
            throw new \InvalidArgumentException('Transfer yang sudah diterima atau dibatalkan tidak bisa dibatalkan.');
        }

        $transfer->update(['status' => StockTransfer::STATUS_CANCELLED]);

        return $transfer->fresh();
    }

    public function getTransfers(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = StockTransfer::where(function ($q) use ($outletId) {
            $q->where('outlet_from_id', $outletId)
                ->orWhere('outlet_to_id', $outletId);
        })
            ->with(['outletFrom', 'outletTo', 'items.ingredient', 'requestedBy'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getTransferDetail(int $id): ?StockTransfer
    {
        return StockTransfer::with([
            'outletFrom', 'outletTo', 'items.ingredient',
            'requestedBy', 'approvedBy', 'shippedBy', 'receivedBy',
        ])->find($id);
    }

    protected function generateTransferNumber(): string
    {
        $prefix = 'ST-'.now()->format('ymd');
        $lastTransfer = StockTransfer::where('transfer_number', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $sequence = $lastTransfer ? (int) substr($lastTransfer->transfer_number, -4) + 1 : 1;

        return $prefix.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}

<?php

namespace App\Services;

use App\Enums\TableStatus;
use App\Models\Meja;
use App\Models\Order;

class PosTableService
{
    public function release(Meja $table): void
    {
        $this->assertOutletOwnership($table);

        $session = $table->sessions()->where('status', 'active')->first();
        $groupedIds = [];

        if ($session) {
            $session->orders()->whereIn('status', ['pending', 'pending_payment'])
                ->update(['status' => 'cancelled']);

            $groupedIds = $session->orders()
                ->whereNotNull('grouped_tables')
                ->pluck('grouped_tables')
                ->flatten()
                ->unique()
                ->values()
                ->toArray();

            $session->update([
                'status' => 'closed',
                'closed_at' => now(),
            ]);
        }

        $affected = collect([$table->id, ...$groupedIds])->unique();
        Meja::whereIn('id', $affected)->update(['status' => TableStatus::Available->value]);
    }

    public function move(Meja $source, Meja $target): void
    {
        $this->assertOutletOwnership($source);
        $this->assertOutletOwnership($target);

        $sourceSession = $source->sessions()->where('status', 'active')->first();

        $targetSession = $target->sessions()->where('status', 'active')->first()
            ?? $target->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);

        $sourceSession->orders()->update(['table_session_id' => $targetSession->id]);

        $sourceSession->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $source->update(['status' => TableStatus::Available]);
        $target->update(['status' => TableStatus::Occupied]);
    }

    public function merge(MeJa $source, Meja $target): void
    {
        $this->assertOutletOwnership($source);
        $this->assertOutletOwnership($target);

        $sourceSession = $source->sessions()->where('status', 'active')->first();
        $targetSession = $target->sessions()->where('status', 'active')->first();

        $movedOrders = $sourceSession->orders()
            ->whereIn('status', ['pending', 'pending_payment'])
            ->get();

        $orderIds = $movedOrders->pluck('id');
        if ($orderIds->isNotEmpty()) {
            Order::whereIn('id', $orderIds)
                ->update(['table_session_id' => $targetSession->id]);
        }

        foreach ($movedOrders as $order) {
            $this->mergeOrderGroupedTables($order, $source);
        }

        $sourceSession->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $target->update(['status' => TableStatus::Occupied, 'locked_by' => null]);
        $source->update(['status' => TableStatus::Occupied, 'locked_by' => null]);
    }

    protected function assertOutletOwnership(Meja $table): void
    {
        $userOutletId = auth()->user()?->employee?->outlet_id;
        if ($userOutletId && $table->outlet_id !== $userOutletId) {
            abort(403, 'Tidak memiliki akses ke meja outlet lain.');
        }
    }

    protected function mergeOrderGroupedTables(Order $order, Meja $source): void
    {
        $grouped = $order->grouped_tables ?? [];
        if (! in_array($source->id, $grouped)) {
            $grouped[] = $source->id;
            $order->update(['grouped_tables' => $grouped]);
        }
    }

    public function lock(Meja $table, int $userId): void
    {
        $table->update([
            'status' => TableStatus::Locked,
            'locked_by' => $userId,
        ]);
    }

    public function unlock(Meja $table): void
    {
        $table->update([
            'status' => TableStatus::Available,
            'locked_by' => null,
        ]);
    }
}

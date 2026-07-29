<?php

namespace App\Services;

use App\Models\Meja;

class PosTableService
{
    public function release(Meja $table): void
    {
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
        Meja::whereIn('id', $affected)->update(['status' => 'available']);
    }

    public function move(Meja $source, Meja $target): void
    {
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

        $source->update(['status' => 'available']);
        $target->update(['status' => 'occupied']);
    }

    public function merge(Meja $source, Meja $target): void
    {
        $sourceSession = $source->sessions()->where('status', 'active')->first();
        $targetSession = $target->sessions()->where('status', 'active')->first();

        $movedOrders = $sourceSession->orders()
            ->whereIn('status', ['pending', 'pending_payment'])
            ->get();

        foreach ($movedOrders as $order) {
            $grouped = $order->grouped_tables ?? [];
            if (! in_array($source->id, $grouped)) {
                $grouped[] = $source->id;
            }
            $order->update([
                'table_session_id' => $targetSession->id,
                'grouped_tables' => $grouped,
            ]);
        }

        $sourceSession->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $target->update(['status' => 'occupied', 'locked_by' => null]);
        $source->update(['status' => 'occupied', 'locked_by' => null]);
    }

    public function lock(Meja $table, int $userId): void
    {
        $table->update([
            'status' => 'locked',
            'locked_by' => $userId,
        ]);
    }

    public function unlock(Meja $table): void
    {
        $table->update([
            'status' => 'available',
            'locked_by' => null,
        ]);
    }
}

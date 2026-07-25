<?php

namespace App\Console\Commands;

use App\Models\Meja;
use App\Models\TableSession;
use Illuminate\Console\Command;

class ResetTablesDaily extends Command
{
    protected $signature = 'pos:reset-tables-daily';

    protected $description = 'Reset all tables to available at midnight';

    public function handle(): void
    {
        TableSession::where('status', 'active')
            ->each(function (TableSession $session) {
                $session->orders()
                    ->whereIn('status', ['pending', 'pending_payment'])
                    ->update(['status' => 'cancelled']);

                $session->update([
                    'status' => 'closed',
                    'closed_at' => now(),
                ]);
            });

        Meja::query()->update([
            'status' => 'available',
            'locked_by' => null,
        ]);

        $this->info('All tables reset to available.');
    }
}

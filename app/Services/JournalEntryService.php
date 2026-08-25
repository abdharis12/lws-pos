<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class JournalEntryService
{
    public function createEntry(
        int $outletId,
        array $lines,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $description = null
    ): JournalEntry {
        return DB::transaction(function () use ($outletId, $lines, $referenceType, $referenceId, $description) {
            $totalDebit = collect($lines)->sum('debit');
            $totalCredit = collect($lines)->sum('credit');

            if (round($totalDebit, 2) !== round($totalCredit, 2)) {
                throw new \InvalidArgumentException(
                    "Jurnal tidak seimbang. Debit: {$totalDebit}, Credit: {$totalCredit}"
                );
            }

            if ($totalDebit == 0 && $totalCredit == 0) {
                throw new \InvalidArgumentException('Total debit dan credit tidak boleh 0.');
            }

            $entryNumber = $this->generateEntryNumber();

            $entry = JournalEntry::create([
                'outlet_id' => $outletId,
                'entry_number' => $entryNumber,
                'journal_date' => now()->toDateString(),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_posted' => false,
            ]);

            foreach ($lines as $line) {
                JournalLine::create([
                    'journal_entry_id' => $entry->id,
                    'chart_of_account_id' => $line['chart_of_account_id'],
                    'debit' => $line['debit'] ?? 0,
                    'credit' => $line['credit'] ?? 0,
                    'memo' => $line['memo'] ?? null,
                ]);
            }

            return $entry->fresh(['lines.chartOfAccount']);
        });
    }

    public function postEntry(JournalEntry $entry): JournalEntry
    {
        if ($entry->is_posted) {
            throw new \InvalidArgumentException('Jurnal sudah diposting.');
        }

        if (! $entry->isBalanced()) {
            throw new \InvalidArgumentException('Jurnal tidak seimbang, tidak bisa diposting.');
        }

        $entry->update([
            'is_posted' => true,
            'posted_at' => now(),
        ]);

        return $entry->fresh();
    }

    public function reverseEntry(JournalEntry $entry, ?User $user = null): JournalEntry
    {
        if (! $entry->is_posted) {
            throw new \InvalidArgumentException('Hanya jurnal yang sudah diposting yang bisa direverse.');
        }

        $reversalLines = $entry->lines->map(fn ($line) => [
            'chart_of_account_id' => $line->chart_of_account_id,
            'debit' => $line->credit,
            'credit' => $line->debit,
            'memo' => "Reversal dari {$entry->entry_number}: {$line->memo}",
        ])->toArray();

        $reversal = $this->createEntry(
            $entry->outlet_id,
            $reversalLines,
            $entry->reference_type,
            $entry->reference_id,
            "Reversal dari {$entry->entry_number}: {$entry->description}"
        );

        return $this->postEntry($reversal);
    }

    public function getEntries(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = JournalEntry::where('outlet_id', $outletId)
            ->with(['lines.chartOfAccount', 'postedBy'])
            ->latest();

        if (isset($filters['is_posted'])) {
            $query->where('is_posted', $filters['is_posted']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('journal_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('journal_date', '<=', $filters['date_to']);
        }

        if (! empty($filters['reference_type'])) {
            $query->where('reference_type', $filters['reference_type']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getTrialBalance(int $outletId, string $asOf): array
    {
        $lines = JournalLine::whereHas('journalEntry', function ($q) use ($outletId, $asOf) {
            $q->where('outlet_id', $outletId)
                ->where('is_posted', true)
                ->whereDate('journal_date', '<=', $asOf);
        })
            ->with('chartOfAccount')
            ->get();

        $grouped = $lines->groupBy('chart_of_account_id');

        $accounts = $grouped->map(function ($accountLines, $coaId) {
            $coa = $accountLines->first()->chartOfAccount;

            return [
                'account_id' => $coa->id,
                'account_code' => $coa->code,
                'account_name' => $coa->name,
                'account_type' => $coa->type,
                'total_debit' => round($accountLines->sum('debit'), 2),
                'total_credit' => round($accountLines->sum('credit'), 2),
            ];
        })->values();

        $totalDebit = $accounts->sum('total_debit');
        $totalCredit = $accounts->sum('total_credit');

        return [
            'as_of_date' => $asOf,
            'accounts' => $accounts,
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'is_balanced' => round($totalDebit, 2) === round($totalCredit, 2),
        ];
    }

    public function getPnl(int $outletId, string $dateFrom, string $dateTo): array
    {
        $lines = JournalLine::whereHas('journalEntry', function ($q) use ($outletId, $dateFrom, $dateTo) {
            $q->where('outlet_id', $outletId)
                ->where('is_posted', true)
                ->whereBetween('journal_date', [$dateFrom, $dateTo]);
        })
            ->with('chartOfAccount')
            ->get();

        $revenueAccounts = $lines->filter(fn ($l) => $l->chartOfAccount?->type === ChartOfAccount::TYPE_REVENUE);
        $expenseAccounts = $lines->filter(fn ($l) => $l->chartOfAccount?->type === ChartOfAccount::TYPE_EXPENSE);

        $totalRevenue = $revenueAccounts->sum('credit') - $revenueAccounts->sum('debit');
        $totalExpense = $expenseAccounts->sum('debit') - $expenseAccounts->sum('credit');
        $profit = $totalRevenue - $totalExpense;

        return [
            'date_range' => ['from' => $dateFrom, 'to' => $dateTo],
            'revenue' => [
                'total' => round($totalRevenue, 2),
                'by_account' => $revenueAccounts->groupBy('chart_of_account_id')->map(function ($group) {
                    $coa = $group->first()->chartOfAccount;

                    return [
                        'code' => $coa->code,
                        'name' => $coa->name,
                        'amount' => round($group->sum('credit') - $group->sum('debit'), 2),
                    ];
                })->values(),
            ],
            'expenses' => [
                'total' => round($totalExpense, 2),
                'by_account' => $expenseAccounts->groupBy('chart_of_account_id')->map(function ($group) {
                    $coa = $group->first()->chartOfAccount;

                    return [
                        'code' => $coa->code,
                        'name' => $coa->name,
                        'amount' => round($group->sum('debit') - $group->sum('credit'), 2),
                    ];
                })->values(),
            ],
            'profit' => round($profit, 2),
            'margin_percent' => $totalRevenue > 0 ? round(($profit / $totalRevenue) * 100, 2) : 0,
        ];
    }

    public function getDefaultCoaTemplates(): array
    {
        return [
            'asset' => [
                ['code' => '1000', 'name' => 'Kas'],
                ['code' => '1100', 'name' => 'Bank'],
                ['code' => '1200', 'name' => 'Persediaan'],
                ['code' => '1300', 'name' => 'Piutang Usaha'],
                ['code' => '1400', 'name' => 'Perlengkapan'],
            ],
            'liability' => [
                ['code' => '2000', 'name' => 'Utang Usaha'],
                ['code' => '2100', 'name' => 'Utang Bank'],
                ['code' => '2200', 'name' => 'PPN Keluaran'],
            ],
            'equity' => [
                ['code' => '3000', 'name' => 'Modal Disetor'],
                ['code' => '3100', 'name' => 'Laba Ditahan'],
            ],
            'revenue' => [
                ['code' => '4000', 'name' => 'Penjualan'],
                ['code' => '4100', 'name' => 'Pendapatan Lain'],
            ],
            'cogs' => [
                ['code' => '5000', 'name' => 'HPP Bahan Baku'],
                ['code' => '5100', 'name' => 'HPP Bahan Pendukung'],
            ],
            'expense' => [
                ['code' => '6000', 'name' => 'Beban Gaji'],
                ['code' => '6100', 'name' => 'Beban Sewa'],
                ['code' => '6200', 'name' => 'Beban Listrik'],
                ['code' => '6300', 'name' => 'Beban Susut Aset'],
            ],
        ];
    }

    protected function generateEntryNumber(): string
    {
        $prefix = 'JE-'.now()->format('ymd');
        $lastEntry = JournalEntry::where('entry_number', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $sequence = $lastEntry ? (int) substr($lastEntry->entry_number, -4) + 1 : 1;

        return $prefix.str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}

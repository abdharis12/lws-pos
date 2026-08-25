<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;
use App\Services\JournalEntryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalEntryController extends Controller
{
    public function __construct(
        private readonly JournalEntryService $journalEntryService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $entries = $this->journalEntryService->getEntries($outletId, [
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'account_id' => $request->account_id,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/accounting/JournalEntries', [
            'entries' => $entries,
            'filters' => $request->only(['date_from', 'date_to', 'account_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'entry_date' => 'required|date',
            'description' => 'required|string|max:1000',
            'reference_type' => 'nullable|string|max:255',
            'reference_id' => 'nullable|integer',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:chart_of_accounts,id',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string|max:500',
        ]);

        try {
            $entry = $this->journalEntryService->createEntry(
                $this->outletId(),
                $validated,
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Jurnal {$entry->entry_number} berhasil dibuat."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function reverse(Request $request, JournalEntry $entry): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $reversed = $this->journalEntryService->reverseEntry(
                $entry,
                $validated['reason'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Jurnal {$entry->entry_number} berhasil direversal. Jurnal baru: {$reversed->entry_number}"]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function trialBalance(Request $request): Response
    {
        $outletId = $this->outletId();

        $validated = $request->validate([
            'as_of_date' => 'nullable|date',
        ]);

        $data = $this->journalEntryService->getTrialBalance($outletId, $validated['as_of_date'] ?? now()->toDateString());

        return Inertia::render('admin/accounting/TrialBalance', [
            'accounts' => $data['accounts'],
            'totalDebit' => $data['total_debit'],
            'totalCredit' => $data['total_credit'],
            'asOfDate' => $validated['as_of_date'] ?? now()->toDateString(),
        ]);
    }

    public function pnl(Request $request): Response
    {
        $outletId = $this->outletId();

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $data = $this->journalEntryService->getPnlReport($outletId, $validated);

        return Inertia::render('admin/accounting/PnlReport', [
            'revenue' => $data['revenue'],
            'cogs' => $data['cogs'],
            'expenses' => $data['expenses'],
            'netProfit' => $data['net_profit'],
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }

    public function seedCoa(Request $request): RedirectResponse
    {
        try {
            $this->journalEntryService->seedDefaultCoa($this->outletId());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Chart of Accounts default berhasil di-seed.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

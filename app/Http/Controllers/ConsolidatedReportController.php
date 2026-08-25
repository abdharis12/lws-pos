<?php

namespace App\Http\Controllers;

use App\Services\ConsolidatedReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsolidatedReportController extends Controller
{
    public function __construct(
        private readonly ConsolidatedReportService $consolidatedReportService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $data = $this->consolidatedReportService->getConsolidatedReport($outletId, $validated);

        return Inertia::render('admin/reports/Consolidated', [
            'groupPL' => $data['group_pl'],
            'benchmarks' => $data['benchmarks'],
            'summary' => $data['summary'],
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\TaxReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxReportController extends Controller
{
    public function __construct(
        private readonly TaxReportService $taxReportService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $data = $this->taxReportService->getPpnReport($outletId, $validated);

        return Inertia::render('admin/accounting/TaxReport', [
            'ppnData' => $data['ppn_data'],
            'summary' => $data['summary'],
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $outletId = $this->outletId();

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $data = $this->taxReportService->getPpnReport($outletId, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Export PPN report berhasil.',
            'data' => $data,
        ]);
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

<?php

namespace App\Http\Controllers;

use App\Exports\CogsReportExport;
use App\Exports\HppVarianceExport;
use App\Exports\StockOpnameExport;
use App\Exports\WasteReportExport;
use App\Services\HppCalculationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class HppReportController extends Controller
{
    public function __construct(
        private readonly HppCalculationService $hppService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $filters = [
            'date_from' => $request->date_from ?? now()->startOfMonth()->toDateString(),
            'date_to' => $request->date_to ?? now()->endOfMonth()->toDateString(),
        ];

        return Inertia::render('admin/reports/Hpp', [
            'variance' => $this->hppService->getTheoreticalVsActual($outletId, $filters),
            'menuEngineering' => $this->hppService->getMenuEngineering($outletId, $filters),
            'cogs' => $this->hppService->getCogsReport($outletId, $request->cogs_period ?? 'daily', $filters),
            'waste' => $this->hppService->getWasteReport($outletId, $filters),
            'topVarianceMenus' => $this->hppService->getTopVarianceMenus($outletId),
            'lowMarginMenus' => $this->hppService->getLowMarginMenus($outletId, threshold: 60),
            'filters' => [...$filters, 'cogs_period' => $request->cogs_period ?? 'daily'],
        ]);
    }

    public function exportVariance(Request $request): BinaryFileResponse
    {
        $outletId = $this->outletId();
        [$dateFrom, $dateTo] = $this->dateRange($request);

        return Excel::download(
            new HppVarianceExport($outletId, $dateFrom, $dateTo),
            "laporan-hpp-variance-{$dateFrom}-sd-{$dateTo}.xlsx"
        );
    }

    public function exportStockOpname(Request $request): BinaryFileResponse
    {
        $outletId = $this->outletId();
        $ingredientIds = $request->filled('ingredient_ids')
            ? array_map('intval', (array) $request->input('ingredient_ids'))
            : null;

        return Excel::download(
            new StockOpnameExport($outletId, $ingredientIds),
            'stock-opname-'.now()->format('Y-m-d').'.xlsx'
        );
    }

    public function exportWaste(Request $request): BinaryFileResponse
    {
        $outletId = $this->outletId();
        [$dateFrom, $dateTo] = $this->dateRange($request);

        return Excel::download(
            new WasteReportExport($outletId, $dateFrom, $dateTo, $request->ingredient_id ? (int) $request->ingredient_id : null),
            "laporan-waste-{$dateFrom}-sd-{$dateTo}.xlsx"
        );
    }

    public function exportCogs(Request $request): BinaryFileResponse
    {
        $outletId = $this->outletId();
        [$dateFrom, $dateTo] = $this->dateRange($request);
        $period = in_array($request->cogs_period, ['daily', 'weekly', 'monthly']) ? $request->cogs_period : 'daily';

        return Excel::download(
            new CogsReportExport($outletId, $period, $dateFrom, $dateTo),
            "laporan-cogs-{$period}-{$dateFrom}-sd-{$dateTo}.xlsx"
        );
    }

    protected function dateRange(Request $request): array
    {
        return [
            $request->date_from ?? now()->startOfMonth()->toDateString(),
            $request->date_to ?? now()->endOfMonth()->toDateString(),
        ];
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

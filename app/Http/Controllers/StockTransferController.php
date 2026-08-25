<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\StockTransfer;
use App\Services\StockTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockTransferController extends Controller
{
    public function __construct(
        private readonly StockTransferService $stockTransferService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $transfers = $this->stockTransferService->getTransfers($outletId, [
            'status' => $request->status,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/stock/Transfers', [
            'transfers' => $transfers,
            'outlets' => Outlet::where('is_active', true)->get(['id', 'name']),
            'filters' => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'target_outlet_id' => 'required|exists:outlets,id',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|distinct|exists:ingredients,id',
            'items.*.qty' => 'required|numeric|min:0.0001',
        ]);

        try {
            $transfer = $this->stockTransferService->createTransfer(
                $this->outletId(),
                $validated,
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Transfer {$transfer->transfer_number} berhasil dibuat."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function show(int $id): Response
    {
        $transfer = $this->stockTransferService->getTransferDetail($id);

        return Inertia::render('admin/stock/TransferDetail', [
            'transfer' => $transfer,
        ]);
    }

    public function approve(StockTransfer $transfer): RedirectResponse
    {
        try {
            $this->stockTransferService->approve($transfer, auth()->user());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Transfer berhasil disetujui.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function ship(StockTransfer $transfer): RedirectResponse
    {
        try {
            $this->stockTransferService->ship($transfer, auth()->user());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Transfer berhasil dikirim.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function receive(StockTransfer $transfer): RedirectResponse
    {
        try {
            $this->stockTransferService->receive($transfer, $this->outletId(), auth()->user());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Transfer berhasil diterima dan stok diperbarui.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function cancel(StockTransfer $transfer): RedirectResponse
    {
        try {
            $this->stockTransferService->cancel($transfer, auth()->user());
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Transfer berhasil dibatalkan.']);
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

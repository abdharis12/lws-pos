<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierService $supplierService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $suppliers = $this->supplierService->getAll($outletId, [
            'search' => $request->search,
            'is_active' => $request->is_active,
            'payment_terms' => $request->payment_terms,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/procurement/Suppliers', [
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'is_active', 'payment_terms']),
            'summary' => $this->supplierSummary($outletId),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateSupplier($request);

        $supplier = $this->supplierService->create($this->outletId(), $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Supplier {$supplier->name} berhasil ditambahkan."]);

        return redirect()->back();
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $validated = $this->validateSupplier($request, isUpdate: true);

        $this->supplierService->update($supplier, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Supplier {$supplier->name} berhasil diperbarui."]);

        return redirect()->back();
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $deleted = $this->supplierService->delete($supplier);

        $message = $deleted
            ? "Supplier {$supplier->name} berhasil dihapus."
            : "Supplier {$supplier->name} memiliki transaksi aktif, jadi dinonaktifkan.";

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect()->back();
    }

    public function recalculatePerformance(Supplier $supplier): RedirectResponse
    {
        $supplier = $this->supplierService->recalculatePerformance($supplier);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Performa supplier {$supplier->name} dihitung ulang. Rating: {$supplier->rating}/5",
        ]);

        return redirect()->back();
    }

    protected function validateSupplier(Request $request, bool $isUpdate = false): array
    {
        return $request->validate([
            'name' => 'required|string|max:255'.($isUpdate ? '' : '|unique:suppliers,name,NULL,id,outlet_id,'.$this->outletId()),
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'payment_terms' => 'nullable|in:cash,net_7,net_14,net_30,net_60',
            'lead_time_days' => 'nullable|integer|min:0|max:90',
            'is_active' => 'boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
            'on_time_delivery_rate' => 'nullable|numeric|min:0|max:100',
            'quality_rating' => 'nullable|numeric|min:0|max:5',
        ]);
    }

    protected function supplierSummary(int $outletId): array
    {
        return [
            'total_suppliers' => Supplier::where('outlet_id', $outletId)->count(),
            'active_suppliers' => Supplier::where('outlet_id', $outletId)->where('is_active', true)->count(),
            'total_outstanding' => Supplier::where('outlet_id', $outletId)
                ->withSum(['accountsPayable as outstanding' => fn ($q) => $q->where('status', '!=', 'paid')], 'balance')
                ->get()
                ->sum('outstanding'),
        ];
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

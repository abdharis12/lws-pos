<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\CustomerService;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService,
        private readonly LoyaltyService $loyaltyService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        return Inertia::render('admin/customers/Index', [
            'customers' => $this->customerService->getAll($outletId, [
                'search' => $request->search,
                'tier' => $request->tier,
                'is_active' => $request->is_active,
                'per_page' => 15,
            ]),
            'filters' => $request->only(['search', 'tier', 'is_active']),
            'summary' => $this->summary($outletId),
            'topCustomers' => $this->customerService->getTopCustomers($outletId, 5),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateCustomer($request);

        $this->customerService->create($this->outletId(), $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pelanggan berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function show(Customer $customer): Response
    {
        abort_unless($customer->outlet_id === $this->outletId(), 403);

        return Inertia::render('admin/customers/Show', [
            'customer' => $customer->load(['orders' => fn ($q) => $q->latest()->limit(10)]),
            'tierProgress' => $this->loyaltyService->getTierProgress($customer),
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($customer->outlet_id === $this->outletId(), 403);

        $this->customerService->update($customer, $this->validateCustomer($request, isUpdate: true));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pelanggan berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        abort_unless($customer->outlet_id === $this->outletId(), 403);

        $deleted = $this->customerService->delete($customer);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $deleted ? 'Pelanggan dihapus.' : 'Pelanggan memiliki riwayat transaksi, dinonaktifkan saja.',
        ]);

        return redirect()->back();
    }

    /**
     * POS quick lookup by phone — used by POS & Self-Order.
     */
    public function lookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:32',
        ]);

        $customer = $this->customerService->findByPhone(
            $this->outletId(),
            $validated['phone']
        );

        if (! $customer) {
            return response()->json(['found' => false], 200);
        }

        return response()->json([
            'found' => true,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'tier' => $customer->tier,
                'points' => $customer->points,
                'total_spend' => (float) $customer->total_spend,
                'visit_count' => $customer->visit_count,
            ],
        ]);
    }

    public function redeemPoints(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($customer->outlet_id === $this->outletId(), 403);

        $validated = $request->validate([
            'points' => 'required|integer|min:1',
        ]);

        try {
            $updated = $this->loyaltyService->redeemPoints($customer, $validated['points']);
            Inertia::flash('toast', ['type' => 'success', 'message' => "Poin berhasil ditukar. Sisa poin: {$updated->points}"]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    protected function validateCustomer(Request $request, bool $isUpdate = false): array
    {
        $rules = [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:32',
            'email' => 'nullable|email|max:255',
            'birthdate' => 'nullable|date',
            'preferences' => 'nullable|string|max:500',
            'allergens' => 'nullable|string|max:255',
        ];

        if ($isUpdate) {
            $rules['is_active'] = 'boolean';
        }

        return $request->validate($rules);
    }

    protected function summary(int $outletId): array
    {
        return [
            'total_customers' => Customer::where('outlet_id', $outletId)->count(),
            'active_customers' => Customer::where('outlet_id', $outletId)->where('is_active', true)->count(),
            'total_points_issued' => Customer::where('outlet_id', $outletId)->sum('points'),
            'gold_plus_count' => Customer::where('outlet_id', $outletId)->whereIn('tier', [Customer::TIER_GOLD, Customer::TIER_PLATINUM])->count(),
        ];
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

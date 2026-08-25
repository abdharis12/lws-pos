<?php

namespace App\Http\Controllers;

use App\Models\Promo;
use App\Models\PromoUsage;
use App\Services\PromoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PromoController extends Controller
{
    public function __construct(
        private readonly PromoService $promoService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        return Inertia::render('admin/promos/Index', [
            'promos' => $this->promoService->getAll($outletId, [
                'search' => $request->search,
                'is_active' => $request->is_active,
                'per_page' => 15,
            ]),
            'filters' => $request->only(['search', 'is_active']),
            'summary' => $this->summary($outletId),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePromo($request);

        $promo = $this->promoService->create($this->outletId(), $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Promo {$promo->code} berhasil dibuat."]);

        return redirect()->back();
    }

    public function update(Request $request, Promo $promo): RedirectResponse
    {
        abort_unless($promo->outlet_id === $this->outletId(), 403);

        $this->promoService->update($promo, $this->validatePromo($request, isUpdate: true));

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Promo berhasil diperbarui.']);

        return redirect()->back();
    }

    public function toggle(Promo $promo): RedirectResponse
    {
        abort_unless($promo->outlet_id === $this->outletId(), 403);

        $updated = $this->promoService->toggleActive($promo);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $updated->is_active ? "Promo {$updated->code} diaktifkan." : "Promo {$updated->code} dinonaktifkan.",
        ]);

        return redirect()->back();
    }

    protected function validatePromo(Request $request, bool $isUpdate = false): array
    {
        return $request->validate([
            'code' => ($isUpdate ? '' : 'unique:promos,code|').'required|string|max:64',
            'name' => 'required|string|max:255',
            'type' => 'required|in:percent,nominal,buy_x_get_y',
            'value' => [
                'required',
                'numeric',
                'min:0',
                fn (string $attribute, mixed $value, \Closure $fail) => $request->input('type') === 'percent' && $value > 100
                    ? $fail('Nilai persen maksimal 100.')
                    : null,
            ],
            'min_spend' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0|gt:value',
            'valid_from' => 'required|date',
            'valid_to' => 'required|date|after_or_equal:valid_from',
            'usage_limit' => 'nullable|integer|min:1',
            'usage_limit_per_customer' => 'nullable|integer|min:1',
            'channel' => 'required|in:all,pos,self_order',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);
    }

    protected function summary(int $outletId): array
    {
        return [
            'total_promos' => Promo::where('outlet_id', $outletId)->count(),
            'active_promos' => Promo::where('outlet_id', $outletId)->where('is_active', true)
                ->whereDate('valid_from', '<=', now())->whereDate('valid_to', '>=', now())->count(),
            'total_redemptions' => PromoUsage::whereHas('promo', fn ($q) => $q->where('outlet_id', $outletId))->count(),
            'total_discount_given' => (float) PromoUsage::whereHas('promo', fn ($q) => $q->where('outlet_id', $outletId))->sum('discount_amount'),
        ];
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

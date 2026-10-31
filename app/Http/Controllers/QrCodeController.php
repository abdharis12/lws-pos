<?php

namespace App\Http\Controllers;

use App\Models\QrCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class QrCodeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/qr-codes/Index', [
            'qrCodes' => QrCode::query()->latest('id')->get()->map(fn (QrCode $qr) => [
                'id' => $qr->id,
                'label' => $qr->label,
                'image_url' => $qr->image_url,
                'is_active' => $qr->is_active,
                'created_at' => $qr->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $path = $request->file('image')->store('qr-codes', 'public');

        $hasActive = QrCode::query()->where('is_active', true)->exists();

        QrCode::query()->create([
            'label' => $validated['label'] ?? null,
            'image_path' => $path,
            'is_active' => ! $hasActive,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'QR code berhasil diunggah.']);

        return redirect()->route('admin.qr-codes.index');
    }

    public function activate(QrCode $qrCode): RedirectResponse
    {
        $qrCode->activate();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'QR code dijadikan aktif.']);

        return redirect()->route('admin.qr-codes.index');
    }

    public function destroy(QrCode $qrCode): RedirectResponse
    {
        Storage::disk('public')->delete($qrCode->image_path);

        $wasActive = $qrCode->is_active;
        $qrCode->delete();

        if ($wasActive) {
            QrCode::query()->latest('id')->first()?->activate();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'QR code berhasil dihapus.']);

        return redirect()->route('admin.qr-codes.index');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservationService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $reservations = $this->reservationService->getReservations($outletId, [
            'status' => $request->status,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/operations/Reservations', [
            'reservations' => $reservations,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'customer_email' => 'nullable|email|max:255',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required|string|max:5',
            'party_size' => 'required|integer|min:1|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $reservation = $this->reservationService->createReservation(
                $this->outletId(),
                $validated,
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Reservasi {$reservation->reservation_number} berhasil dibuat."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function confirm(Reservation $reservation): RedirectResponse
    {
        try {
            $this->reservationService->confirm($reservation, auth()->user());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Reservasi berhasil dikonfirmasi.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function seat(Reservation $reservation): RedirectResponse
    {
        try {
            $this->reservationService->seat($reservation, auth()->user());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Pelanggan berhasil dijamu dan meja dibuka.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function cancel(Reservation $reservation): RedirectResponse
    {
        try {
            $this->reservationService->cancel($reservation, auth()->user());
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Reservasi berhasil dibatalkan.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function availableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'party_size' => 'required|integer|min:1',
        ]);

        $slots = $this->reservationService->getAvailableSlots(
            $this->outletId(),
            $validated['date'],
            $validated['party_size'],
        );

        return response()->json(['slots' => $slots]);
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

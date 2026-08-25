<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class ReservationService
{
    public function createReservation(int $outletId, array $data, ?User $user = null): Reservation
    {
        $reservation = Reservation::create([
            'outlet_id' => $outletId,
            'table_id' => $data['table_id'] ?? null,
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'customer_email' => $data['customer_email'] ?? null,
            'reservation_time' => $data['reservation_time'],
            'party_size' => $data['party_size'],
            'deposit_amount' => $data['deposit_amount'] ?? 0,
            'deposit_paid' => $data['deposit_paid'] ?? false,
            'status' => Reservation::STATUS_PENDING,
            'source' => $data['source'] ?? Reservation::SOURCE_WALKIN,
            'notes' => $data['notes'] ?? null,
            'created_by' => $user?->id,
        ]);

        return $reservation->fresh(['outlet', 'table', 'createdBy']);
    }

    public function updateStatus(Reservation $reservation, string $status): Reservation
    {
        $validStatuses = [
            Reservation::STATUS_PENDING,
            Reservation::STATUS_CONFIRMED,
            Reservation::STATUS_SEATED,
            Reservation::STATUS_COMPLETED,
            Reservation::STATUS_CANCELLED,
            Reservation::STATUS_NO_SHOW,
        ];

        if (! in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Status tidak valid: {$status}");
        }

        $reservation->update(['status' => $status]);

        return $reservation->fresh();
    }

    public function confirmReservation(Reservation $reservation): Reservation
    {
        if ($reservation->status !== Reservation::STATUS_PENDING) {
            throw new \InvalidArgumentException('Hanya reservasi pending yang bisa dikonfirmasi.');
        }

        $reservation->update(['status' => Reservation::STATUS_CONFIRMED]);

        return $reservation->fresh();
    }

    public function seatReservation(Reservation $reservation): Reservation
    {
        if ($reservation->status !== Reservation::STATUS_CONFIRMED) {
            throw new \InvalidArgumentException('Hanya reservasi confirmed yang bisa di-dudukkan.');
        }

        $reservation->update(['status' => Reservation::STATUS_SEATED]);

        return $reservation->fresh();
    }

    public function cancelReservation(Reservation $reservation): Reservation
    {
        if (in_array($reservation->status, [Reservation::STATUS_SEATED, Reservation::STATUS_COMPLETED, Reservation::STATUS_CANCELLED])) {
            throw new \InvalidArgumentException('Reservasi yang sudah duduk, selesai, atau dibatalkan tidak bisa dibatalkan.');
        }

        $reservation->update(['status' => Reservation::STATUS_CANCELLED]);

        return $reservation->fresh();
    }

    public function getReservations(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = Reservation::where('outlet_id', $outletId)
            ->with(['outlet', 'table', 'createdBy'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date'])) {
            $query->whereDate('reservation_time', $filters['date']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('reservation_time', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('reservation_time', '<=', $filters['date_to']);
        }

        if (! empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getAvailableSlots(int $outletId, string $date): array
    {
        $reservations = Reservation::where('outlet_id', $outletId)
            ->whereDate('reservation_time', $date)
            ->whereIn('status', [Reservation::STATUS_PENDING, Reservation::STATUS_CONFIRMED, Reservation::STATUS_SEATED])
            ->get();

        $bookedSlots = $reservations->map(fn ($r) => $r->reservation_time->format('H:i'))->toArray();

        $allSlots = [];
        for ($hour = 10; $hour <= 22; $hour++) {
            foreach ([0, 30] as $minute) {
                $slot = sprintf('%02d:%02d', $hour, $minute);
                $allSlots[] = [
                    'time' => $slot,
                    'available' => ! in_array($slot, $bookedSlots),
                ];
            }
        }

        return $allSlots;
    }
}

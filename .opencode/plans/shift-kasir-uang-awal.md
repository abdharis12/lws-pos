# Implementasi Shift Kasir 2 Shift + Uang Awal

## 1. Migration: update_shifts_add_shift_number

```php
public function up(): void
{
    Schema::table('shifts', function (Blueprint $table) {
        $table->dropUnique('shifts_employee_date_unique');
    });

    Schema::table('shifts', function (Blueprint $table) {
        $table->tinyInteger('shift_number')->default(1)->after('employee_id');
        $table->unique(['employee_id', 'shift_date', 'shift_number'], 'shifts_employee_date_shift_unique');
    });
}

public function down(): void
{
    Schema::table('shifts', function (Blueprint $table) {
        $table->dropUnique('shifts_employee_date_shift_unique');
    });

    Schema::table('shifts', function (Blueprint $table) {
        $table->dropColumn('shift_number');
        $table->unique(['employee_id', 'shift_date'], 'shifts_employee_date_unique');
    });
}
```

## 2. Migration: create_pos_sessions_table

```php
Schema::create('pos_sessions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
    $table->date('session_date');
    $table->decimal('opening_balance', 15, 2)->default(0);
    $table->dateTime('opened_at');
    $table->dateTime('closed_at')->nullable();
    $table->decimal('total_cash', 15, 2)->default(0);
    $table->decimal('total_non_cash', 15, 2)->default(0);
    $table->integer('total_transactions')->default(0);
    $table->string('status')->default('open');
    $table->foreignId('opened_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});
```

## 3. Migration: add_pos_session_id_to_orders

```php
Schema::table('orders', function (Blueprint $table) {
    $table->foreignId('pos_session_id')->nullable()->after('created_by')->constrained()->nullOnDelete();
});
```

## 4. Shift Model — update

Add `shift_number` to `$fillable` and `$casts`:
- `$fillable`: add `'shift_number'`
- `$casts`: add `'shift_number' => 'integer'`

## 5. PosSession Model — baru

`app/Models/PosSession.php`:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'outlet_id', 'session_date', 'opening_balance',
        'opened_at', 'closed_at',
        'total_cash', 'total_non_cash', 'total_transactions',
        'status', 'opened_by', 'closed_by',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_balance' => 'decimal:2',
            'total_cash' => 'decimal:2',
            'total_non_cash' => 'decimal:2',
            'total_transactions' => 'integer',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
```

## 6. Order Model — update

Add:
```php
public function posSession(): BelongsTo
{
    return $this->belongsTo(PosSession::class);
}
```

Add `'pos_session_id'` to `$fillable`.

## 7. ShiftController — update

### store()
- Add `'shift_number' => 'nullable|integer|in:1,2'` to validation
- Default `shift_number` to 1 if not provided
- Use `$validated['shift_number'] ?? 1` when creating
- Update duplicate check to include `shift_number`

### bulkStore()
- Add `shift_number` to the bulk payload
- Default to 1 if not provided

## 8. PosSessionController — baru

`app/Http/Controllers/PosSessionController.php`:

### store(Request)
- Validate: `opening_balance` (required|numeric|min:0)
- Only admin/owner can create
- Auto-set: outlet_id, session_date=today, opened_at=now, opened_by=current user
- Check no open session exists for today
- Return the session data

### show(PosSession)
- Return session + shift handover summary
- Calculate shift 1 & shift 2 transaction summaries based on shift schedule
- Group orders by shift

### close(PosSession, Request)
- Only admin/owner
- Set closed_at=now, closed_by=current user, status=closed
- Calculate final totals from linked orders

## 9. Routes

Add to `routes/web.php` inside `auth,verified` group:

```php
Route::post('pos/sessions', [PosSessionController::class, 'store'])->name('pos.sessions.store');
Route::get('pos/sessions/{posSession}', [PosSessionController::class, 'show'])->name('pos.sessions.show');
Route::post('pos/sessions/{posSession}/close', [PosSessionController::class, 'close'])->name('pos.sessions.close');
```

## 10. PosController — update

### index()
- Check if today has an open PosSession
- If no open session + user is admin/owner: show opening balance form
- If open session exists: pass session data (opening balance, total transaksi, dll)
- Calculate shift handover info: based on shift schedule, if current time is past shift 1 end time and shift 2 hasn't started yet, show shift 1 summary

### store() (create order)
- Auto-set `pos_session_id` from the current open session
- After order is paid (especially cash), update session total_cash/total_transactions

## 11. Frontend POS — update

### `resources/js/pages/pos/Index.tsx`

**A. Opening Balance Panel** (admin/owner only, shown when no session exists):
- Form input: opening_balance (uang awal)
- Button "Buka Session"
- Submit POST /pos/sessions

**B. Session Info Header** (shown when session is open):
- Opening balance display
- Total transaksi hari ini
- Total penjualan cash & non-cash

**C. Shift Handover Card** (shown when shift 1 ended based on schedule):
- Nama kasir shift 1
- Jam shift 1 (dari jadwal)
- Total transaksi shift 1
- Total penjualan shift 1
- Jika shift 2 sudah berjalan: info kasir shift 2

### Data flow:
- PosController@index sends: `currentSession`, `shiftSummary`, `hasOpenSession`
- Frontend renders conditionally based on these props

## 12. Frontend Shift — update

### `resources/js/pages/admin/shifts/Index.tsx`

Update form tambah shift:
- Add select field: Shift (1 / 2) after employee select
- Sent as `shift_number` in form data
- Update handleAddShift to include shift_number
- Update handleBulkAssign to include shift_number
- Show shift number badge on shift cards

## 13. Tests

Create `tests/Feature/PosSessionTest.php`:
- test admin can open session with opening balance
- test cashier cannot open session
- test cannot open duplicate session for same day
- test session shows correct totals
- test close session
- test shift handover summary

Update `tests/Feature/ShiftTest.php`:
- test can create shift 1 and shift 2 for same employee on same day
- test bulk assign with shift_number

## Implementation Order

1. Migrations (3 files)
2. Models (Shift update, PosSession baru, Order update)
3. ShiftController update
4. PosSessionController baru
5. Routes
6. PosController update
7. Frontend POS (Index.tsx)
8. Frontend Shift (Index.tsx)
9. Tests
10. Pint + run tests

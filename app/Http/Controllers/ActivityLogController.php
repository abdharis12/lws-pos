<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ActivityLog::class);

        $query = $this->applyFilters(ActivityLog::with('user'), $request);
        $perPage = min((int) $request->input('per_page', 20), 100);
        $logs = $query->latest()->paginate($perPage)->withQueryString();

        $actions = Cache::remember('activity_log_actions', 3600, fn () => ActivityLog::select('action')->distinct()->orderBy('action')->pluck('action')->toArray());

        return Inertia::render('admin/activity-logs/Index', [
            'logs' => $logs,
            'actions' => $actions,
            'filters' => $request->only(['action', 'user_id', 'start_date', 'end_date']),
        ]);
    }

    protected function applyFilters(Builder $query, Request $request): Builder
    {
        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', Carbon::parse($request->input('start_date'))->startOfDay());
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', Carbon::parse($request->input('end_date'))->endOfDay());
        }

        return $query;
    }
}

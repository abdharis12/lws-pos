<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(
        private readonly TaskService $taskService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $tasks = $this->taskService->getTasks($outletId, [
            'status' => $request->status,
            'priority' => $request->priority,
            'assigned_to' => $request->assigned_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/operations/Tasks', [
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'priority', 'assigned_to']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:employees,id',
        ]);

        try {
            $task = $this->taskService->createTask(
                $this->outletId(),
                $validated,
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Task {$task->title} berhasil dibuat."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        try {
            $this->taskService->updateStatus(
                $task,
                $validated['status'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Status task berhasil diperbarui.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function assign(Request $request, Task $task): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        try {
            $this->taskService->assign(
                $task,
                $validated['employee_id'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Task berhasil ditugaskan.']);
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

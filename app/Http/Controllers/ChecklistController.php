<?php

namespace App\Http\Controllers;

use App\Services\ChecklistService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChecklistController extends Controller
{
    public function __construct(
        private readonly ChecklistService $checklistService,
    ) {}

    public function templateIndex(Request $request): Response
    {
        $outletId = $this->outletId();

        $templates = $this->checklistService->getTemplates($outletId, [
            'search' => $request->search,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/operations/ChecklistTemplates', [
            'templates' => $templates,
            'filters' => $request->only(['search']),
        ]);
    }

    public function templateStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'frequency' => 'required|in:daily,weekly,monthly',
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.sort_order' => 'nullable|integer|min:0',
        ]);

        try {
            $template = $this->checklistService->createTemplate(
                $this->outletId(),
                $validated,
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => "Template checklist {$template->name} berhasil dibuat."]);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function executionIndex(Request $request): Response
    {
        $outletId = $this->outletId();

        $executions = $this->checklistService->getExecutions($outletId, [
            'status' => $request->status,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/operations/ChecklistExecutions', [
            'executions' => $executions,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }

    public function executionStart(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:checklist_templates,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $execution = $this->checklistService->startExecution(
                $this->outletId(),
                $validated['template_id'],
                $request->user(),
                $validated['notes'] ?? null,
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Eksekusi checklist berhasil dimulai.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function executionComplete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'execution_id' => 'required|exists:checklist_executions,id',
            'items' => 'required|array|min:1',
            'items.*.checklist_item_id' => 'required|exists:checklist_items,id',
            'items.*.is_completed' => 'required|boolean',
            'items.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $this->checklistService->completeExecution(
                $validated['execution_id'],
                $validated['items'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Checklist berhasil diselesaikan.']);
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

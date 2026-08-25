<?php

namespace App\Services;

use App\Models\ChecklistExecution;
use App\Models\ChecklistExecutionItem;
use App\Models\ChecklistTemplate;
use App\Models\ChecklistTemplateItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ChecklistService
{
    public function createTemplate(int $outletId, array $data): ChecklistTemplate
    {
        return DB::transaction(function () use ($outletId, $data) {
            $template = ChecklistTemplate::create([
                'outlet_id' => $outletId,
                'name' => $data['name'],
                'type' => $data['type'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (! empty($data['items'])) {
                foreach ($data['items'] as $index => $item) {
                    ChecklistTemplateItem::create([
                        'checklist_template_id' => $template->id,
                        'title' => $item['title'],
                        'description' => $item['description'] ?? null,
                        'is_mandatory' => $item['is_mandatory'] ?? false,
                        'requires_photo' => $item['requires_photo'] ?? false,
                        'sort_order' => $item['sort_order'] ?? $index + 1,
                    ]);
                }
            }

            return $template->fresh('items');
        });
    }

    public function getTemplates(int $outletId): Collection
    {
        return ChecklistTemplate::where('outlet_id', $outletId)
            ->with('items')
            ->get();
    }

    public function startChecklistExecution(int $templateId, int $employeeId, int $outletId): ChecklistExecution
    {
        return DB::transaction(function () use ($templateId, $employeeId, $outletId) {
            $template = ChecklistTemplate::with('items')->findOrFail($templateId);

            $execution = ChecklistExecution::create([
                'checklist_template_id' => $template->id,
                'employee_id' => $employeeId,
                'outlet_id' => $outletId,
                'shift_date' => now()->toDateString(),
                'executed_at' => now(),
                'status' => ChecklistExecution::STATUS_IN_PROGRESS,
            ]);

            foreach ($template->items as $templateItem) {
                ChecklistExecutionItem::create([
                    'checklist_execution_id' => $execution->id,
                    'checklist_template_item_id' => $templateItem->id,
                    'is_done' => false,
                ]);
            }

            return $execution->fresh(['items.checklistTemplateItem', 'checklistTemplate']);
        });
    }

    public function completeChecklistExecution(ChecklistExecution $execution, array $itemResults): ChecklistExecution
    {
        return DB::transaction(function () use ($execution, $itemResults) {
            foreach ($itemResults as $result) {
                $executionItem = ChecklistExecutionItem::where('checklist_execution_id', $execution->id)
                    ->where('id', $result['id'])
                    ->firstOrFail();

                $executionItem->update([
                    'is_done' => $result['is_done'],
                    'notes' => $result['notes'] ?? null,
                    'photo_path' => $result['photo_path'] ?? null,
                ]);
            }

            $allItems = $execution->items()->get();
            $totalItems = $allItems->count();
            $doneItems = $allItems->filter->is_done->count();

            $execution->update([
                'status' => ChecklistExecution::STATUS_COMPLETED,
                'completed_at' => now(),
            ]);

            return $execution->fresh(['items.checklistTemplateItem', 'employee', 'outlet']);
        });
    }

    public function getExecutions(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = ChecklistExecution::where('outlet_id', $outletId)
            ->with(['checklistTemplate', 'employee', 'items.checklistTemplateItem'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['template_id'])) {
            $query->where('checklist_template_id', $filters['template_id']);
        }

        if (! empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('shift_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('shift_date', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }
}

<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class TaskService
{
    public function createTask(int $outletId, array $data, ?User $user = null): Task
    {
        $task = Task::create([
            'outlet_id' => $outletId,
            'assignee_id' => $data['assignee_id'] ?? null,
            'assigned_by' => $user?->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'due_at' => $data['due_at'] ?? null,
            'status' => Task::STATUS_PENDING,
            'priority' => $data['priority'] ?? Task::PRIORITY_MEDIUM,
            'recurrence_rule' => $data['recurrence_rule'] ?? null,
            'parent_task_id' => $data['parent_task_id'] ?? null,
        ]);

        return $task->fresh(['assignee', 'assignedBy', 'outlet']);
    }

    public function updateTaskStatus(Task $task, string $status, ?string $proofPhoto = null): Task
    {
        $validStatuses = [Task::STATUS_PENDING, Task::STATUS_IN_PROGRESS, Task::STATUS_COMPLETED, Task::STATUS_CANCELLED];

        if (! in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Status tidak valid: {$status}");
        }

        $updateData = ['status' => $status];

        if ($status === Task::STATUS_COMPLETED) {
            $updateData['completed_at'] = now();
            if ($proofPhoto) {
                $updateData['proof_photo_path'] = $proofPhoto;
            }
        }

        $task->update($updateData);

        return $task->fresh(['assignee', 'outlet']);
    }

    public function assignTask(int $taskId, int $employeeId): Task
    {
        $task = Task::findOrFail($taskId);
        $employee = Employee::findOrFail($employeeId);

        $task->update(['assignee_id' => $employee->id]);

        return $task->fresh(['assignee', 'outlet']);
    }

    public function getTasks(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = Task::where('outlet_id', $outletId)
            ->with(['assignee', 'assignedBy', 'outlet'])
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['assignee_id'])) {
            $query->where('assignee_id', $filters['assignee_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('due_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('due_at', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getMyTasks(int $employeeId): Collection
    {
        return Task::where('assignee_id', $employeeId)
            ->whereIn('status', [Task::STATUS_PENDING, Task::STATUS_IN_PROGRESS])
            ->with(['outlet', 'assignedBy'])
            ->orderBy('due_at')
            ->get();
    }
}

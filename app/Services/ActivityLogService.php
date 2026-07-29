<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogService
{
    public function log(
        ?User $user,
        string $action,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?string $description = null,
        ?array $metadata = null,
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }
}

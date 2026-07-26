<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    public static function log(
        string $action,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?string $description = null,
        ?array $metadata = null,
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => Request::user()?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }
}

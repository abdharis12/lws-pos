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
            'metadata' => $this->sanitizeMetadata($metadata),
        ]);
    }

    private function sanitizeMetadata(?array $metadata): ?array
    {
        if ($metadata === null) {
            return null;
        }

        return array_map(function ($value) {
            if (is_string($value)) {
                // Remove control characters that could break log parsers
                return preg_replace('/[\r\n\x00-\x1F]/', '', $value);
            }
            if (is_array($value)) {
                return $this->sanitizeMetadata($value);
            }
            return $value;
        }, $metadata);
    }
}

<?php

namespace App\Enums;

enum OrderItemStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Ready = 'ready';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

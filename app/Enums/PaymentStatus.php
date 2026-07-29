<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Success = 'success';
    case Settlement = 'settlement';
    case Failed = 'failed';
    case Expired = 'expired';
}

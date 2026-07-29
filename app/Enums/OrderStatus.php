<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PendingPayment = 'pending_payment';
    case Pending = 'pending';
    case Paid = 'paid';
    case Processing = 'processing';
    case Processed = 'processed';
    case Ready = 'ready';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}

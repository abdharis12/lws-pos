<?php

namespace App\Enums;

enum OrderType: string
{
    case DineIn = 'dine_in';
    case DineInQr = 'dine_in_qr';
    case Takeaway = 'takeaway';
}

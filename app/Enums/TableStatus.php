<?php

namespace App\Enums;

enum TableStatus: string
{
    case Available = 'available';
    case Occupied = 'occupied';
    case Locked = 'locked';
    case Reserved = 'reserved';
}

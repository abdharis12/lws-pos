<?php

namespace App\Support;

class Money
{
    public static function ceilTo500(float $n): float
    {
        if ($n <= 0) {
            return 0;
        }

        return (float) (ceil($n / 500) * 500);
    }

    public static function roundingAmount(float $n): float
    {
        return max(0.0, self::ceilTo500($n) - $n);
    }
}

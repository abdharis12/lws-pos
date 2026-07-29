<?php

return [
    'tax_rate' => env('POS_TAX_RATE', 0.10),
    'service_charge_rate' => env('POS_SERVICE_CHARGE_RATE', 0.05),
    'midtrans_charge_percentage' => env('MIDTRANS_CHARGE_PERCENTAGE', 2.5),
    'discount' => [
        'percentage_threshold' => env('POS_DISCOUNT_PERCENTAGE_THRESHOLD', 10),
        'nominal_threshold' => env('POS_DISCOUNT_NOMINAL_THRESHOLD', 50000),
    ],
    'order_number_prefix' => env('ORDER_NUMBER_PREFIX', 'TRX-LW-'),
    'midtrans' => [
        'allowed_ips' => env('MIDTRANS_ALLOWED_IPS')
            ? explode(',', env('MIDTRANS_ALLOWED_IPS'))
            : [],
        'charge_percentage' => env('MIDTRANS_CHARGE_PERCENTAGE', 2.5),
    ],
];

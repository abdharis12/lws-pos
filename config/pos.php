<?php

return [
    'tax_rate' => env('POS_TAX_RATE', 0.10),
    'midtrans_charge_percentage' => env('MIDTRANS_CHARGE_PERCENTAGE', 2.5),
    'discount' => [
        'percentage_threshold' => env('POS_DISCOUNT_PERCENTAGE_THRESHOLD', 10),
        'nominal_threshold' => env('POS_DISCOUNT_NOMINAL_THRESHOLD', 50000),
    ],
    'order_number_prefix' => env('ORDER_NUMBER_PREFIX', 'TRX-LW-'),
    'self_order_qr_expiry_minutes' => env('SELF_ORDER_QR_EXPIRY_MINUTES', 15),
    'midtrans' => [
        'allowed_ips' => env('MIDTRANS_ALLOWED_IPS')
            ? explode(',', env('MIDTRANS_ALLOWED_IPS'))
            : [],
        'charge_percentage' => env('MIDTRANS_CHARGE_PERCENTAGE', 2.5),
    ],
];

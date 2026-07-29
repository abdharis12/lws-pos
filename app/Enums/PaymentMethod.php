<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Online = 'online';
    case Qris = 'qris';
    case DebitCard = 'debit_card';
    case CreditCard = 'credit_card';
    case BcaVa = 'bca_va';
    case MandiriVa = 'mandiri_va';
    case BniVa = 'bni_va';
    case BriVa = 'bri_va';
    case PermataVa = 'permata_va';
    case Gopay = 'gopay';
    case Shopeepay = 'shopeepay';
    case Indomaret = 'indomaret';
    case Alfamart = 'alfamart';
}

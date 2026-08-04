<?php

namespace App\Services;

/**
 * Renders a POS receipt as ESC/POS bytes for thermal printers.
 *
 * The renderer is pure — it takes a normalized data array and emits bytes.
 * It does not know anything about transport (BLE, USB, network); that is
 * the caller's responsibility. This lets the same renderer be reused by
 * the browser-side TypeScript encoder for low-latency BLE/USB paths.
 *
 * Expected data array shape (matches frontend PrintReceiptData):
 *   orderNumber: string
 *   createdAt: string (ISO 8601)
 *   kasir: string
 *   orderType: string
 *   tableCode: string|null
 *   customerName: string|null
 *   receiptItems: [{ name, qty, basePrice, totalPrice, options:[{name,price,quantity}], notes:string|null }]
 *   subtotal: float
 *   tax: float
 *   serviceCharge: float
 *   midtransCharge: float
 *   discount: float
 *   roundingAmount?: float
 *   discountLabel: string|null
 *   total: float
 *   paymentMethod: string|null
 *   cashAmount?: float|null
 *   change?: float|null
 */
class ReceiptRenderer
{
    public const PAYMENT_LABELS = [
        'cash' => 'Tunai',
        'qris' => 'QRIS',
        'debit' => 'Kartu Debit',
        'credit' => 'Kartu Kredit',
        'gopay' => 'GoPay',
        'shopeepay' => 'ShopeePay',
        'bca_va' => 'BCA VA',
        'mandiri_va' => 'Mandiri VA',
        'bni_va' => 'BNI VA',
        'bri_va' => 'BRI VA',
        'permata_va' => 'Permata VA',
        'echannel' => 'Mandiri Bill',
        'indomaret' => 'Indomaret',
        'alfamart' => 'Alfamart',
        'akulaku' => 'Akulaku',
    ];

    public const ORDER_TYPE_LABELS = [
        'dine_in' => 'Dine-in',
        'dine_in_qr' => 'Dine-in',
        'cashier' => 'Dine-in',
        'takeaway' => 'Take Away',
    ];

    /**
     * @param  array<string, mixed>  $data
     */
    public static function render(array $data, int $charsPerLine = 32): EscPosReceiptBuilder
    {
        $b = new EscPosReceiptBuilder($charsPerLine);
        $b->initialize();

        // Header
        $b->setAlign(EscPosReceiptBuilder::ALIGN_CENTER)
            ->setTextSize(EscPosReceiptBuilder::TEXT_DOUBLE_BOTH)
            ->line("LW's by Bubur Kang LW")
            ->setTextSize(EscPosReceiptBuilder::TEXT_NORMAL)
            ->line('Jl. Angkatan 45, Palembang')
            ->line('Telp: 0813-1234-5678')
            ->emptyLine()
            ->setAlign(EscPosReceiptBuilder::ALIGN_LEFT)
            ->divider('-');

        // Meta info
        $b->twoColumn('No. Struk', (string) ($data['orderNumber'] ?? '—'));
        $b->twoColumn('Tanggal', self::formatDate($data['createdAt'] ?? null));
        $b->twoColumn('Waktu', self::formatTime($data['createdAt'] ?? null));
        $b->twoColumn('Kasir', $data['kasir'] ?? '—');
        $b->twoColumn('Tipe', self::orderTypeLabel($data['orderType'] ?? null));
        $b->twoColumn('Meja', $data['tableCode'] ? 'Meja '.self::truncate((string) $data['tableCode'], 24) : '—');

        if (! empty($data['customerName'])) {
            $b->twoColumn('Pelanggan', self::truncate((string) $data['customerName'], 24));
        }

        $b->divider('-');

        // Items
        foreach (($data['receiptItems'] ?? []) as $item) {
            $name = self::truncate((string) ($item['name'] ?? ''), 28);
            $qty = (int) ($item['qty'] ?? 0);
            $basePrice = (float) ($item['basePrice'] ?? 0);

            $b->setBold(true)->line("{$qty}x {$name}")->setBold(false);

            $itemTotal = (float) ($item['totalPrice'] ?? 0);
            $b->twoColumn('   @'.self::money($basePrice), self::money($itemTotal));

            foreach (($item['options'] ?? []) as $opt) {
                $optName = self::truncate((string) ($opt['name'] ?? ''), 22);
                $optQty = (int) ($opt['quantity'] ?? 1);
                $optPrice = (float) ($opt['price'] ?? 0);

                if ($optPrice > 0) {
                    $qtyLabel = $optQty > 1 ? " x{$optQty}" : '';
                    $linePrice = self::money($optPrice * $optQty * $qty);
                    $b->line("   + {$optName}{$qtyLabel} {$linePrice}");
                } else {
                    $qtyLabel = $optQty > 1 ? " x{$optQty}" : '';
                    $b->line("   + {$optName}{$qtyLabel}");
                }
            }

            if (! empty($item['notes'])) {
                $b->line('   Catatan: '.self::truncate((string) $item['notes'], 24));
            }
        }

        $b->divider('-');

        // Totals
        $b->twoColumn('Subtotal', self::money((float) ($data['subtotal'] ?? 0)));

        $serviceCharge = (float) ($data['serviceCharge'] ?? 0);
        if ($serviceCharge > 0) {
            $b->twoColumn('Service Charge (5%)', self::money($serviceCharge));
        }

        $b->twoColumn('Pajak Resto (10%)', self::money((float) ($data['tax'] ?? 0)));

        $midtransCharge = (float) ($data['midtransCharge'] ?? 0);
        if ($midtransCharge > 0) {
            $b->twoColumn('Biaya Transaksi Online', self::money($midtransCharge));
        }

        $discount = (float) ($data['discount'] ?? 0);
        if ($discount > 0) {
            $label = 'Diskon';
            if (! empty($data['discountLabel'])) {
                $label .= ' ('.$data['discountLabel'].')';
            }
            $b->twoColumn($label, '-'.self::money($discount));
        }

        $rounding = (float) ($data['roundingAmount'] ?? 0);
        if ($rounding > 0) {
            $b->twoColumn('Pembulatan', self::money($rounding));
        }

        $b->setBold(true)
            ->setTextSize(EscPosReceiptBuilder::TEXT_DOUBLE_H)
            ->twoColumn('TOTAL', self::money((float) ($data['total'] ?? 0)))
            ->setTextSize(EscPosReceiptBuilder::TEXT_NORMAL)
            ->setBold(false);

        // Cash payment block
        if (($data['paymentMethod'] ?? null) === 'cash' && ! empty($data['cashAmount'])) {
            $b->emptyLine()
                ->twoColumn('Dibayar', self::money((float) $data['cashAmount']))
                ->twoColumn('Kembalian', self::money((float) ($data['change'] ?? 0)));
        }

        $b->emptyLine()->divider('-');

        // Payment label centered
        $paymentLabel = self::paymentLabel($data['paymentMethod'] ?? null);
        $b->setAlign(EscPosReceiptBuilder::ALIGN_CENTER)
            ->setBold(true)
            ->line($paymentLabel)
            ->setBold(false)
            ->divider('-')
            ->emptyLine()
            ->line('~ TERIMA KASIH ATAS KUNJUNGAN ANDA ~')
            ->line('Selamat Menikmati Hidangan dari')
            ->line("LW's by Bubur Kang LW")
            ->cut(EscPosReceiptBuilder::CUT_FULL);

        return $b;
    }

    private static function formatDate(?string $iso): string
    {
        if (! $iso) {
            return '—';
        }
        try {
            return (new \DateTimeImmutable($iso))->format('d/m/Y');
        } catch (\Throwable) {
            return '—';
        }
    }

    private static function formatTime(?string $iso): string
    {
        if (! $iso) {
            return '—';
        }
        try {
            return (new \DateTimeImmutable($iso))->format('H:i');
        } catch (\Throwable) {
            return '—';
        }
    }

    private static function money(float $amount): string
    {
        return 'Rp '.number_format((int) round($amount), 0, ',', '.');
    }

    private static function truncate(string $text, int $max): string
    {
        if (mb_strlen($text) <= $max) {
            return $text;
        }

        return mb_substr($text, 0, $max - 1).'…';
    }

    private static function paymentLabel(?string $method): string
    {
        if (! $method) {
            return '—';
        }

        return self::PAYMENT_LABELS[$method] ?? strtoupper($method);
    }

    private static function orderTypeLabel(?string $type): string
    {
        if (! $type) {
            return '—';
        }

        return self::ORDER_TYPE_LABELS[$type] ?? $type;
    }
}

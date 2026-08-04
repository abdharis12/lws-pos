<?php

use App\Services\ReceiptRenderer;

function sampleReceipt(): array
{
    return [
        'orderNumber' => 'TRX-LW-1',
        'createdAt' => '2026-08-04T10:30:00+07:00',
        'kasir' => 'Budi',
        'orderType' => 'dine_in',
        'tableCode' => '5',
        'customerName' => null,
        'receiptItems' => [
            [
                'name' => 'Nasi Goreng',
                'qty' => 2,
                'basePrice' => 25000,
                'totalPrice' => 50000,
                'options' => [],
                'notes' => null,
            ],
        ],
        'subtotal' => 50000,
        'tax' => 5000,
        'serviceCharge' => 0,
        'midtransCharge' => 0,
        'discount' => 0,
        'roundingAmount' => 0,
        'discountLabel' => null,
        'total' => 55000,
        'paymentMethod' => 'cash',
        'cashAmount' => 60000,
        'change' => 5000,
    ];
}

test('render returns a populated EscPosReceiptBuilder', function () {
    $b = ReceiptRenderer::render(sampleReceipt(), 32);
    $bytes = $b->getBytes();

    expect(mb_strlen($bytes))->toBeGreaterThan(100);
    expect(str_starts_with($bytes, "\x1B\x40"))->toBeTrue();
    expect(str_ends_with($bytes, "\x1D\x56\x00"))->toBeTrue();
});

test('render includes header and metadata', function () {
    $b = ReceiptRenderer::render(sampleReceipt(), 32);
    $bytes = $b->getBytes();

    expect(str_contains($bytes, "LW's by Bubur Kang LW"))->toBeTrue();
    expect(str_contains($bytes, 'No. Struk'))->toBeTrue();
    expect(str_contains($bytes, 'TRX-LW-1'))->toBeTrue();
    expect(str_contains($bytes, 'Budi'))->toBeTrue();
    expect(str_contains($bytes, 'Meja 5'))->toBeTrue();
    expect(str_contains($bytes, 'Dine-in'))->toBeTrue();
});

test('render includes item line', function () {
    $b = ReceiptRenderer::render(sampleReceipt(), 32);
    $bytes = $b->getBytes();

    expect(str_contains($bytes, '2x Nasi Goreng'))->toBeTrue();
    expect(str_contains($bytes, 'Rp 50.000'))->toBeTrue();
});

test('render includes totals', function () {
    $b = ReceiptRenderer::render(sampleReceipt(), 32);
    $bytes = $b->getBytes();

    expect(str_contains($bytes, 'Subtotal'))->toBeTrue();
    expect(str_contains($bytes, 'Pajak Resto (10%)'))->toBeTrue();
    expect(str_contains($bytes, 'TOTAL'))->toBeTrue();
});

test('render includes cash payment block', function () {
    $b = ReceiptRenderer::render(sampleReceipt(), 32);
    $bytes = $b->getBytes();

    expect(str_contains($bytes, 'Dibayar'))->toBeTrue();
    expect(str_contains($bytes, 'Kembalian'))->toBeTrue();
    expect(str_contains($bytes, 'Tunai'))->toBeTrue();
});

test('render omits service charge when zero', function () {
    $data = sampleReceipt();
    $data['serviceCharge'] = 0;

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Service Charge'))->toBeFalse();
});

test('render includes service charge when present', function () {
    $data = sampleReceipt();
    $data['serviceCharge'] = 2500;

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Service Charge'))->toBeTrue();
});

test('render omits midtrans charge for cash', function () {
    $data = sampleReceipt();
    $data['paymentMethod'] = 'cash';

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Biaya Transaksi'))->toBeFalse();
});

test('render includes midtrans charge for online payment', function () {
    $data = sampleReceipt();
    $data['paymentMethod'] = 'qris';
    $data['midtransCharge'] = 1500;
    $data['cashAmount'] = null;
    $data['change'] = null;

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Biaya Transaksi'))->toBeTrue();
    expect(str_contains($b->getBytes(), 'QRIS'))->toBeTrue();
});

test('render includes discount label', function () {
    $data = sampleReceipt();
    $data['discount'] = 5000;
    $data['discountLabel'] = '10%';

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Diskon (10%)'))->toBeTrue();
});

test('render includes customer name when present', function () {
    $data = sampleReceipt();
    $data['customerName'] = 'Andi';

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Pelanggan'))->toBeTrue();
    expect(str_contains($b->getBytes(), 'Andi'))->toBeTrue();
});

test('render uses takeaway label', function () {
    $data = sampleReceipt();
    $data['orderType'] = 'takeaway';
    $data['tableCode'] = null;

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Take Away'))->toBeTrue();
});

test('render includes item options', function () {
    $data = sampleReceipt();
    $data['receiptItems'][0]['options'] = [
        ['name' => 'Extra Pedas', 'price' => 2000, 'quantity' => 1],
    ];

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Extra Pedas'))->toBeTrue();
});

test('render includes item notes', function () {
    $data = sampleReceipt();
    $data['receiptItems'][0]['notes'] = 'Pedes banget';

    $b = ReceiptRenderer::render($data, 32);
    expect(str_contains($b->getBytes(), 'Pedes banget'))->toBeTrue();
});

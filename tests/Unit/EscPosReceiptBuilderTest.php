<?php

use App\Services\EscPosReceiptBuilder;

function escBytes(string $str): array
{
    return array_values(unpack('C*', $str));
}

test('initialize emits ESC @', function () {
    $b = new EscPosReceiptBuilder;
    $b->initialize();

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x40]);
});

test('setAlign emits ESC a n', function () {
    $b = new EscPosReceiptBuilder;
    $b->setAlign(EscPosReceiptBuilder::ALIGN_CENTER);

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x61, 0x01]);
});

test('setBold on and off', function () {
    $b = new EscPosReceiptBuilder;
    $b->setBold(true)->setBold(false);

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x45, 0x01, 0x1B, 0x45, 0x00]);
});

test('text emits raw utf-8 bytes verbatim', function () {
    $b = new EscPosReceiptBuilder;
    $b->text('Halo');

    expect($b->getBytes())->toBe('Halo');
});

test('line appends LF', function () {
    $b = new EscPosReceiptBuilder;
    $b->line('Tes');

    expect($b->getBytes())->toBe("Tes\n");
});

test('emptyLine appends LF', function () {
    $b = new EscPosReceiptBuilder;
    $b->emptyLine();

    expect($b->getBytes())->toBe("\n");
});

test('feed emits ESC d n', function () {
    $b = new EscPosReceiptBuilder;
    $b->feed(3);

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x64, 0x03]);
});

test('divider repeats character to width', function () {
    $b = new EscPosReceiptBuilder(32);
    $b->divider('-');

    $line = rtrim($b->getBytes(), "\n");
    expect(mb_strlen($line))->toBe(32);
    expect($line)->toBe(str_repeat('-', 32));
});

test('twoColumn pads to charsPerLine', function () {
    $b = new EscPosReceiptBuilder(32);
    $b->twoColumn('Item', 'Rp 10.000');

    $line = rtrim($b->getBytes(), "\n");
    expect(mb_strlen($line))->toBe(32);
    expect(str_starts_with($line, 'Item'))->toBeTrue();
    expect(str_ends_with($line, 'Rp 10.000'))->toBeTrue();
});

test('twoColumn truncates long left text with ellipsis', function () {
    $b = new EscPosReceiptBuilder(32);
    $longLeft = str_repeat('a', 50);
    $b->twoColumn($longLeft, 'Rp 1');

    $line = rtrim($b->getBytes(), "\n");
    expect(mb_strlen($line))->toBe(32);
    expect(str_ends_with($line, 'Rp 1'))->toBeTrue();
    expect(str_contains($line, '…'))->toBeTrue();
});

test('twoColumn falls back to single line when right text is too long', function () {
    $b = new EscPosReceiptBuilder(32);
    $b->twoColumn('Item', 'Rp '.str_repeat('9', 30));

    $line = rtrim($b->getBytes(), "\n");
    expect($line)->toBe('Item');
});

test('cut full emits GS V 0 with 3-line feed', function () {
    $b = new EscPosReceiptBuilder;
    $b->cut(EscPosReceiptBuilder::CUT_FULL);

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x64, 0x03, 0x1D, 0x56, 0x00]);
});

test('cut partial emits GS V 1', function () {
    $b = new EscPosReceiptBuilder;
    $b->cut(EscPosReceiptBuilder::CUT_PARTIAL);

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x64, 0x03, 0x1D, 0x56, 0x01]);
});

test('openCashDrawer emits ESC p 0 0x19 0xFA', function () {
    $b = new EscPosReceiptBuilder;
    $b->openCashDrawer();

    expect(escBytes($b->getBytes()))->toBe([0x1B, 0x70, 0x00, 0x19, 0xFA]);
});

test('full receipt render produces expected sequence', function () {
    $b = new EscPosReceiptBuilder(32);
    $b->initialize()
        ->setAlign(EscPosReceiptBuilder::ALIGN_CENTER)
        ->setTextSize(EscPosReceiptBuilder::TEXT_DOUBLE_BOTH)
        ->line('LW\'s by Bubur Kang LW')
        ->setTextSize(EscPosReceiptBuilder::TEXT_NORMAL)
        ->line('Jl. Angkatan 45, Palembang')
        ->emptyLine()
        ->setAlign(EscPosReceiptBuilder::ALIGN_LEFT)
        ->divider('-')
        ->twoColumn('2x Nasi Goreng', 'Rp 50.000')
        ->emptyLine()
        ->divider('-')
        ->setBold(true)
        ->twoColumn('TOTAL', 'Rp 50.000')
        ->setBold(false)
        ->emptyLine()
        ->cut();

    $bytes = $b->getBytes();

    expect(str_starts_with($bytes, "\x1B\x40"))->toBeTrue();
    expect(str_ends_with($bytes, "\x1D\x56\x00"))->toBeTrue();
    expect(str_contains($bytes, 'LW\'s by Bubur Kang LW'))->toBeTrue();
    expect(str_contains($bytes, 'TOTAL'))->toBeTrue();
});

test('charsPerLine rejects out-of-range', function (int $invalid) {
    new EscPosReceiptBuilder($invalid);
})->with([
    'too small' => [15],
    'too large' => [65],
])->throws(InvalidArgumentException::class);

test('setAlign rejects invalid value', function () {
    $b = new EscPosReceiptBuilder;
    $b->setAlign(99);
})->throws(InvalidArgumentException::class);

test('feed rejects out-of-range', function (int $invalid) {
    $b = new EscPosReceiptBuilder;
    $b->feed($invalid);
})->with([
    'zero' => [0],
    'too large' => [256],
])->throws(InvalidArgumentException::class);

<?php

use App\Support\Money;

test('ceilTo500 rounds up to the nearest 500', function (float $input, float $expected) {
    expect(Money::ceilTo500($input))->toBe($expected);
})->with([
    'below 100' => [50.0, 500.0],
    'just above 100' => [100.01, 500.0],
    'exact 500' => [500.0, 500.0],
    'multiple of 500' => [25000.0, 25000.0],
    'rounds up at 24_400' => [24400.0, 24500.0],
    'rounds up at 24_600' => [24600.0, 25000.0],
    'rounds up at 24_999' => [24999.0, 25000.0],
]);

test('ceilTo500 returns zero for non-positive inputs', function (float $input) {
    expect(Money::ceilTo500($input))->toBe(0.0);
})->with([
    'zero' => [0.0],
    'negative' => [-100.0],
    'small negative' => [-0.01],
]);

test('roundingAmount returns the difference between ceil and input', function (float $input, float $expected) {
    expect(Money::roundingAmount($input))->toBe($expected);
})->with([
    'multiple of 500 yields 0' => [25000.0, 0.0],
    '24_400 yields 100' => [24400.0, 100.0],
    '24_600 yields 400' => [24600.0, 400.0],
    '24_999 yields 1' => [24999.0, 1.0],
    '500 yields 0' => [500.0, 0.0],
    'zero yields 0' => [0.0, 0.0],
]);

test('ceilTo500 is idempotent for multiples of 500', function (float $input) {
    expect(Money::ceilTo500($input))->toBe($input);
})->with([
    '500' => [500.0],
    '1000' => [1000.0],
    '24500' => [24500.0],
    '50000' => [50000.0],
]);

test('Money::roundingAmount uses ceilTo500 under the hood', function () {
    expect(Money::roundingAmount(24650))->toBe(Money::ceilTo500(24650) - 24650);
});

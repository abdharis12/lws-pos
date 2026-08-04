<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Builder for ESC/POS byte streams for thermal receipt printers.
 *
 * Compatible with printers that accept standard ESC/POS commands
 * (Epson, Star, Xprinter, generic 58mm/80mm clones) over Bluetooth
 * Classic SPP, BLE GATT, USB, or network (port 9100).
 *
 * Output is a self-contained byte sequence suitable for direct write
 * to the printer transport. No external dependencies.
 */
class EscPosReceiptBuilder
{
    public const ESC = "\x1B";

    public const GS = "\x1D";

    public const FS = "\x1C";

    public const LF = "\x0A";

    public const ALIGN_LEFT = 0;

    public const ALIGN_CENTER = 1;

    public const ALIGN_RIGHT = 2;

    public const TEXT_NORMAL = 0;

    public const TEXT_DOUBLE_W = 0x10;

    public const TEXT_DOUBLE_H = 0x20;

    public const TEXT_DOUBLE_BOTH = 0x30;

    public const CUT_FULL = 'full';

    public const CUT_PARTIAL = 'partial';

    private const DEFAULT_CHARS_PER_LINE = 32;

    private string $buffer = '';

    private int $align = self::ALIGN_LEFT;

    private int $textSize = self::TEXT_NORMAL;

    private bool $bold = false;

    private int $charsPerLine;

    public function __construct(int $charsPerLine = self::DEFAULT_CHARS_PER_LINE)
    {
        if ($charsPerLine < 16 || $charsPerLine > 64) {
            throw new InvalidArgumentException('charsPerLine must be between 16 and 64');
        }
        $this->charsPerLine = $charsPerLine;
    }

    public function initialize(): self
    {
        $this->buffer .= self::ESC.'@';

        return $this;
    }

    public function setAlign(int $align): self
    {
        if (! in_array($align, [self::ALIGN_LEFT, self::ALIGN_CENTER, self::ALIGN_RIGHT], true)) {
            throw new InvalidArgumentException('Invalid alignment');
        }
        $this->align = $align;
        $this->buffer .= self::ESC.'a'.chr($align);

        return $this;
    }

    public function setBold(bool $on = true): self
    {
        $this->bold = $on;
        $this->buffer .= self::ESC.'E'.chr($on ? 1 : 0);

        return $this;
    }

    public function setTextSize(int $size): self
    {
        if ($size < 0 || $size > 0x77) {
            throw new InvalidArgumentException('Invalid text size');
        }
        $this->textSize = $size;
        $this->buffer .= self::ESC.'!'.chr($size);

        return $this;
    }

    public function text(string $text): self
    {
        $this->buffer .= $this->sanitize($text);

        return $this;
    }

    public function line(string $text): self
    {
        $this->buffer .= $this->sanitize($text).self::LF;

        return $this;
    }

    public function emptyLine(): self
    {
        $this->buffer .= self::LF;

        return $this;
    }

    public function feed(int $lines = 1): self
    {
        if ($lines < 1 || $lines > 255) {
            throw new InvalidArgumentException('feed lines must be between 1 and 255');
        }
        $this->buffer .= self::ESC.'d'.chr($lines);

        return $this;
    }

    public function divider(string $char = '-'): self
    {
        $width = max(1, (int) ($this->charsPerLine / max(1, mb_strlen($char))));
        $this->buffer .= str_repeat($char, $width).self::LF;

        return $this;
    }

    /**
     * Render a two-column line: left text left-justified, right text right-justified.
     * Pads with spaces in between. If left text is too long it is truncated; right text is
     * never truncated (the assumption is amounts always fit at ~10-12 chars on 32-char paper).
     */
    public function twoColumn(string $left, string $right): self
    {
        $rightWidth = mb_strlen($right);

        // Reserve enough room for the right column plus at least one gap space.
        $leftWidth = $this->charsPerLine - $rightWidth - 1;

        if ($leftWidth < 6) {
            // Right column is too long — fall back to single column with left text only.
            $this->buffer .= $this->sanitize($left).self::LF;

            return $this;
        }

        if (mb_strlen($left) > $leftWidth) {
            $left = mb_substr($left, 0, $leftWidth - 1).'…';
        }

        $gap = $this->charsPerLine - mb_strlen($left) - $rightWidth;

        if ($gap < 1) {
            $gap = 1;
        }

        $this->buffer .= $left.str_repeat(' ', $gap).$right.self::LF;

        return $this;
    }

    public function cut(string $mode = self::CUT_FULL): self
    {
        $this->feed(3);
        $this->buffer .= self::GS.'V'.($mode === self::CUT_PARTIAL ? "\x01" : "\x00");

        return $this;
    }

    /**
     * Open the cash drawer connected to pin 2 (most Epson-compatible printers).
     * Pulse duration 50ms (0x19 * 2ms).
     */
    public function openCashDrawer(): self
    {
        $this->buffer .= self::ESC.'p'."\x00\x19\xFA";

        return $this;
    }

    public function getBytes(): string
    {
        return $this->buffer;
    }

    /**
     * Encode to the active language code page. Most modern thermal printers
     * accept UTF-8 directly when initialized with ESC @ (which we do). We
     * still strip control characters that would corrupt the print stream.
     */
    private function sanitize(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $text) ?? $text;

        return $text;
    }
}

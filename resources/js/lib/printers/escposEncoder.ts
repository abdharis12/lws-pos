import type { ReceiptData } from './types';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const ALIGN_LEFT = 0;
const ALIGN_CENTER = 1;

const TEXT_NORMAL = 0;
const TEXT_DOUBLE_H = 0x20;
const TEXT_DOUBLE_BOTH = 0x30;

const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    debit: 'Kartu Debit',
    credit: 'Kartu Kredit',
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    bca_va: 'BCA VA',
    mandiri_va: 'Mandiri VA',
    bni_va: 'BNI VA',
    bri_va: 'BRI VA',
    permata_va: 'Permata VA',
    echannel: 'Mandiri Bill',
    indomaret: 'Indomaret',
    alfamart: 'Alfamart',
    akulaku: 'Akulaku',
};

const ORDER_TYPE_LABELS: Record<string, string> = {
    dine_in: 'Dine-in',
    dine_in_qr: 'Dine-in',
    cashier: 'Dine-in',
    takeaway: 'Take Away',
};

// eslint-disable-next-line no-control-regex
const SANITIZE_REGEX = /[\x00-\x08\x0b\x0c\x0e-\x1f]/g;

function sanitize(text: string): string {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(SANITIZE_REGEX, '');
}

function utf8Bytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function append(target: number[], ...bytes: number[]): void {
    for (const b of bytes) {
        target.push(b);
    }
}

function pushEscCommand(target: number[], cmd: string, ...args: number[]): void {
    target.push(ESC, cmd.charCodeAt(0), ...args);
}

function pushGsCommand(target: number[], cmd: string, ...args: number[]): void {
    target.push(GS, cmd.charCodeAt(0), ...args);
}

function formatRupiah(amount: number): string {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

function formatDateShort(iso: string): string {
    try {
        const d = new Date(iso);

        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();

        return `${dd}/${mm}/${yyyy}`;
    } catch {
        return '—';
    }
}

function formatTimeShort(iso: string): string {
    try {
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');

        return `${hh}:${min}`;
    } catch {
        return '—';
    }
}

function truncate(text: string, max: number): string {
    if (text.length <= max) {
        return text;
    }

    return text.slice(0, max - 1) + '…';
}

function paymentLabel(method: string | null | undefined): string {
    if (! method) {
        return '—';
    }

    return PAYMENT_LABELS[method] ?? method.toUpperCase();
}

function orderTypeLabel(type: string | null | undefined): string {
    if (! type) {
        return '—';
    }

    return ORDER_TYPE_LABELS[type] ?? type;
}

function twoColumn(
    target: number[],
    left: string,
    right: string,
    charsPerLine: number,
): void {
    const rightWidth = right.length;
    const leftWidth = charsPerLine - rightWidth - 1;

    if (leftWidth < 6) {
        for (const b of utf8Bytes(sanitize(left))) {
            target.push(b);
        }

        target.push(LF);

        return;
    }

    const truncatedLeft = left.length > leftWidth ? truncate(left, leftWidth) : left;
    const gap = charsPerLine - truncatedLeft.length - rightWidth;

    if (gap < 1) {
        for (const b of utf8Bytes(sanitize(truncatedLeft))) {
            target.push(b);
        }

        target.push(LF);

        return;
    }

    for (const b of utf8Bytes(sanitize(truncatedLeft))) {
        target.push(b);
    }

    for (let i = 0; i < gap; i++) {
        target.push(0x20);
    }

    for (const b of utf8Bytes(sanitize(right))) {
        target.push(b);
    }

    target.push(LF);
}

function divider(target: number[], charsPerLine: number, char = '-'): void {
    for (let i = 0; i < charsPerLine; i++) {
        target.push(char.charCodeAt(0));
    }

    target.push(LF);
}

function lineBytes(target: number[], text: string): void {
    for (const b of utf8Bytes(sanitize(text))) {
        target.push(b);
    }

    target.push(LF);
}

function emptyLineBytes(target: number[]): void {
    target.push(LF);
}

// Open cash drawer on pin 2 (most Epson-compatible printers): ESC p 0x00 0x19 0xFA
const DRAWER_OPEN: number[] = [0x1b, 0x70, 0x00, 0x19, 0xfa];

export function encodeReceipt(data: ReceiptData, charsPerLine = 48, openDrawer = false): Uint8Array {
    const out: number[] = [];

    const itemNameMax = charsPerLine - 4;
    const metaMax = charsPerLine - 8;
    const optMax = Math.round(charsPerLine * 0.7);

    if (openDrawer) {
        append(out, ...DRAWER_OPEN);
    }

    // Initialize
    append(out, ESC, 0x40);

    // Header
    pushEscCommand(out, 'a', ALIGN_CENTER);
    pushEscCommand(out, '!', TEXT_DOUBLE_BOTH);
    lineBytes(out, "LW's by Bubur Kang LW");
    pushEscCommand(out, '!', TEXT_NORMAL);
    lineBytes(out, 'Jl. Angkatan 45, Palembang');
    lineBytes(out, 'Telp: 0813-1234-5678');
    emptyLineBytes(out);
    pushEscCommand(out, 'a', ALIGN_LEFT);
    divider(out, charsPerLine);

    // Meta
    twoColumn(out, 'No. Struk', data.orderNumber ?? '—', charsPerLine);
    twoColumn(out, 'Tanggal', formatDateShort(data.createdAt), charsPerLine);
    twoColumn(out, 'Waktu', formatTimeShort(data.createdAt), charsPerLine);
    twoColumn(out, 'Kasir', data.kasir ?? '—', charsPerLine);
    twoColumn(out, 'Tipe', orderTypeLabel(data.orderType), charsPerLine);
    twoColumn(
        out,
        'Meja',
        data.tableCode ? `Meja ${truncate(data.tableCode, metaMax)}` : '—',
        charsPerLine,
    );

    if (data.customerName) {
        twoColumn(out, 'Pelanggan', truncate(data.customerName, metaMax), charsPerLine);
    }

    divider(out, charsPerLine);

    // Items
    for (const item of data.receiptItems) {
        const name = truncate(item.name, itemNameMax);
        const qty = item.qty;
        const basePrice = item.basePrice;

        pushEscCommand(out, 'E', 1);
        lineBytes(out, `${qty}x ${name}`);
        pushEscCommand(out, 'E', 0);

        twoColumn(out, `   @${formatRupiah(basePrice)}`, formatRupiah(item.totalPrice), charsPerLine);

        for (const opt of item.options) {
            const optName = truncate(opt.name, optMax);
            const optQty = opt.quantity ?? 1;
            const optPrice = opt.price ?? 0;

            if (optPrice > 0) {
                const qtyLabel = optQty > 1 ? ` x${optQty}` : '';
                const linePrice = formatRupiah(optPrice * optQty * qty);
                lineBytes(out, `   + ${optName}${qtyLabel} ${linePrice}`);
            } else {
                const qtyLabel = optQty > 1 ? ` x${optQty}` : '';
                lineBytes(out, `   + ${optName}${qtyLabel}`);
            }
        }

        if (item.notes) {
            lineBytes(out, `   Catatan: ${truncate(item.notes, metaMax)}`);
        }
    }

    divider(out, charsPerLine);

    // Totals
    twoColumn(out, 'Subtotal', formatRupiah(data.subtotal), charsPerLine);

    if (data.serviceCharge > 0) {
        twoColumn(out, 'Service Charge (5%)', formatRupiah(data.serviceCharge), charsPerLine);
    }

    twoColumn(out, 'Pajak Resto (10%)', formatRupiah(data.tax), charsPerLine);

    if (data.midtransCharge > 0) {
        twoColumn(out, 'Biaya Transaksi Online', formatRupiah(data.midtransCharge), charsPerLine);
    }

    if (data.discount > 0) {
        let label = 'Diskon';

        if (data.discountLabel) {
            label += ` (${data.discountLabel})`;
        }

        twoColumn(out, label, `-${formatRupiah(data.discount)}`, charsPerLine);
    }

    const rounding = data.roundingAmount ?? 0;

    if (rounding > 0) {
        twoColumn(out, 'Pembulatan', formatRupiah(rounding), charsPerLine);
    }

    pushEscCommand(out, 'E', 1);
    pushEscCommand(out, '!', TEXT_DOUBLE_H);
    twoColumn(out, 'TOTAL', formatRupiah(data.total), charsPerLine);
    pushEscCommand(out, '!', TEXT_NORMAL);
    pushEscCommand(out, 'E', 0);

    if (data.paymentMethod === 'cash' && data.cashAmount) {
        emptyLineBytes(out);
        twoColumn(out, 'Dibayar', formatRupiah(data.cashAmount), charsPerLine);
        twoColumn(out, 'Kembalian', formatRupiah(data.change ?? 0), charsPerLine);
    }

    emptyLineBytes(out);
    divider(out, charsPerLine);

    pushEscCommand(out, 'a', ALIGN_CENTER);
    pushEscCommand(out, 'E', 1);
    lineBytes(out, paymentLabel(data.paymentMethod));
    pushEscCommand(out, 'E', 0);
    divider(out, charsPerLine);
    emptyLineBytes(out);
    lineBytes(out, '~ TERIMA KASIH ATAS KUNJUNGAN ANDA ~');
    lineBytes(out, 'Selamat Menikmati Hidangan dari');
    lineBytes(out, "LW's by Bubur Kang LW");

    // Cut: feed 3 lines, then GS V 0
    pushEscCommand(out, 'd', 3);
    pushGsCommand(out, 'V', 0);

    return new Uint8Array(out);
}
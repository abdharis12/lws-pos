import { formatPrice, formatDate, formatTime, paymentLabel, orderTypeLabel } from './format';
import { roundPrice } from './pricing';

export interface ReceiptData {
    orderNumber: string;
    createdAt: string;
    kasir: string;
    orderType: string;
    tableCode: string | null;
    customerName: string | null;
    receiptItems: {
        name: string;
        qty: number;
        basePrice: number;
        totalPrice: number;
        options: { name: string; price: number }[];
        notes: string | null;
    }[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    midtransCharge: number;
    discount: number;
    discountLabel: string | null;
    total: number;
    paymentMethod: string | null;
    cashAmount?: number;
    change?: number;
}

export function printReceipt(iframe: HTMLIFrameElement | null, data: ReceiptData): void {
    if (!iframe?.contentWindow) return;

    const paymentLabelText = paymentLabel(data.paymentMethod);
    const tableInfo = data.tableCode ? `Meja ${data.tableCode}` : '—';
    const dateStr = formatDate(data.createdAt);
    const timeStr = formatTime(data.createdAt);
    const logoUrl = `${window.location.origin}/img/lws-logo.png`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Struk Pembayaran</title>
<style>
    @page { margin: 0; size: 80mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 11px; width: 72mm; padding: 8px 4mm; color: #000; line-height: 1.35; }
    .center { text-align: center; }
    .header { margin-bottom: 6px; }
    .header img { width: 60px; height: auto; margin-bottom: 4px; }
    .header h2 { font-size: 14px; margin-bottom: 1px; letter-spacing: 0.5px; text-transform: uppercase; }
    .header p { font-size: 9px; color: #555; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 9px; padding: 1px 0; }
    .info-label { color: #555; }
    .item-row { padding: 3px 0; }
    .item-name { font-weight: bold; font-size: 10px; }
    .item-detail { display: flex; justify-content: space-between; font-size: 9px; padding-left: 4px; }
    .item-option { font-size: 8px; color: #555; padding-left: 10px; display: flex; justify-content: space-between; }
    .item-note { font-size: 8px; color: #888; font-style: italic; padding-left: 10px; }
    .totals { margin-top: 3px; }
    .totals .row { display: flex; justify-content: space-between; padding: 1.5px 0; font-size: 10px; }
    .totals .final { font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }
    .payment { text-align: center; margin: 5px 0; font-weight: bold; font-size: 10px; }
    .footer { text-align: center; margin-top: 6px; font-size: 9px; color: #555; }
</style>
</head>
<body>
    <div class="header center">
        <img src="${logoUrl}" alt="LWS Logo" />
        <h2>LW's by Bubur Kang LW</h2>
        <p>Jl. Angkatan 45, Palembang</p>
        <p>Telp: 0813-1234-5678</p>
    </div>
    <div class="divider"></div>
    <div class="info-row">
        <span class="info-label">No. Struk</span>
        <span>${data.orderNumber}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Tanggal</span>
        <span>${dateStr}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Waktu</span>
        <span>${timeStr}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Kasir</span>
        <span>${data.kasir || '—'}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Meja</span>
        <span>${tableInfo}</span>
    </div>
    ${data.customerName ? `
    <div class="info-row">
        <span class="info-label">Pelanggan</span>
        <span>${data.customerName}</span>
    </div>` : ''}
    <div class="divider"></div>
    ${data.receiptItems.map(item => `
    <div class="item-row">
        <div class="item-name">${item.name}</div>
        <div class="item-detail">
            <span>${item.qty} x ${formatPrice(item.basePrice)}</span>
            <span>${formatPrice(item.totalPrice)}</span>
        </div>
        ${item.options.length > 0 ? item.options.map(o => `
        <div class="item-option">
            <span>* ${o.name}</span>
            <span>${o.price > 0 ? '+' + formatPrice(o.price * item.qty) : ''}</span>
        </div>`).join('') : ''}
        ${item.notes ? `<div class="item-note">${item.notes}</div>` : ''}
    </div>`).join('')}
    <div class="divider"></div>
    <div class="totals">
        <div class="row">
            <span>Subtotal</span>
            <span>${formatPrice(data.subtotal)}</span>
        </div>
        <div class="row">
            <span>Service Charge (5%)</span>
            <span>${formatPrice(data.serviceCharge)}</span>
        </div>
        <div class="row">
            <span>Pajak Resto (10%)</span>
            <span>${formatPrice(data.tax)}</span>
        </div>
        ${data.midtransCharge > 0 ? `
        <div class="row">
            <span>Biaya Transaksi Online</span>
            <span>${formatPrice(data.midtransCharge)}</span>
        </div>` : ''}
        ${data.discount > 0 ? `
        <div class="row">
            <span>Diskon${data.discountLabel ? ` (${data.discountLabel})` : ''}</span>
            <span>-${formatPrice(data.discount)}</span>
        </div>` : ''}
        <div class="row final">
            <span>TOTAL</span>
            <span>${formatPrice(data.total)}</span>
        </div>
    </div>
    ${data.paymentMethod === 'cash' && data.cashAmount ? `
    <div class="divider"></div>
    <div class="row">
        <span>Dibayar</span>
        <span>${formatPrice(data.cashAmount)}</span>
    </div>
    <div class="row">
        <span>Kembalian</span>
        <span>${formatPrice(data.change ?? 0)}</span>
    </div>` : ''}
    <div class="divider"></div>
    <div class="payment">
        <span>${paymentLabelText}</span>
    </div>
    <div class="divider"></div>
    <div class="footer">
        <p>~ TERIMA KASIH ATAS KUNJUNGAN ANDA ~</p>
        <p style="margin-top:3px;font-size:8px;">Selamat Menikmati Hidangan dari LW's by Bubur Kang LW</p>
    </div>
</body>
</html>`;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }, 300);
    };
}

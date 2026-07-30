export interface LabelItem {
    name: string;
    qty: number;
    notes: string | null;
    options: { name: string; quantity: number }[];
}

export interface LabelData {
    station: string;
    tableCode: string | null;
    orderId: number;
    items: LabelItem[];
    customerName: string | null;
    orderType: string;
    createdAt: string;
}

export function printLabel(iframe: HTMLIFrameElement | null, data: LabelData): void {
    if (!iframe?.contentWindow) return;

    const timeStr = new Date(data.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit',
    });
    const dateStr = new Date(data.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short',
    });
    const tableInfo = data.tableCode ? `Meja ${data.tableCode}` : 'Bungkus';
    const orderTypeLabel = data.orderType === 'takeaway' ? 'BUNGKUS' : `MEJA ${data.tableCode ?? '—'}`;

    const groupedByStation: Record<string, LabelItem[]> = {};
    for (const item of data.items) {
        const key = data.station || 'Lainnya';
        if (!groupedByStation[key]) groupedByStation[key] = [];
        groupedByStation[key].push(item);
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Label Dapur</title>
<style>
    @page { margin: 0; size: 58mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Courier New', monospace;
        font-size: 9px;
        width: 54mm;
        padding: 4px 2mm;
        color: #000;
        line-height: 1.3;
    }
    .station-header {
        text-align: center;
        margin-bottom: 3px;
        padding: 3px 0;
        border-bottom: 2px solid #000;
    }
    .station-header h2 {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .order-info {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        padding: 2px 0;
        border-bottom: 1px dashed #888;
    }
    .table-number {
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        padding: 3px 0;
        border-bottom: 1px dashed #888;
    }
    .item {
        padding: 2px 0;
        border-bottom: 1px dotted #ccc;
    }
    .item:last-child { border-bottom: none; }
    .item-name {
        font-size: 10px;
        font-weight: bold;
    }
    .item-qty {
        font-size: 12px;
        font-weight: bold;
        float: right;
        padding: 0 3px;
    }
    .item-option {
        font-size: 8px;
        color: #555;
        padding-left: 6px;
    }
    .item-note {
        font-size: 7px;
        color: #888;
        font-style: italic;
        padding-left: 6px;
    }
    .footer {
        text-align: center;
        margin-top: 3px;
        padding-top: 3px;
        border-top: 1px dashed #888;
        font-size: 7px;
        color: #555;
    }
    .customer-name {
        font-size: 8px;
        text-align: center;
        padding: 2px 0;
        border-bottom: 1px dashed #888;
    }
    ${Object.keys(groupedByStation).length > 1 ? `
    .station-badge {
        display: inline-block;
        background: #000;
        color: #fff;
        padding: 0 4px;
        font-size: 7px;
        font-weight: bold;
        margin-bottom: 2px;
    }` : ''}
    .divider-dash { border-top: 1px dashed #000; margin: 3px 0; }
</style>
</head>
<body>
    <div class="station-header">
        <h2>${data.station || 'DAPUR'}</h2>
    </div>

    <div class="table-number">${orderTypeLabel}</div>

    ${data.customerName ? `<div class="customer-name">${data.customerName}</div>` : ''}

    <div class="order-info">
        <span>#${data.orderId}</span>
        <span>${dateStr} ${timeStr}</span>
    </div>

    <div class="divider-dash"></div>

    ${data.items.map(item => `
    <div class="item">
        <div>
            <span class="item-name">${item.name}</span>
            <span class="item-qty">x${item.qty}</span>
        </div>
        ${item.options.length > 0 ? item.options.map(o => `
        <div class="item-option">${o.name}${o.quantity > 1 ? ` x${o.quantity}` : ''}</div>
        `).join('') : ''}
        ${item.notes ? `<div class="item-note">Catatan: ${item.notes}</div>` : ''}
    </div>
    `).join('')}

    <div class="footer">
        ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        &middot; LW's by Bubur Kang LW
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

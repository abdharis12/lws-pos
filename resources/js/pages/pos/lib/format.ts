export function formatPrice(amount: number): string {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const safeRounded = Math.round(safeAmount);

    return `Rp ${safeRounded.toLocaleString('id-ID')}`;
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit',
    });
}

export function paymentLabel(method: string | null): string {
    const labels: Record<string, string> = {
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

    return method ? (labels[method] ?? '—') : '—';
}

export function orderTypeLabel(type: string | null | undefined): string {
    if (type === 'cashier' || type === 'dine_in_qr' || type === 'dine_in') {
return 'Dine-in';
}

    if (type === 'takeaway') {
return 'Take Away';
}

    return type ?? '—';
}

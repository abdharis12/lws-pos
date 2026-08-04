export interface ReceiptItem {
    name: string;
    qty: number;
    basePrice: number;
    totalPrice: number;
    options: { name: string; price: number; quantity: number }[];
    notes: string | null;
}

export interface ReceiptData {
    orderNumber: string;
    createdAt: string;
    kasir: string;
    orderType: string;
    tableCode: string | null;
    customerName: string | null;
    receiptItems: ReceiptItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    midtransCharge: number;
    discount: number;
    roundingAmount?: number;
    discountLabel: string | null;
    total: number;
    paymentMethod: string | null;
    cashAmount?: number | null;
    change?: number | null;
}

export type PrintChannel = 'ble' | 'usb' | 'os-dialog';

export interface PrintResult {
    channel: PrintChannel;
    success: boolean;
    error?: string;
}

export interface PairedDeviceInfo {
    kind: 'bluetooth' | 'usb';
    id: string;
    name: string;
    pairedAt: number;
}
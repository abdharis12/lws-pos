import { Head, router, useForm } from '@inertiajs/react';
import { Download, Plus, Printer, RefreshCw, Trash2, Search, Table2, Sparkles, Pencil } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const APP_NAME = "LW's by Bubur Kang LW";

interface TableData {
    id: number;
    code: string;
    table_token: string;
    capacity: number;
    floor: string | null;
    status: 'available' | 'occupied' | 'reserved';
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    data: TableData[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    tables: PaginationMeta;
    floors: string[];
    filters: { floor?: string };
}

function TableCard({
    table,
    onEdit,
    onDelete,
    onRegenerateToken,
}: {
    table: TableData;
    onEdit: (t: TableData) => void;
    onDelete: (id: number) => void;
    onRegenerateToken: (id: number) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(
                canvasRef.current,
                `${window.location.origin}/t/${table.table_token}`,
                { width: 140, margin: 1, color: { dark: '#233433', light: '#FFFFFF' } },
            ).catch(console.error);
        }
    }, [table.table_token]);

    function drawPattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const spacing = 32;
        const dotR = 1.5;
        ctx.fillStyle = 'rgba(79,107,106,0.06)';
        for (let x = spacing; x < w; x += spacing) {
            for (let y = spacing; y < h; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, dotR, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    async function renderCard() {
        const qrCanvas = canvasRef.current;
        if (!qrCanvas) return null;

        const size = 600;
        const qrSize = 200;
        const card = document.createElement('canvas');
        card.width = size;
        card.height = size;
        const ctx = card.getContext('2d');
        if (!ctx) return null;

        const bg = '#F6F2E9';
        const primary = '#4F6B6A';
        const ink = '#25332F';
        const muted = '#5c6a66';
        const border = 'rgba(37,51,47,0.08)';
        const white = '#FFFFFF';

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);

        drawPattern(ctx, size, size);

        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        roundRect(ctx, 16, 16, size - 32, size - 32, 24);
        ctx.stroke();

        const logo = await new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
            img.src = '/img/lws-logo.png';
        });

        const logoSize = 56;
        const logoX = (size - logoSize) / 2;
        let logoY = 56;
        if (logo.complete && logo.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            roundRect(ctx, logoX - 8, logoY - 8, logoSize + 16, logoSize + 16, 14);
            ctx.clip();
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();
        } else {
            ctx.fillStyle = primary;
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LW', size / 2, logoY + logoSize / 2);
        }

        const topY = logoY + logoSize + 20;

        ctx.fillStyle = primary;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(APP_NAME, size / 2, topY);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = muted;
        ctx.fillText('Self-Order Table', size / 2, topY + 22);

        ctx.fillStyle = ink;
        ctx.font = 'bold 32px serif';
        ctx.fillText(`Meja ${table.code}`, size / 2, topY + 70);

        const qrX = (size - qrSize) / 2;
        const qrY = topY + 108 + 5;

        ctx.shadowColor = 'rgba(37,51,47,0.08)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = white;
        ctx.beginPath();
        roundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 18);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = muted;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Scan QR code untuk memesan', size / 2, qrY + qrSize + 44);

        ctx.fillStyle = border;
        ctx.font = '10px sans-serif';
        ctx.fillText(`${window.location.origin}/t/${table.table_token}`, size / 2, size - 52);

        return card;
    }

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    async function downloadQR() {
        try {
            const card = await renderCard();
            if (!card) return;

            const link = document.createElement('a');
            link.download = `meja-${table.code}-qr.png`;
            link.href = card.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('Download QR failed:', e);
        }
    }

    async function printQR() {
        try {
            const card = await renderCard();
            if (!card) return;

            const win = window.open('', '_blank');
            if (!win) return;

            win.document.write(`
                <html>
                <head><title>QR Meja ${table.code}</title>
                <style>
                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    img { max-width: 95vw; max-height: 95vh; }
                    @media print { @page { margin: 0; } body { min-height: 100vh; } }
                </style>
                </head>
                <body>
                    <img src="${card.toDataURL('image/png')}" alt="QR Meja ${table.code}" onload="setTimeout(function(){window.print();window.close()},500)" />
                    <noscript><p>Your browser does not support JavaScript. Please use the download option instead.</p></noscript>
                </body>
                </html>
            `);
            win.document.close();
        } catch (e) {
            console.error('Print QR failed:', e);
        }
    }

    const statusConfig: Record<string, { label: string; className: string }> = {
        available: { label: 'Tersedia', className: 'border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)] text-xs font-normal tracking-wide text-white' },
        occupied: { label: 'Terisi', className: 'border border-slate-200 bg-slate-100 text-xs font-normal text-slate-500' },
        reserved: { label: 'Reserved', className: 'border border-amber-200 bg-amber-50 text-xs font-normal text-amber-700' },
    };

    const status = statusConfig[table.status] ?? statusConfig.available;

    return (
        <Card className="group overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.80_0.038_88.5)] hover:shadow-md">
            {/* QR Code Container */}
            <div className="relative flex items-center justify-center border-b border-[oklch(0.80_0.038_88.5)]/20 bg-gradient-to-br from-[oklch(0.48_0.032_195.5)]/5 to-[oklch(0.80_0.038_88.5)]/10 p-4">
                <canvas ref={canvasRef} className="size-[140px]" />

                {/* Floating Badge */}
                <div className="absolute right-3 top-3">
                    <Badge className={status.className}>
                        {status.label}
                    </Badge>
                </div>
            </div>

            {/* Card Header */}
            <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <Badge className="border border-primary bg-secondary/30 text-xs font-normal text-primary rounded-full">
                            {table.floor ?? 'Tanpa Lantai'}
                        </Badge>
                        <h3 className="font-serif mt-1 text-xl font-medium tracking-tight text-[oklch(0.48_0.032_195.5)] group-hover:text-[oklch(0.38_0.032_195.5)]">
                            {table.code}
                        </h3>
                        <p className="mt-1 text-xs italic text-slate-500">
                            {table.capacity} orang
                        </p>
                    </div>
                </div>
            </CardHeader>

            {/* Card Content & Actions */}
            <CardContent className="pt-2">
                <div className="flex items-center justify-between border-t border-[oklch(0.80_0.038_88.5)]/20 pt-3">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={downloadQR}
                            className="size-8"
                            title="Download QR"
                        >
                            <Download className="size-4" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={printQR}
                            className="size-8"
                            title="Print QR"
                        >
                            <Printer className="size-4" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => onRegenerateToken(table.id)}
                            className="size-8"
                            title="Regenerate Token"
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(table)}
                            className="size-8 bg-primary text-secondary hover:bg-primary/70 hover:text-secondary transition-colors"
                            title="Edit Meja"
                        >
                            <Pencil className="size-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(table.id)}
                            className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                            title="Hapus Meja"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TablesIndex({ tables, floors, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<TableData | null>(null);
    const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<TableData | null>(null);
    const [filterFloor, setFilterFloor] = useState(filters.floor ?? '');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        code: '',
        capacity: '4',
        floor: '',
        status: 'available',
    });

    useEffect(() => {
        router.get(
            '/admin/tables',
            { floor: filterFloor || undefined },
            { preserveScroll: true, preserveState: true },
        );
    }, [filterFloor]);

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(table: TableData) {
        setEditing(table);
        setData('code', table.code);
        setData('capacity', String(table.capacity));
        setData('floor', table.floor ?? '');
        setData('status', table.status);
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/tables/${editing.id}`, {
                preserveState: false,
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/tables', {
                preserveState: false,
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        }
    }

    function handleDelete(id: number) {
        const table = tables.data.find((t) => t.id === id) ?? null;
        setDeleteConfirm(table);
    }

    function confirmDelete() {
        if (!deleteConfirm) return;
        destroy(`/admin/tables/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    const [tokenToRegenerate, setTokenToRegenerate] = useState<number | null>(null);

    function regenerateToken(tableId: number) {
        setTokenToRegenerate(tableId);
    }

    function confirmRegenerateToken() {
        if (tokenToRegenerate === null) return;
        router.post(`/admin/tables/${tokenToRegenerate}/regenerate-token`);
        setTokenToRegenerate(null);
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Meja - European Classic" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <Table2 className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Pengaturan Tempat Duduk</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Daftar Meja
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Kelola meja dan QR code pemesanan restoran Anda.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="size-4 text-[oklch(0.80_0.038_88.5)]" />
                            <span className="font-medium tracking-wide">Tambah Meja</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-xl text-[oklch(0.48_0.032_195.5)]">
                                {editing ? 'Edit Meja' : 'Tambah Meja'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Kode Meja</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="Contoh: A1, B2"
                                    className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                />
                                <InputError message={errors.code} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Kapasitas</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                />
                                <InputError message={errors.capacity} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="floor">Lantai / Area</Label>
                                <Select
                                    value={data.floor || '__none__'}
                                    onValueChange={(v) => setData('floor', v === '__none__' ? '' : v)}
                                >
                                    <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                        <SelectValue placeholder="Pilih lantai" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                        <SelectItem value="__none__">Tidak ada</SelectItem>
                                        {floors.map((f) => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.floor} />
                            </div>
                            {editing && (
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(v) => setData('status', v as any)}
                                    >
                                        <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                            <SelectItem value="available">Tersedia</SelectItem>
                                            <SelectItem value="occupied">Terisi</SelectItem>
                                            <SelectItem value="reserved">Reserved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            )}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.42_0.032_195.5)]"
                            >
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Floor Filter Tabs */}
            <div className="mb-8 inline-flex flex-wrap gap-1.5 rounded-xl border border-[oklch(0.80_0.038_88.5)]/30 bg-white/50 p-1.5">
                <button
                    onClick={() => setFilterFloor('')}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                        !filterFloor
                            ? 'bg-[oklch(0.48_0.032_195.5)] text-white shadow-sm'
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                    }`}
                >
                    Semua
                </button>
                {floors.map((f, i) => {
                    const icons = ['①', '②', '③', '④', '🌿'];

                    return (
                        <button
                            key={f}
                            onClick={() => setFilterFloor(f)}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                                filterFloor === f
                                    ? 'bg-[oklch(0.48_0.032_195.5)] text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                            }`}
                        >
                            <span className="mr-1 opacity-60">{icons[i] ?? ''}</span>
                            {f}
                        </button>
                    );
                })}
            </div>

            {/* Grid Table Cards */}
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                {tables.data.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onRegenerateToken={regenerateToken}
                    />
                ))}

                {/* Empty State */}
                {tables.data.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                            <div className="mb-3 rounded-full bg-[oklch(0.80_0.038_88.5)]/20 p-4 text-[oklch(0.48_0.032_195.5)]">
                                <Sparkles className="size-6" />
                            </div>
                            <h4 className="font-serif text-lg font-medium text-slate-700">Meja Tidak Ditemukan</h4>
                            <p className="mt-1 text-xs italic text-slate-500">
                                Cobalah untuk mengganti filter lantai atau tambahkan meja baru.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-8">
                <hr className="border border-[oklch(0.80_0.038_88.5)]/40" />
                <Pagination meta={tables} />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                            <Trash2 className="size-6 text-rose-600" />
                        </div>
                        <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                            Hapus Meja
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            Apakah Anda yakin ingin menghapus meja <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{deleteConfirm?.code}</span>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirm(null)}
                            className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={processing}
                            className="bg-rose-700 text-white hover:bg-rose-800"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Token Regeneration Confirmation Dialog */}
            <Dialog open={tokenToRegenerate !== null} onOpenChange={(open) => !open && setTokenToRegenerate(null)}>
                <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
                            <RefreshCw className="size-6 text-amber-600" />
                        </div>
                        <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                            Regenerasi Token QR
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            Apakah Anda yakin ingin menghapus token QR? Tautan QR sebelumnya tidak akan berfungsi lagi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setTokenToRegenerate(null)}
                            className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmRegenerateToken}
                            className="bg-amber-600 text-white hover:bg-amber-700"
                        >
                            Regenerasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

TablesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Meja', href: '/admin/tables' },
    ],
};

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
            );
        }
    }, [table.table_token]);

    function downloadQR() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `meja-${table.code}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function printQR() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const win = window.open('', '_blank');
        if (!win) return;

        win.document.write(`
            <html>
            <head><title>QR Meja ${table.code}</title>
            <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
                img { max-width: 90vw; }
                p { margin-top: 16px; font-size: 14px; color: #666; }
                @media print { @page { margin: 0; } body { min-height: 100vh; } }
            </style>
            </head>
            <body>
                <img src="${canvas.toDataURL('image/png')}" alt="QR Meja ${table.code}" />
                <p>${window.location.origin}/t/${table.table_token}</p>
                <script>window.print();window.close();</script>
            </body>
            </html>
        `);
        win.document.close();
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
    const [filterFloor, setFilterFloor] = useState<string>(filters.floor ?? '');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        code: '',
        capacity: '2',
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
        setData({
            code: table.code,
            capacity: String(table.capacity),
            floor: table.floor ?? '__none__',
            status: table.status,
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/tables/${editing.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/tables', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus meja ini?')) {
            destroy(`/admin/tables/${id}`);
        }
    }

    function regenerateToken(tableId: number) {
        if (confirm('Regenerasi token QR? Tautan QR sebelumnya tidak akan berfungsi lagi.')) {
            router.post(`/admin/tables/${tableId}/regenerate-token`);
        }
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
                                    value={data.floor}
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
        </div>
    );
}

TablesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Meja', href: '/admin/tables' },
    ],
};

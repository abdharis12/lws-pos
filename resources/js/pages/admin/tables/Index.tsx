import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Download, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    status: 'available' | 'occupied' | 'reserved';
}

interface Props {
    tables: TableData[];
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

    const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
        available: 'default',
        occupied: 'secondary',
        reserved: 'outline',
    };

    const statusLabels: Record<string, string> = {
        available: 'Tersedia',
        occupied: 'Terisi',
        reserved: 'Reserved',
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{table.code}</CardTitle>
                        <span className="text-xs text-muted-foreground">
                            {table.capacity} orang
                        </span>
                    </div>
                    <Badge variant={statusColors[table.status]}>
                        {statusLabels[table.status]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-3 flex items-center justify-center rounded-lg border bg-muted/30 p-3">
                    <canvas ref={canvasRef} className="size-[140px]" />
                </div>
                <div className="flex items-center justify-between gap-1">
                    <Button variant="ghost" size="sm" onClick={downloadQR}>
                        <Download className="mr-1 size-3" />
                        QR
                    </Button>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onRegenerateToken(table.id)}>
                            <RefreshCw className="mr-1 size-3" />
                            Token
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(table)}>
                            <Plus className="size-4 rotate-45" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(table.id)}>
                            <Trash2 className="size-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TablesIndex({ tables }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<TableData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        code: '',
        capacity: '2',
        status: 'available',
    });

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(table: TableData) {
        setEditing(table);
        setData({ code: table.code, capacity: String(table.capacity), status: table.status });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/tables/${editing.id}`, {
                onSuccess: () => {
 setOpen(false); reset(); 
},
            });
        } else {
            post('/admin/tables', {
                onSuccess: () => {
 setOpen(false); reset(); 
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

    const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
        available: 'default',
        occupied: 'secondary',
        reserved: 'outline',
    };

    const statusLabels: Record<string, string> = {
        available: 'Tersedia',
        occupied: 'Terisi',
        reserved: 'Reserved',
    };

    return (
        <>
            <Head title="Meja" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Meja</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Kelola meja restoran</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Tambah Meja
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Meja' : 'Tambah Meja'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Kode Meja</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="Contoh: A1, B2"
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
                                />
                                <InputError message={errors.capacity} />
                            </div>
                            {editing && (
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(v) => setData('status', v as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Tersedia</SelectItem>
                                            <SelectItem value="occupied">Terisi</SelectItem>
                                            <SelectItem value="reserved">Reserved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            )}
                            <Button type="submit" disabled={processing} className="w-full">
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onRegenerateToken={regenerateToken}
                    />
                ))}
                {tables.length === 0 && (
                    <p className="col-span-full py-8 text-center text-muted-foreground">
                        Belum ada meja.
                    </p>
                )}
            </div>
        </>
    );
}

TablesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Meja', href: '/admin/tables' },
    ],
};

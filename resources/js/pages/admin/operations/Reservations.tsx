import { Head, router, useForm } from '@inertiajs/react';
import { CalendarCheck, CheckCircle2, Clock, Plus, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

interface TableOption {
    id: number;
    code: string;
    capacity: number;
}

interface Employee {
    id: number;
    user?: { name: string };
}

interface Reservation {
    id: number;
    customer_name: string;
    customer_phone: string | null;
    reservation_time: string;
    party_size: number;
    status: string;
    source: string;
    deposit_amount: number | null;
    notes: string | null;
    table?: TableOption;
    created_at: string;
}

interface Props {
    reservations: {
        data: Reservation[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    tables: TableOption[];
    employees: Employee[];
    filters: { date?: string; status?: string; source?: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    confirmed: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    seated: { label: 'Duduk', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    completed: { label: 'Selesai', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
    no_show: { label: 'No Show', className: 'bg-orange-100 text-orange-700 border-orange-200' },
};

const sourceConfig: Record<string, { label: string; className: string }> = {
    phone: { label: 'Telepon', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    walk_in: { label: 'Walk-in', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    online: { label: 'Online', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    app: { label: 'Aplikasi', className: 'bg-[#4F6B6A]/10 text-[#4F6B6A] border-[#4F6B6A]/30' },
};

export default function Reservations({ reservations, tables, filters }: Props) {
    const [dateFilter, setDateFilter] = useState(filters.date ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [sourceFilter, setSourceFilter] = useState(filters.source ?? 'all');
    const [createOpen, setCreateOpen] = useState(false);
    const form = useForm({
        customer_name: '',
        customer_phone: '',
        reservation_time: '',
        party_size: '',
        table_id: '',
        source: 'phone',
        deposit_amount: '',
        notes: '',
    });

    const summary = {
        confirmed: reservations.data.filter((r) => r.status === 'confirmed').length,
        seated: reservations.data.filter((r) => r.status === 'seated').length,
        pending: reservations.data.filter((r) => r.status === 'pending').length,
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/admin/operations/reservations',
                {
                    date: dateFilter || undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    source: sourceFilter !== 'all' ? sourceFilter : undefined,
                },
                { preserveScroll: true, preserveState: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [dateFilter, statusFilter, sourceFilter]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/operations/reservations', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                form.reset();
            },
        });
    }

    function confirmReservation(id: number) {
        router.post(`/admin/operations/reservations/${id}/confirm`, {}, { preserveScroll: true });
    }

    function seatReservation(id: number) {
        router.post(`/admin/operations/reservations/${id}/seat`, {}, { preserveScroll: true });
    }

    function cancelReservation(id: number) {
        router.post(`/admin/operations/reservations/${id}/cancel`, {}, { preserveScroll: true });
    }

    function markNoShow(id: number) {
        router.post(`/admin/operations/reservations/${id}/no-show`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Reservations - Operations" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <CalendarCheck className="size-3.5 text-[#4F6B6A]" />
                            <span>Operations</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Reservations
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola reservasi dan pemesanan meja pelanggan.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Reservasi Baru</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Clock className="size-3" /> Pending
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">{summary.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-blue-600 uppercase">
                                <CheckCircle2 className="size-3" /> Dikonfirmasi Hari Ini
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-blue-700">{summary.confirmed}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <Users className="size-3" /> Sedang Duduk
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{summary.seated}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        type="date"
                        className="w-40 border-[#CFC0A4]/50 bg-white"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                            <SelectItem value="seated">Duduk</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Batal</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua sumber" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Sumber</SelectItem>
                            <SelectItem value="phone">Telepon</SelectItem>
                            <SelectItem value="walk_in">Walk-in</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="app">Aplikasi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Pelanggan</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Waktu</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Partai</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Meja</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Sumber</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Deposit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.data.map((r) => {
                                    const sCfg = statusConfig[r.status] ?? statusConfig.pending;
                                    const srcCfg = sourceConfig[r.source] ?? sourceConfig.phone;

                                    return (
                                        <tr key={r.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800">{r.customer_name}</div>
                                                {r.customer_phone && <div className="text-xs text-slate-400">{r.customer_phone}</div>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                                                {new Date(r.reservation_time).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-600">{r.party_size} orang</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{r.table?.code ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={srcCfg.className}>{srcCfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                {r.deposit_amount != null && r.deposit_amount > 0
                                                    ? `Rp ${Number(r.deposit_amount).toLocaleString('id-ID')}`
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {r.status === 'pending' && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="mr-1 h-8 border-blue-300 text-xs text-blue-700 hover:bg-blue-50" onClick={() => confirmReservation(r.id)}>
                                                            <CheckCircle2 className="mr-1 size-3" /> Konfirmasi
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800" onClick={() => cancelReservation(r.id)}>
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {r.status === 'confirmed' && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="mr-1 h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => seatReservation(r.id)}>
                                                            <Users className="mr-1 size-3" /> Duduk
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="mr-1 h-8 text-xs text-orange-600 hover:bg-orange-50" onClick={() => markNoShow(r.id)}>
                                                            No Show
                                                        </Button>
                                                    </>
                                                )}
                                                {r.status === 'seated' && (
                                                    <CheckCircle2 className="ml-auto inline size-5 text-emerald-500" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {reservations.data.length === 0 && (
                        <div className="py-16 text-center">
                            <CalendarCheck className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Reservasi</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat reservasi baru dari pelanggan.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={reservations} />
                </div>
            </div>

            {/* Create Reservation Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">Reservasi Baru</DialogTitle>
                        <DialogDescription>Isi data pelanggan dan detail reservasi.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cust_name">Nama Pelanggan *</Label>
                                <Input id="cust_name" className="border-[#CFC0A4]/50 bg-white" value={form.data.customer_name} onChange={(e) => form.setData('customer_name', e.target.value)} required />
                                {form.errors.customer_name && <p className="text-xs text-rose-600">{form.errors.customer_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cust_phone">Telepon</Label>
                                <Input id="cust_phone" className="border-[#CFC0A4]/50 bg-white" value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rsv_time">Waktu *</Label>
                                <Input id="rsv_time" type="datetime-local" className="border-[#CFC0A4]/50 bg-white" value={form.data.reservation_time} onChange={(e) => form.setData('reservation_time', e.target.value)} required />
                                {form.errors.reservation_time && <p className="text-xs text-rose-600">{form.errors.reservation_time}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="party_size">Jumlah Orang *</Label>
                                <Input id="party_size" type="number" min="1" className="border-[#CFC0A4]/50 bg-white" value={form.data.party_size} onChange={(e) => form.setData('party_size', e.target.value)} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Meja</Label>
                                <Select value={form.data.table_id} onValueChange={(v) => form.setData('table_id', v)}>
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue placeholder="Pilih meja" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        {tables.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.code} (kap. {t.capacity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sumber</Label>
                                <Select value={form.data.source} onValueChange={(v) => form.setData('source', v)}>
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        <SelectItem value="phone">Telepon</SelectItem>
                                        <SelectItem value="walk_in">Walk-in</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="app">Aplikasi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deposit">Deposit (Rp)</Label>
                            <Input id="deposit" type="number" min="0" className="border-[#CFC0A4]/50 bg-white" value={form.data.deposit_amount} onChange={(e) => form.setData('deposit_amount', e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rsv_notes">Catatan</Label>
                            <Input id="rsv_notes" className="border-[#CFC0A4]/50 bg-white" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} placeholder="Catatan reservasi..." />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

Reservations.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Operations', href: '/admin/operations/reservations' },
        { title: 'Reservations', href: '/admin/operations/reservations' },
    ],
};

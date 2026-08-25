import { Head, router, useForm } from '@inertiajs/react';
import { ChefHat, Clock, CheckCircle2, Plus, Play, XCircle } from 'lucide-react';
import { useState } from 'react';
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

interface Menu {
    id: number;
    name: string;
}

interface Outlet {
    id: number;
    name: string;
}

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
}

interface ProductionOrder {
    id: number;
    batch_number: string;
    status: string;
    qty_planned: number;
    qty_produced: number | null;
    planned_date: string;
    produced_date: string | null;
    menu?: Menu;
    target_outlet?: Outlet;
}

interface Props {
    orders: {
        data: ProductionOrder[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    menus: Menu[];
    outlets: Outlet[];
    ingredients: IngredientOption[];
    filters: { status?: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    planned: { label: 'Direncanakan', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    in_progress: { label: 'Diproses', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function ProductionOrders({ orders, menus, outlets, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [createOpen, setCreateOpen] = useState(false);
    const form = useForm({
        menu_id: '',
        qty_planned: '',
        target_outlet_id: '',
        notes: '',
    });

    const summary = {
        total: orders.total,
        planned: orders.data.filter((o) => o.status === 'planned').length,
        in_progress: orders.data.filter((o) => o.status === 'in_progress').length,
        completed: orders.data.filter((o) => o.status === 'completed').length,
    };

    function handleFilter(value: string) {
        setStatusFilter(value);
        router.get(
            '/admin/kitchen/production-orders',
            { status: value !== 'all' ? value : undefined },
            { preserveScroll: true, preserveState: true },
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/kitchen/production-orders', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                form.reset();
            },
        });
    }

    function startProduction(id: number) {
        router.post(`/admin/kitchen/production-orders/${id}/start`, {}, { preserveScroll: true });
    }

    function completeProduction(id: number) {
        router.post(`/admin/kitchen/production-orders/${id}/complete`, {}, { preserveScroll: true });
    }

    function cancelProduction(id: number) {
        router.post(`/admin/kitchen/production-orders/${id}/cancel`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Production Orders - Central Kitchen" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ChefHat className="size-3.5 text-[#4F6B6A]" />
                            <span>Central Kitchen</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Production Orders
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Rencana produksi bahan jadi untuk outlet.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Produksi Baru</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Total Order</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">{summary.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Clock className="size-3" /> Direncanakan
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">{summary.planned}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-blue-600 uppercase">
                                <Play className="size-3" /> Diproses
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-blue-700">{summary.in_progress}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <CheckCircle2 className="size-3" /> Selesai
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{summary.completed}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <Select value={statusFilter} onValueChange={handleFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="planned">Direncanakan</SelectItem>
                            <SelectItem value="in_progress">Diproses</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Batal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">No. Batch</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Menu</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Qty Direncanakan</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Qty Diproduksi</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Target Outlet</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.data.map((o) => {
                                    const cfg = statusConfig[o.status] ?? statusConfig.planned;

                                    return (
                                        <tr key={o.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3">
                                                <a href={`/admin/kitchen/production-orders/${o.id}`} className="font-medium text-[#4F6B6A] hover:underline">
                                                    {o.batch_number}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{o.menu?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">{Number(o.qty_planned).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">{o.qty_produced != null ? Number(o.qty_produced).toLocaleString('id-ID') : '-'}</td>
                                            <td className="px-4 py-3 text-slate-700">{o.target_outlet?.name ?? '-'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {new Date(o.planned_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {o.status === 'planned' && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="mr-1 h-8 border-blue-300 text-xs text-blue-700 hover:bg-blue-50" onClick={() => startProduction(o.id)}>
                                                            <Play className="mr-1 size-3" /> Mulai
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800" onClick={() => cancelProduction(o.id)}>
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {o.status === 'in_progress' && (
                                                    <Button variant="outline" size="sm" className="h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => completeProduction(o.id)}>
                                                        <CheckCircle2 className="mr-1 size-3" /> Selesai
                                                    </Button>
                                                )}
                                                {o.status === 'completed' && (
                                                    <CheckCircle2 className="ml-auto inline size-5 text-emerald-500" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {orders.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">Belum Ada Order Produksi</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat rencana produksi pertama untuk outlet.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={orders} />
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Buat Order Produksi
                        </DialogTitle>
                        <DialogDescription>Daftarkan rencana produksi bahan jadi.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Menu *</Label>
                            <Select value={form.data.menu_id} onValueChange={(v) => form.setData('menu_id', v)} required>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih menu" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {menus.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.menu_id && <p className="text-xs text-rose-600">{form.errors.menu_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="qty_planned">Qty Produksi *</Label>
                                <Input
                                    id="qty_planned"
                                    type="number"
                                    step="any"
                                    min="1"
                                    className="border-[#CFC0A4]/50 bg-white"
                                    value={form.data.qty_planned}
                                    onChange={(e) => form.setData('qty_planned', e.target.value)}
                                    required
                                />
                                {form.errors.qty_planned && <p className="text-xs text-rose-600">{form.errors.qty_planned}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Target Outlet *</Label>
                                <Select value={form.data.target_outlet_id} onValueChange={(v) => form.setData('target_outlet_id', v)} required>
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue placeholder="Pilih outlet" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        {outlets.map((o) => (
                                            <SelectItem key={o.id} value={String(o.id)}>
                                                {o.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.target_outlet_id && <p className="text-xs text-rose-600">{form.errors.target_outlet_id}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prod_notes">Catatan</Label>
                            <Input
                                id="prod_notes"
                                className="border-[#CFC0A4]/50 bg-white"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Catatan produksi..."
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

ProductionOrders.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Central Kitchen', href: '/admin/kitchen/production-orders' },
        { title: 'Production Orders', href: '/admin/kitchen/production-orders' },
    ],
};

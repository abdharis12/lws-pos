import { Head, router, useForm } from '@inertiajs/react';
import { ChefHat, CheckCircle2, Package, Play, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Menu {
    id: number;
    name: string;
}

interface Outlet {
    id: number;
    name: string;
}

interface RecipeIngredient {
    id: number;
    ingredient_id: number;
    qty_per_portion: number;
    ingredient?: { id: number; name: string; unit: string };
}

interface ProductionOrder {
    id: number;
    batch_number: string;
    status: string;
    qty_planned: number;
    qty_produced: number | null;
    notes: string | null;
    planned_date: string;
    produced_date: string | null;
    menu?: Menu & { recipe_ingredients?: RecipeIngredient[] };
    central_outlet?: Outlet;
    target_outlet?: Outlet;
    produced_by?: { name: string };
}

interface Props {
    order: ProductionOrder;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    planned: { label: 'Direncanakan', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    in_progress: { label: 'Diproses', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function ProductionDetail({ order }: Props) {
    const cfg = statusConfig[order.status] ?? statusConfig.planned;
    const form = useForm({ qty_produced: String(order.qty_produced ?? '') });

    function updateQty(e: React.FormEvent) {
        e.preventDefault();
        router.put(`/admin/kitchen/production-orders/${order.id}`, {
            qty_produced: form.data.qty_produced,
        }, { preserveScroll: true });
    }

    function distribute() {
        router.post(`/admin/kitchen/production-orders/${order.id}/distribute`, {}, { preserveScroll: true });
    }

    const recipe = order.menu?.recipe_ingredients ?? [];

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={`Production ${order.batch_number} - Kitchen`} />

            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ChefHat className="size-3.5 text-[#4F6B6A]" />
                            <span>Central Kitchen</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                {order.batch_number}
                            </h1>
                            <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Menu: {order.menu?.name ?? '-'}
                        </p>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Batch Info</p>
                            <div className="mt-2 space-y-1 text-sm">
                                <p><span className="text-slate-500">No. Batch:</span> <span className="font-medium text-slate-800">{order.batch_number}</span></p>
                                <p><span className="text-slate-500">Tgl Rencana:</span> <span className="font-medium text-slate-800">{new Date(order.planned_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
                                <p><span className="text-slate-500">Diproduksi Oleh:</span> <span className="font-medium text-slate-800">{order.produced_by?.name ?? '-'}</span></p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Outlet</p>
                            <div className="mt-2 space-y-1 text-sm">
                                <p><span className="text-slate-500">Pusat:</span> <span className="font-medium text-slate-800">{order.central_outlet?.name ?? '-'}</span></p>
                                <p><span className="text-slate-500">Target:</span> <span className="font-medium text-slate-800">{order.target_outlet?.name ?? '-'}</span></p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Rencana Produksi</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">{Number(order.qty_planned).toLocaleString('id-ID')}</p>
                            <p className="text-xs text-slate-500">
                                Terproduksi: {order.qty_produced != null ? Number(order.qty_produced).toLocaleString('id-ID') : '-'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Update Qty + Distribute */}
                {(order.status === 'in_progress' || order.status === 'planned') && (
                    <Card className="mb-6 border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Update Produksi</h3>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={updateQty} className="flex items-end gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="qty_produced">Qty Terproduksi</Label>
                                    <Input
                                        id="qty_produced"
                                        type="number"
                                        step="any"
                                        min="0"
                                        className="w-40 border-[#CFC0A4]/50 bg-white"
                                        value={form.data.qty_produced}
                                        onChange={(e) => form.setData('qty_produced', e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="outline" className="border-[#4F6B6A] text-[#4F6B6A] hover:bg-[#4F6B6A]/5">
                                    Simpan Qty
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {order.status === 'completed' && order.qty_produced != null && (
                    <Card className="mb-6 border-emerald-200 bg-emerald-50/50 shadow-sm">
                        <CardContent className="flex items-center justify-between pt-6">
                            <div>
                                <p className="text-[10px] font-medium tracking-wider text-emerald-600 uppercase">Produksi Selesai</p>
                                <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                                    {Number(order.qty_produced).toLocaleString('id-ID')} porsi terproduksi
                                </p>
                            </div>
                            <Button onClick={distribute} className="bg-[#4F6B6A] hover:bg-[#4F6B6A]/90">
                                <Truck className="mr-2 size-4 text-[#CFC0A4]" /> Distribusikan ke Outlet
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Recipe Ingredients */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Resep Bahan</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Bahan</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Qty per Porsi</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total Dibutuhkan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipe.map((r) => (
                                    <tr key={r.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{r.ingredient?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">
                                            {Number(r.qty_per_portion).toLocaleString('id-ID')} {r.ingredient?.unit}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                                            {(Number(r.qty_per_portion) * Number(order.qty_planned)).toLocaleString('id-ID')} {r.ingredient?.unit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {recipe.length === 0 && (
                        <div className="py-16 text-center">
                            <Package className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Resep</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Menu ini belum memiliki resep bahan.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

ProductionDetail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Central Kitchen', href: '/admin/kitchen/production-orders' },
        { title: 'Production Orders', href: '/admin/kitchen/production-orders' },
        { title: 'Detail', href: '#' },
    ],
};

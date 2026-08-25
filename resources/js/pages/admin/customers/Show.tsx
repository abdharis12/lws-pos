import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Award, Footprints, Gift, ShoppingBag, TrendingUp } from 'lucide-react';
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

interface OrderRow {
    id: number;
    total: string | number;
    status: string;
    created_at: string;
}

interface Props {
    customer: {
        id: number;
        name: string;
        phone: string | null;
        email: string | null;
        birthdate: string | null;
        tier: string;
        points: number;
        total_spend: string | number;
        visit_count: number;
        is_active: boolean;
        orders: OrderRow[];
    };
    tierProgress: {
        current_tier: string;
        total_spend: number;
        next_tier: string | null;
        next_tier_threshold: number | null;
        progress_percent: number;
        remaining_to_next: number;
    };
}

const tierConfig: Record<string, { label: string; className: string }> = {
    bronze: { label: 'Bronze', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    silver: { label: 'Silver', className: 'bg-gray-100 text-gray-600 border-gray-300' },
    gold: { label: 'Gold', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    platinum: { label: 'Platinum', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const orderStatusConfig: Record<string, { label: string; className: string }> = {
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    paid: { label: 'Dibayar', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    processing: { label: 'Diproses', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    cancelled: { label: 'Dibatalkan', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function CustomerShow({ customer, tierProgress }: Props) {
    const [redeemOpen, setRedeemOpen] = useState(false);

    const form = useForm({ points: '' });

    const tier = tierConfig[customer.tier] ?? tierConfig.bronze;
    const progressWidth = Math.min(100, Math.max(0, tierProgress.progress_percent));

    function openRedeem() {
        form.reset();
        setRedeemOpen(true);
    }

    function submitRedeem(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/admin/customers/${customer.id}/redeem-points`, {
            preserveScroll: true,
            onSuccess: () => setRedeemOpen(false),
        });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={`${customer.name} - CRM`} />

            <div className="mx-auto max-w-7xl">
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-4 gap-1.5 text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                    onClick={() => router.visit('/admin/customers')}
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke Pelanggan
                </Button>

                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Award className="size-3.5 text-[#4F6B6A]" />
                            <span>CRM</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                {customer.name}
                            </h1>
                            <Badge variant="outline" className={tier.className}>{tier.label}</Badge>
                            {!customer.is_active && (
                                <Badge variant="secondary" className="text-xs">Nonaktif</Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            {customer.phone ?? '-'} · {customer.email ?? 'Tanpa email'}
                            {customer.birthdate ? ` · Lahir ${new Date(customer.birthdate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
                        </p>
                    </div>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Gift className="size-3.5" /> Poin Loyalty
                            </p>
                            <div className="mt-1 flex items-center justify-between">
                                <p className="font-serif text-3xl font-bold text-amber-700">
                                    {customer.points.toLocaleString('id-ID')}
                                </p>
                                <Button size="sm" onClick={openRedeem} disabled={customer.points <= 0}>
                                    Tukar Poin
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <ShoppingBag className="size-3.5" /> Total Belanja
                            </p>
                            <p className="mt-1 font-serif text-3xl font-bold text-[#4F6B6A]">
                                Rp {Number(customer.total_spend).toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <Footprints className="size-3.5" /> Jumlah Kunjungan
                            </p>
                            <p className="mt-1 font-serif text-3xl font-bold text-[#4F6B6A]">{customer.visit_count}x</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-8 border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardContent className="pt-6">
                        <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                            <TrendingUp className="size-3.5 text-[#4F6B6A]" /> Progres Tier
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-800">
                                Tier saat ini: <span className="text-[#4F6B6A]">{tier.label}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                                Total belanja Rp {Number(tierProgress.total_spend).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#F6F2E9]">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]"
                                style={{ width: `${progressWidth}%` }}
                            />
                        </div>
                        <p className="mt-2.5 text-xs text-slate-600">
                            {tierProgress.next_tier ? (
                                <>
                                    Sisa <span className="font-bold text-[#4F6B6A]">Rp {Number(tierProgress.remaining_to_next).toLocaleString('id-ID')}</span>
                                    {' '}untuk naik ke{' '}
                                    <span className="font-bold text-[#4F6B6A]">
                                        {tierConfig[tierProgress.next_tier]?.label ?? tierProgress.next_tier}
                                    </span>
                                    {tierProgress.next_tier_threshold != null && (
                                        <> (min. belanja Rp {Number(tierProgress.next_tier_threshold).toLocaleString('id-ID')})</>
                                    )}
                                </>
                            ) : (
                                <span className="font-semibold text-purple-700">Anda berada di tier tertinggi!</span>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] px-4 py-3">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Riwayat Transaksi</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">ID</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customer.orders.map((order) => {
                                    const cfg = orderStatusConfig[order.status] ?? {
                                        label: order.status,
                                        className: 'bg-slate-100 text-slate-600 border-slate-200',
                                    };

                                    return (
                                        <tr key={order.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">#{order.id}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                Rp {Number(order.total).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {customer.orders.length === 0 && (
                        <div className="py-16 text-center">
                            <ShoppingBag className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Transaksi</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Riwayat pesanan pelanggan akan muncul di sini.</p>
                        </div>
                    )}
                </Card>
            </div>

            <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">Tukar Poin</DialogTitle>
                        <DialogDescription>
                            Poin tersedia: {customer.points.toLocaleString('id-ID')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitRedeem} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="points">Jumlah Poin *</Label>
                            <Input
                                id="points"
                                type="number"
                                min="1"
                                max={customer.points}
                                value={form.data.points}
                                onChange={(e) => form.setData('points', e.target.value)}
                                required
                            />
                            {form.errors.points && <p className="text-xs text-rose-600">{form.errors.points}</p>}
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setRedeemOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={form.processing}>
                                Tukarkan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

CustomerShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Pelanggan', href: '/admin/customers' },
        { title: 'Detail', href: '/admin/customers' },
    ],
};

import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Pencil, Percent, Plus, Power, Repeat, Search, Ticket } from 'lucide-react';
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

interface Promo {
    id: number;
    code: string;
    name: string;
    type: string;
    value: string | number;
    min_spend: string | number;
    max_discount: string | number | null;
    valid_from: string;
    valid_to: string;
    usage_limit: number | null;
    usage_count: number;
    channel: string;
    is_active: boolean;
}

interface PromoForm {
    id?: number;
    code: string;
    name: string;
    type: string;
    value: string;
    min_spend: string;
    max_discount: string;
    valid_from: string;
    valid_to: string;
    usage_limit: string;
    usage_limit_per_customer: string;
    channel: string;
    description: string;
}

interface Props {
    promos: {
        data: Promo[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { search?: string; is_active?: string };
    summary: {
        total_promos: number;
        active_promos: number;
        total_redemptions: number;
        total_discount_given: number;
    };
}

const typeLabels: Record<string, string> = {
    percent: 'Persen',
    nominal: 'Nominal',
    buy_x_get_y: 'Beli X Gratis Y',
};

const channelConfig: Record<string, { label: string; className: string }> = {
    all: { label: 'Semua', className: 'bg-teal-100 text-teal-700 border-teal-200' },
    pos: { label: 'POS', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    self_order: { label: 'Self Order', className: 'bg-orange-100 text-orange-700 border-orange-200' },
};

function displayValue(promo: Promo): string {
    const v = Number(promo.value);

    if (promo.type === 'percent') {
return `${v}%`;
}

    return `Rp ${v.toLocaleString('id-ID')}`;
}

function statusOf(promo: Promo): { label: string; className: string } {
    if (!promo.is_active) {
return { label: 'Nonaktif', className: 'bg-rose-100 text-rose-700 border-rose-200' };
}

    if (new Date(promo.valid_to) < new Date()) {
return { label: 'Kedaluwarsa', className: 'bg-gray-100 text-gray-600 border-gray-300' };
}

    return { label: 'Aktif', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
}

const emptyForm: PromoForm = {
    code: '',
    name: '',
    type: 'percent',
    value: '',
    min_spend: '',
    max_discount: '',
    valid_from: '',
    valid_to: '',
    usage_limit: '',
    usage_limit_per_customer: '1',
    channel: 'all',
    description: '',
};

export default function PromosIndex({ promos, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [isActive, setIsActive] = useState(filters.is_active ?? 'all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<PromoForm>(emptyForm);

    const form = useForm<PromoForm>({ ...emptyForm });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get('/admin/promos', {
                    search: search || undefined,
                    is_active: isActive !== 'all' ? isActive : undefined,
                }, { preserveScroll: true, preserveState: true });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search, filters.search, isActive]);

    function applyStatusFilter(value: string) {
        setIsActive(value);
        router.get('/admin/promos', {
            search: search || undefined,
            is_active: value !== 'all' ? value : undefined,
        }, { preserveScroll: true, preserveState: true });
    }

    function openCreate() {
        setEditing(emptyForm);
        form.setData({ ...emptyForm });
        setFormOpen(true);
    }

    function openEdit(promo: Promo) {
        const data: PromoForm = {
            id: promo.id,
            code: promo.code,
            name: promo.name,
            type: promo.type,
            value: String(promo.value ?? ''),
            min_spend: String(promo.min_spend ?? ''),
            max_discount: promo.max_discount != null ? String(promo.max_discount) : '',
            valid_from: (promo.valid_from ?? '').slice(0, 10),
            valid_to: (promo.valid_to ?? '').slice(0, 10),
            usage_limit: promo.usage_limit != null ? String(promo.usage_limit) : '',
            usage_limit_per_customer: '1',
            channel: promo.channel,
            description: '',
        };
        setEditing(data);
        form.setData(data);
        setFormOpen(true);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();

        if (editing.id) {
            form.put(`/admin/promos/${editing.id}`, {
                onSuccess: () => setFormOpen(false),
            });
        } else {
            form.post('/admin/promos', {
                onSuccess: () => setFormOpen(false),
            });
        }
    }

    function toggleActive(promoId: number) {
        router.post(`/admin/promos/${promoId}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Promo - Marketing" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Ticket className="size-3.5 text-[#4F6B6A]" />
                            <span>Marketing</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Promo &amp; Voucher
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola kode promo, voucher diskon, dan program marketing.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Promo Baru</span>
                    </Button>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Total Promo</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">{summary.total_promos}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <CheckCircle2 className="size-3" /> Promo Aktif
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{summary.active_promos}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-blue-600 uppercase">
                                <Repeat className="size-3" /> Total Penukaran
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-blue-700">
                                {summary.total_redemptions.toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-rose-600 uppercase">
                                <Percent className="size-3" /> Total Diskon Diberikan
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                Rp {Number(summary.total_discount_given).toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <Input
                            placeholder="Cari kode atau nama promo..."
                            className="border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={isActive} onValueChange={applyStatusFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tipe &amp; Nilai</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Periode</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kuota</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Channel</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promos.data.map((promo) => {
                                    const status = statusOf(promo);
                                    const channel = channelConfig[promo.channel] ?? channelConfig.all;

                                    return (
                                        <tr key={promo.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3 font-mono text-sm font-bold tracking-wide text-slate-800">{promo.code}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{promo.name}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-slate-400">{typeLabels[promo.type] ?? promo.type}</div>
                                                <div className="font-semibold text-slate-700">{displayValue(promo)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600">
                                                {new Date(promo.valid_from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {' s/d '}
                                                {new Date(promo.valid_to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-700">
                                                {promo.usage_limit != null ? `${promo.usage_count}/${promo.usage_limit}` : `${promo.usage_count}/∞`}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={channel.className}>{channel.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={status.className}>{status.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`size-8 ${promo.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                    title={promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    onClick={() => toggleActive(promo.id)}
                                                >
                                                    <Power className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => openEdit(promo)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {promos.data.length === 0 && (
                        <div className="py-16 text-center">
                            <Ticket className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Promo</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat promo pertama untuk menarik pelanggan.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={promos} />
                </div>
            </div>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            {editing.id ? 'Edit Promo' : 'Promo Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing.id ? 'Perbarui detail promo.' : 'Buat kode promo atau voucher baru.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode *</Label>
                                <Input
                                    id="code"
                                    className="font-mono uppercase"
                                    placeholder="DISKON10"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                    required
                                />
                                {form.errors.code && <p className="text-xs text-rose-600">{form.errors.code}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama *</Label>
                                <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                {form.errors.name && <p className="text-xs text-rose-600">{form.errors.name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipe</Label>
                                <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                    <SelectTrigger className="border-[#CFC0A4]/50 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        <SelectItem value="percent">Persen</SelectItem>
                                        <SelectItem value="nominal">Nominal</SelectItem>
                                        <SelectItem value="buy_x_get_y">Beli X Gratis Y</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Nilai *</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder={form.data.type === 'percent' ? '10' : '25000'}
                                    value={form.data.value}
                                    onChange={(e) => form.setData('value', e.target.value)}
                                    required
                                />
                                {form.errors.value && <p className="text-xs text-rose-600">{form.errors.value}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_spend">Min. Belanja</Label>
                                <Input id="min_spend" type="number" step="any" min="0" value={form.data.min_spend} onChange={(e) => form.setData('min_spend', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_discount">Maks. Diskon</Label>
                                <Input id="max_discount" type="number" step="any" min="0" placeholder="Tanpa batas" value={form.data.max_discount} onChange={(e) => form.setData('max_discount', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="valid_from">Berlaku Dari *</Label>
                                <Input id="valid_from" type="date" value={form.data.valid_from} onChange={(e) => form.setData('valid_from', e.target.value)} required />
                                {form.errors.valid_from && <p className="text-xs text-rose-600">{form.errors.valid_from}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="valid_to">Berlaku Sampai *</Label>
                                <Input id="valid_to" type="date" value={form.data.valid_to} onChange={(e) => form.setData('valid_to', e.target.value)} required />
                                {form.errors.valid_to && <p className="text-xs text-rose-600">{form.errors.valid_to}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="usage_limit">Batas Pakai Total</Label>
                                <Input id="usage_limit" type="number" min="0" placeholder="Tanpa batas (∞)" value={form.data.usage_limit} onChange={(e) => form.setData('usage_limit', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="usage_limit_per_customer">Batas per Pelanggan</Label>
                                <Input id="usage_limit_per_customer" type="number" min="1" value={form.data.usage_limit_per_customer} onChange={(e) => form.setData('usage_limit_per_customer', e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Channel</Label>
                            <Select value={form.data.channel} onValueChange={(v) => form.setData('channel', v)}>
                                <SelectTrigger className="border-[#CFC0A4]/50 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="pos">POS</SelectItem>
                                    <SelectItem value="self_order">Self Order</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Input id="description" placeholder="Syarat & ketentuan singkat..." value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="border border-[#CFC0A4]/40">
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

PromosIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Promo', href: '/admin/promos' },
    ],
};

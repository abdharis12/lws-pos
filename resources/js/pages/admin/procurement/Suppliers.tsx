import { Head, router, useForm } from '@inertiajs/react';
import { DollarSign, Pencil, Plus, Search, Shield, Star, Award } from 'lucide-react';
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

interface SupplierSummary {
    total_suppliers: number;
    active_suppliers: number;
    total_outstanding: number;
}

interface Supplier {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    payment_terms: string | null;
    lead_time_days: number | null;
    is_active: boolean;
    rating: string | number | null;
    on_time_delivery_rate: string | number | null;
    quality_rating: string | number | null;
}

interface SupplierForm {
    id?: number;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    payment_terms: string;
    lead_time_days: string;
    is_active: boolean;
    rating: string;
    on_time_delivery_rate: string;
    quality_rating: string;
}

interface Props {
    suppliers: {
        data: Supplier[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { search?: string; is_active?: string; payment_terms?: string };
    summary: SupplierSummary;
}

const emptyForm: SupplierForm = {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: 'cash',
    lead_time_days: '1',
    is_active: true,
    rating: '',
    on_time_delivery_rate: '',
    quality_rating: '',
};

export default function SuppliersIndex({ suppliers, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<SupplierForm>(emptyForm);

    const form = useForm<SupplierForm>({ ...emptyForm });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get('/admin/procurement/suppliers', {
                    search: search || undefined,
                }, { preserveScroll: true, preserveState: true });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search, filters.search]);

    function openCreate() {
        setEditing(emptyForm);
        form.setData({ ...emptyForm });
        setFormOpen(true);
    }

    function openEdit(supplier: Supplier) {
        setEditing({
            id: supplier.id,
            name: supplier.name,
            contact_person: supplier.contact_person ?? '',
            phone: supplier.phone ?? '',
            email: supplier.email ?? '',
            address: supplier.address ?? '',
            payment_terms: supplier.payment_terms ?? 'cash',
            lead_time_days: String(supplier.lead_time_days ?? 1),
            is_active: supplier.is_active,
            rating: String(supplier.rating ?? ''),
            on_time_delivery_rate: String(supplier.on_time_delivery_rate ?? ''),
            quality_rating: String(supplier.quality_rating ?? ''),
        });
        form.setData({
            name: supplier.name,
            contact_person: supplier.contact_person ?? '',
            phone: supplier.phone ?? '',
            email: supplier.email ?? '',
            address: supplier.address ?? '',
            payment_terms: supplier.payment_terms ?? 'cash',
            lead_time_days: String(supplier.lead_time_days ?? 1),
            is_active: supplier.is_active,
            rating: String(supplier.rating ?? ''),
            on_time_delivery_rate: String(supplier.on_time_delivery_rate ?? ''),
            quality_rating: String(supplier.quality_rating ?? ''),
        });
        setFormOpen(true);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();

        if (editing.id) {
            form.put(`/admin/procurement/suppliers/${editing.id}`, {
                onSuccess: () => setFormOpen(false),
            });
        } else {
            form.post('/admin/procurement/suppliers', {
                onSuccess: () => setFormOpen(false),
            });
        }
    }

    function recalculate(supplierId: number) {
        router.post(`/admin/procurement/suppliers/${supplierId}/recalculate`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Supplier - Procurement" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Shield className="size-3.5 text-[#4F6B6A]" />
                            <span>Procurement</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Supplier Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola data supplier dan performa pengiriman.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Supplier Baru</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Total Supplier
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                {summary.total_suppliers}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Supplier Aktif
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                {summary.active_suppliers}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-rose-600 uppercase">
                                <DollarSign className="size-3" /> Total Hutang
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                Rp {Number(summary.total_outstanding).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <Input
                            placeholder="Cari supplier..."
                            className="border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Kontak
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Syarat Bayar
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Rating
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        On-Time %
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Kualitas
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.data.map((supplier) => (
                                    <tr
                                        key={supplier.id}
                                        className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{supplier.name}</div>
                                            {!supplier.is_active && (
                                                <Badge variant="secondary" className="mt-1 text-xs">Nonaktif</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-600">{supplier.contact_person}</div>
                                            <div className="text-xs text-slate-400">{supplier.phone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {supplier.payment_terms ? supplier.payment_terms.toUpperCase() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="size-3.5 text-amber-500" />
                                                <span className="font-medium text-slate-800">
                                                    {supplier.rating ? Number(supplier.rating).toFixed(1) : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={
                                                Number(supplier.on_time_delivery_rate ?? 0) >= 80
                                                    ? 'font-medium text-emerald-600'
                                                    : Number(supplier.on_time_delivery_rate ?? 0) >= 50
                                                        ? 'font-medium text-amber-600'
                                                        : 'font-medium text-rose-600'
                                            }>
                                                {supplier.on_time_delivery_rate ? Number(supplier.on_time_delivery_rate).toFixed(0) + '%' : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Award className="size-3.5 text-[#4F6B6A]" />
                                                <span className="text-slate-800">
                                                    {supplier.quality_rating ? Number(supplier.quality_rating).toFixed(1) + '/5' : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                                                onClick={() => recalculate(supplier.id)}
                                            >
                                                Recalc
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => openEdit(supplier)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {suppliers.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">Belum Ada Supplier</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Tambahkan supplier untuk mulai bertransaksi.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={suppliers} />
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            {editing.id ? 'Edit Supplier' : 'Tambah Supplier'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing.id ? 'Perbarui informasi supplier.' : 'Daftarkan supplier baru.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Supplier *</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                            />
                            {form.errors.name && <p className="text-xs text-rose-600">{form.errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact_person">Kontak Person</Label>
                                <Input id="contact_person" value={form.data.contact_person} onChange={(e) => form.setData('contact_person', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telepon</Label>
                                <Input id="phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input id="address" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Syarat Bayar</Label>
                                <Select value={form.data.payment_terms} onValueChange={(v) => form.setData('payment_terms', v)}>
                                    <SelectTrigger className="border-[#CFC0A4]/50 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="net_7">Net 7</SelectItem>
                                        <SelectItem value="net_14">Net 14</SelectItem>
                                        <SelectItem value="net_30">Net 30</SelectItem>
                                        <SelectItem value="net_60">Net 60</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lead_time">Lead Time (hari)</Label>
                                <Input id="lead_time" type="number" min="0" max="90" value={form.data.lead_time_days} onChange={(e) => form.setData('lead_time_days', e.target.value)} />
                            </div>
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

SuppliersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Procurement', href: '/admin/procurement/suppliers' },
        { title: 'Supplier', href: '/admin/procurement/suppliers' },
    ],
};
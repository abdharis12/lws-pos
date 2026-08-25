import { Head, Link, router, useForm } from '@inertiajs/react';
import { Award, Crown, Pencil, Plus, Search, Star, Trash2, UserCheck, Users } from 'lucide-react';
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

interface Customer {
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
}

interface CustomerForm {
    id?: number;
    name: string;
    phone: string;
    email: string;
    birthdate: string;
    allergens: string;
}

interface Props {
    customers: {
        data: Customer[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { search?: string; tier?: string; is_active?: string };
    summary: {
        total_customers: number;
        active_customers: number;
        total_points_issued: number;
        gold_plus_count: number;
    };
    topCustomers: Customer[];
}

const tierConfig: Record<string, { label: string; className: string }> = {
    bronze: { label: 'Bronze', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    silver: { label: 'Silver', className: 'bg-gray-100 text-gray-600 border-gray-300' },
    gold: { label: 'Gold', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    platinum: { label: 'Platinum', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const emptyForm: CustomerForm = {
    name: '',
    phone: '',
    email: '',
    birthdate: '',
    allergens: '',
};

export default function CustomersIndex({ customers, filters, summary, topCustomers }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [tier, setTier] = useState(filters.tier ?? 'all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CustomerForm>(emptyForm);

    const form = useForm<CustomerForm>({ ...emptyForm });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get('/admin/customers', {
                    search: search || undefined,
                    tier: tier !== 'all' ? tier : undefined,
                }, { preserveScroll: true, preserveState: true });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search, filters.search, tier]);

    function applyTierFilter(value: string) {
        setTier(value);
        router.get('/admin/customers', {
            search: search || undefined,
            tier: value !== 'all' ? value : undefined,
        }, { preserveScroll: true, preserveState: true });
    }

    function openCreate() {
        setEditing(emptyForm);
        form.setData({ ...emptyForm });
        setFormOpen(true);
    }

    function openEdit(customer: Customer) {
        const data: CustomerForm = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone ?? '',
            email: customer.email ?? '',
            birthdate: (customer.birthdate ?? '').slice(0, 10),
            allergens: '',
        };
        setEditing(data);
        form.setData(data);
        setFormOpen(true);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();

        if (editing.id) {
            form.put(`/admin/customers/${editing.id}`, {
                onSuccess: () => setFormOpen(false),
            });
        } else {
            form.post('/admin/customers', {
                onSuccess: () => setFormOpen(false),
            });
        }
    }

    function deleteCustomer(customer: Customer) {
        if (confirm(`Hapus pelanggan "${customer.name}"?`)) {
            router.delete(`/admin/customers/${customer.id}`, { preserveScroll: true });
        }
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Pelanggan - CRM" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Users className="size-3.5 text-[#4F6B6A]" />
                            <span>CRM</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Pelanggan
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola data pelanggan dan program loyalitas.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Tambah Pelanggan</span>
                    </Button>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Total Pelanggan</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">{summary.total_customers}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <UserCheck className="size-3" /> Aktif
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{summary.active_customers}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Star className="size-3" /> Total Poin
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">
                                {summary.total_points_issued.toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-purple-200 bg-purple-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-purple-600 uppercase">
                                <Crown className="size-3" /> Member Gold+
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-purple-700">{summary.gold_plus_count}</p>
                        </CardContent>
                    </Card>
                </div>

                {topCustomers.length > 0 && (
                    <Card className="mb-8 border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <Award className="size-3.5 text-[#CFC0A4]" /> Pelanggan Teratas
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {topCustomers.slice(0, 5).map((customer, i) => {
                                    const cfg = tierConfig[customer.tier] ?? tierConfig.bronze;

                                    return (
                                        <Link
                                            key={customer.id}
                                            href={`/admin/customers/${customer.id}`}
                                            className="rounded-lg border border-[#CFC0A4]/30 bg-[#F6F2E9]/60 p-3 transition-colors hover:bg-[#F6F2E9]"
                                        >
                                            <p className="text-[10px] font-bold tracking-wider text-[#CFC0A4]">#{i + 1}</p>
                                            <p className="truncate text-sm font-semibold text-slate-800">{customer.name}</p>
                                            <div className="mt-1.5 flex items-center justify-between">
                                                <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
                                                    {cfg.label}
                                                </Badge>
                                                <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                                    <Star className="size-3 fill-amber-400 text-amber-400" />
                                                    {customer.points.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <Input
                            placeholder="Cari nama, telepon, email..."
                            className="border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={tier} onValueChange={applyTierFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua Tier" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Tier</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tier</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Poin</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total Belanja</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kunjungan</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.map((customer) => {
                                    const cfg = tierConfig[customer.tier] ?? tierConfig.bronze;

                                    return (
                                        <tr key={customer.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3">
                                                {!customer.is_active && (
                                                    <Badge variant="secondary" className="mr-2 text-xs">Nonaktif</Badge>
                                                )}
                                                <Link
                                                    href={`/admin/customers/${customer.id}`}
                                                    className="font-medium text-slate-800 hover:text-[#4F6B6A] hover:underline"
                                                >
                                                    {customer.name}
                                                </Link>
                                                <div className="text-xs text-slate-400">{customer.phone ?? '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-amber-600">
                                                {customer.points.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp {Number(customer.total_spend).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-700">{customer.visit_count}x</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => openEdit(customer)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-rose-600 hover:bg-rose-50"
                                                    onClick={() => deleteCustomer(customer)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {customers.data.length === 0 && (
                        <div className="py-16 text-center">
                            <Users className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Pelanggan</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Tambahkan pelanggan untuk mulai membangun loyalitas.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={customers} />
                </div>
            </div>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            {editing.id ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing.id ? 'Perbarui informasi pelanggan.' : 'Daftarkan pelanggan baru ke program loyalitas.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama *</Label>
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
                                <Label htmlFor="phone">Telepon</Label>
                                <Input id="phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthdate">Tanggal Lahir</Label>
                                <Input id="birthdate" type="date" value={form.data.birthdate} onChange={(e) => form.setData('birthdate', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="allergens">Alergen</Label>
                                <Input
                                    id="allergens"
                                    placeholder="Kacang, seafood, ..."
                                    value={form.data.allergens}
                                    onChange={(e) => form.setData('allergens', e.target.value)}
                                />
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

CustomersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Pelanggan', href: '/admin/customers' },
    ],
};

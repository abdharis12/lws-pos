import { Head, Link, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Eye, Search, Users, Sparkles, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
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

interface UserData {
    id: number;
    name: string;
    email: string;
}

interface EmployeeData {
    id: number;
    user_id: number;
    phone: string | null;
    position: string;
    join_date: string;
    base_salary: string | number;
    salary_type: string;
    is_active: boolean;
    user: UserData;
    role?: string;
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface PaginationMeta {
    data: EmployeeData[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    employees: PaginationMeta;
    roles: string[];
    filters: { search?: string };
}

export default function EmployeesIndex({ employees, roles, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeData | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteConfirm, setDeleteConfirm] = useState<EmployeeData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        position: '',
        role: '',
        join_date: '',
        base_salary: '',
        salary_type: 'monthly',
        is_active: true,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/employees',
                    { search: search || undefined },
                    { preserveScroll: true, preserveState: true },
                );
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(emp: EmployeeData) {
        setEditing(emp);
        setData({
            name: emp.user.name,
            email: emp.user.email,
            password: '',
            phone: emp.phone ?? '',
            position: emp.position,
            role: emp.role ?? '',
            join_date: emp.join_date,
            base_salary: String(emp.base_salary),
            salary_type: emp.salary_type,
            is_active: emp.is_active,
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/employees/${editing.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        } else {
            post('/admin/employees', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(emp: EmployeeData) {
        setDeleteConfirm(emp);
    }

    function confirmDelete() {
        if (!deleteConfirm) return;
        destroy(`/admin/employees/${deleteConfirm.id}`, {
            onSuccess: () => setDeleteConfirm(null),
        });
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Karyawan" />

            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <Users className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Manajemen Karyawan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Daftar Karyawan
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            Kelola data karyawan dan informasi personal mereka.
                        </p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}>
                                <Plus className="size-4 text-[oklch(0.80_0.038_88.5)]" />
                                <span className="font-medium tracking-wide">Tambah Karyawan</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] shadow-xl">
                            <DialogHeader className="border-b border-[oklch(0.80_0.038_88.5)]/30 pb-4">
                                <DialogTitle className="font-serif text-xl font-semibold text-[oklch(0.48_0.032_195.5)]">
                                    {editing ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Nama</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                {!editing && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">No. Telepon</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="position" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Posisi</Label>
                                    <Input
                                        id="position"
                                        value={data.position}
                                        onChange={(e) => setData('position', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                    <InputError message={errors.position} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Role</Label>
                                    <Select
                                        value={data.role}
                                        onValueChange={(v) => setData('role', v)}
                                    >
                                        <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                            {roles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.role} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="join_date" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Tanggal Masuk</Label>
                                    <Input
                                        id="join_date"
                                        type="date"
                                        value={data.join_date}
                                        onChange={(e) => setData('join_date', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                    <InputError message={errors.join_date} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="base_salary" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Gaji Pokok</Label>
                                        <Input
                                            id="base_salary"
                                            type="number"
                                            min="0"
                                            value={data.base_salary}
                                            onChange={(e) => setData('base_salary', e.target.value)}
                                            className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                        />
                                        <InputError message={errors.base_salary} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="salary_type" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Tipe Gaji</Label>
                                        <Select
                                            value={data.salary_type}
                                            onValueChange={(v) => setData('salary_type', v)}
                                        >
                                            <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                                <SelectItem value="monthly">Bulanan</SelectItem>
                                                <SelectItem value="daily">Harian</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.salary_type} />
                                    </div>
                                </div>
                                {editing && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            className="size-4 rounded border"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                        />
                                        <Label htmlFor="is_active">Aktif</Label>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button type="submit" disabled={processing} className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)] transition-colors font-serif tracking-wider uppercase text-xs py-5">
                                        {editing ? 'Simpan Perubahan' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="mb-8 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[oklch(0.80_0.038_88.5)]" />
                        <Input
                            placeholder="Cari nama, email, atau posisi..."
                            className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 pl-9 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Employee Cards Grid */}
                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {employees.data.map((emp) => (
                        <Card
                            key={emp.id}
                            className="group overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.80_0.038_88.5)] hover:shadow-md"
                        >
                            <CardHeader className="pb-2 pt-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10 font-serif text-lg font-bold text-[oklch(0.48_0.032_195.5)]">
                                        {emp.user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif text-lg font-medium tracking-tight text-[oklch(0.48_0.032_195.5)] group-hover:text-[oklch(0.38_0.032_195.5)]">
                                            {emp.user.name}
                                        </h3>
                                        <p className="text-xs italic text-slate-500 truncate">{emp.user.email}</p>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-2 pb-5">
                                <div className="mb-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Posisi</span>
                                        <Badge className="border-secondary bg-primary text-white rounded-full">
                                            {emp.position}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Gaji</span>
                                        <span className="font-serif text-sm font-semibold text-slate-800">
                                            Rp {Number(emp.base_salary).toLocaleString('id-ID')}/{emp.salary_type === 'monthly' ? 'bln' : 'hr'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Status</span>
                                        <Badge
                                            variant="secondary"
                                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                emp.is_active
                                                    ? 'border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)]/10 text-[oklch(0.48_0.032_195.5)]'
                                                    : 'border-slate-200 bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {emp.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-1 border-t border-[oklch(0.80_0.038_88.5)]/20 pt-3">
                                    <Link href={`/admin/employees/${emp.id}`}>
                                        <Button variant="secondary" size="icon" className="size-8" title="Lihat Detail">
                                            <Eye className="size-4 text-slate-500" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(emp)}
                                        className="size-8 bg-[oklch(0.48_0.032_195.5)] text-secondary hover:bg-[oklch(0.48_0.032_195.5)]/70 hover:text-secondary transition-colors"
                                        title="Edit Karyawan"
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(emp)}
                                        className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                        title="Hapus Karyawan"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {employees.data.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                                <div className="mb-3 rounded-full bg-[oklch(0.80_0.038_88.5)]/20 p-4 text-[oklch(0.48_0.032_195.5)]">
                                    <Sparkles className="size-6" />
                                </div>
                                <h4 className="font-serif text-lg font-medium text-slate-700">Karyawan Tidak Ditemukan</h4>
                                <p className="mt-1 text-xs italic text-slate-500">
                                    Cobalah mengubah kata kunci pencarian atau tambahkan karyawan baru.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-8">
                    <hr className="border border-[oklch(0.80_0.038_88.5)]/40" />
                    <Pagination meta={employees} />
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                    <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                                <AlertTriangle className="size-6 text-rose-600" />
                            </div>
                            <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                Hapus Karyawan
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{deleteConfirm?.user.name}</span>? Tindakan ini tidak dapat dibatalkan.
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
                                {processing ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Karyawan', href: '/admin/employees' },
    ],
};

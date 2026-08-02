import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Trash2,
    UserCheck,
    Calendar,
    Phone,
    Mail,
    AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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
    resign_date: string | null;
    base_salary: string | number;
    salary_type: string;
    is_active: boolean;
    user: UserData;
    role?: string;
}

interface Props {
    employee: EmployeeData;
}

export default function EmployeesShow({ employee }: Props) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    function confirmDelete() {
        setDeleting(true);
        router.delete(`/admin/employees/${employee.id}`, {
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={employee.user.name} />

            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <UserCheck className="size-3.5 text-[#4F6B6A]" />
                            <span>Manajemen Karyawan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            {employee.user.name}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Detail informasi karyawan dan data personal.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/admin/employees">
                            <Button
                                variant="outline"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="size-9 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                            title="Hapus Karyawan"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                            <CardContent className="flex flex-col items-center pt-8 pb-6">
                                <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-[#4F6B6A]/10 font-serif text-4xl font-bold text-[#4F6B6A]">
                                    {employee.user.name.charAt(0)}
                                </div>
                                <h3 className="font-serif text-xl font-semibold tracking-tight text-[#4F6B6A]">
                                    {employee.user.name}
                                </h3>
                                <p className="mt-1 text-lg font-bold text-slate-500 italic">
                                    {employee.position}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                            employee.is_active
                                                ? 'border-[#CFC0A4]/30 bg-[#4F6B6A]/10 text-[#4F6B6A]'
                                                : 'border-slate-200 bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {employee.is_active
                                            ? 'Aktif'
                                            : 'Tidak Aktif'}
                                    </Badge>
                                    {employee.role && (
                                        <Badge className="rounded-full border border-[#CFC0A4]/30 bg-[#CFC0A4]/10 text-xs font-normal text-[#CFC0A4]">
                                            {employee.role}
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-6 w-full space-y-3 border-t border-[#CFC0A4]/20 pt-5">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="size-4 text-[#CFC0A4]" />
                                        <span className="truncate text-slate-600">
                                            {employee.user.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="size-4 text-[#CFC0A4]" />
                                        <span className="text-slate-600">
                                            {employee.phone || '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="size-4 text-[#CFC0A4]" />
                                        <span className="text-slate-600">
                                            Masuk: {employee.join_date}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detail Cards */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Informasi Pribadi */}
                        <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                            <CardHeader className="border-b border-[#CFC0A4]/20">
                                <CardTitle className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    Informasi Pribadi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Nama Lengkap
                                        </span>
                                        <p className="mt-1 font-serif font-medium text-slate-800">
                                            {employee.user.name}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Email
                                        </span>
                                        <p className="mt-1 font-serif font-medium text-slate-800">
                                            {employee.user.email}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Telepon
                                        </span>
                                        <p className="mt-1 font-serif font-medium text-slate-800">
                                            {employee.phone || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Posisi
                                        </span>
                                        <p className="mt-1 font-serif font-medium text-slate-800">
                                            {employee.position}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Tanggal Masuk
                                        </span>
                                        <p className="mt-1 font-serif font-medium text-slate-800">
                                            {employee.join_date}
                                        </p>
                                    </div>
                                    {employee.resign_date && (
                                        <div>
                                            <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                                Tanggal Keluar
                                            </span>
                                            <p className="mt-1 font-serif font-medium text-slate-800">
                                                {employee.resign_date}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Informasi Gaji */}
                        <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                            <CardHeader className="border-b border-[#CFC0A4]/20">
                                <CardTitle className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    Informasi Gaji
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Gaji Pokok
                                        </span>
                                        <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                            Rp{' '}
                                            {Number(
                                                employee.base_salary,
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Tipe Gaji
                                        </span>
                                        <p className="mt-1 font-serif font-medium text-slate-800">
                                            {employee.salary_type === 'monthly'
                                                ? 'Bulanan'
                                                : 'Harian'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={showDeleteConfirm}
                    onOpenChange={setShowDeleteConfirm}
                >
                    <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                                <AlertTriangle className="size-6 text-rose-600" />
                            </div>
                            <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[#4F6B6A]">
                                Hapus Karyawan
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {employee.user.name}
                                </span>
                                ? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="border border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="bg-rose-700 text-white hover:bg-rose-800"
                            >
                                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

EmployeesShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Karyawan', href: '/admin/employees' },
        { title: 'Detail', href: '#' },
    ],
};

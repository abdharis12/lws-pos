import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Coins, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeUser {
    id: number;
    name: string;
}

interface EmployeeData {
    id: number;
    user: EmployeeUser;
    position: string;
}

interface ComponentData {
    id: number;
    employee_id: number;
    base_salary: string;
    salary_type: string;
    meal_allowance: string;
    transport_allowance: string;
    overtime_rate_per_hour: string;
    employee: EmployeeData;
}

interface Props {
    components: ComponentData[];
    employees: EmployeeData[];
}

export default function SalaryComponents({ components, employees }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ComponentData | null>(null);

    const [deleteConfirm, setDeleteConfirm] = useState<ComponentData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: null as string | null,
        base_salary: '0',
        salary_type: 'monthly',
        meal_allowance: '0',
        transport_allowance: '0',
        overtime_rate_per_hour: '0',
    });

    function openCreate() {
        setEditing(null);
        setData('employee_id', null);
        reset();
        setOpen(true);
    }

    function openEdit(comp: ComponentData) {
        setEditing(comp);
        setData({
            employee_id: String(comp.employee_id),
            base_salary: String(comp.base_salary),
            salary_type: comp.salary_type,
            meal_allowance: String(comp.meal_allowance),
            transport_allowance: String(comp.transport_allowance),
            overtime_rate_per_hour: String(comp.overtime_rate_per_hour),
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/salary-components/${editing.id}`, {
                onSuccess: () => { setOpen(false); reset(); },
                preserveScroll: true,
            });
        } else {
            post('/admin/salary-components', {
                onSuccess: () => { setOpen(false); reset(); },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        const component = components.find((c) => c.id === id) ?? null;
        setDeleteConfirm(component);
    }

    function confirmDelete() {
        if (!deleteConfirm) return;
        destroy(`/admin/salary-components/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Komponen Gaji" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <Coins className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Komponen Gaji</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Komponen Gaji
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Atur gaji pokok, tunjangan, dan rate lembur per karyawan
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                            <Plus className="mr-2 size-4" /> Tambah Komponen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] shadow-xl">
                        <DialogHeader className="border-b border-[oklch(0.80_0.038_88.5)]/30 pb-4">
                            <DialogTitle className="font-serif text-xl font-semibold text-[oklch(0.48_0.032_195.5)]">
                                {editing ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Karyawan</Label>
                                <Select
                                    value={data.employee_id ?? undefined}
                                    onValueChange={(v) => setData('employee_id', v)}
                                    disabled={!!editing}
                                    defaultValue=""
                                >
                                    <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                        <SelectValue placeholder="-- Pilih Karyawan --" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                        {employees.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.user.name} — {e.position}
                                            </SelectItem>
                                        ))}
                                        {employees.length === 0 && (
                                            <SelectItem value="_none" disabled>Tidak ada data karyawan</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.employee_id} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Gaji Pokok (Rp)</Label>
                                    <Input type="number" min="0" step="1000" value={data.base_salary} onChange={(e) => setData('base_salary', e.target.value)} placeholder="0" className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                    <InputError message={errors.base_salary} />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Tipe Gaji</Label>
                                    <Select value={data.salary_type} onValueChange={(v) => setData('salary_type', v)}>
                                        <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                            <SelectItem value="monthly">Bulanan</SelectItem>
                                            <SelectItem value="daily">Harian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Tunjangan Makan (Rp)</Label>
                                    <Input type="number" min="0" step="1000" value={data.meal_allowance} onChange={(e) => setData('meal_allowance', e.target.value)} placeholder="0" className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Tunjangan Transport (Rp)</Label>
                                    <Input type="number" min="0" step="1000" value={data.transport_allowance} onChange={(e) => setData('transport_allowance', e.target.value)} placeholder="0" className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Rate Lembur per Jam (Rp)</Label>
                                <Input type="number" min="0" step="1000" value={data.overtime_rate_per_hour} onChange={(e) => setData('overtime_rate_per_hour', e.target.value)} placeholder="0" className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <div className="border-b border-[oklch(0.80_0.038_88.5)]/20 px-6 py-4">
                    <h2 className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">Komponen Gaji Karyawan</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                <th className="px-6 py-3.5 font-semibold">Tipe</th>
                                <th className="px-6 py-3.5 font-semibold">Gaji Pokok</th>
                                <th className="px-6 py-3.5 font-semibold">Tunjangan</th>
                                <th className="px-6 py-3.5 font-semibold">Rate Lembur</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                            {components.map((c) => (
                                <tr key={c.id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                    <td className="px-6 py-4">
                                        <span className="font-medium">{c.employee.user.name}</span>
                                        <p className="text-xs text-slate-500">{c.employee.position}</p>
                                    </td>
                                    <td className="px-6 py-4 capitalize">{c.salary_type === 'monthly' ? 'Bulanan' : 'Harian'}</td>
                                    <td className="px-6 py-4">Rp {Number(c.base_salary).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-600">Makan: Rp {Number(c.meal_allowance).toLocaleString('id-ID')}</span><br />
                                        <span className="text-slate-600">Transport: Rp {Number(c.transport_allowance).toLocaleString('id-ID')}</span>
                                    </td>
                                    <td className="px-6 py-4">Rp {Number(c.overtime_rate_per_hour).toLocaleString('id-ID')}/jam</td>
                                    <td className="flex justify-end gap-1 px-6 py-4">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.48_0.032_195.5)]/70 hover:text-white transition-colors">
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {components.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-sm italic text-slate-500">
                                        Belum ada komponen gaji.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                            <Trash2 className="size-6 text-rose-600" />
                        </div>
                        <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                            Hapus Komponen Gaji
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            Apakah Anda yakin ingin menghapus komponen gaji untuk <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{deleteConfirm?.employee.user.name}</span>? Tindakan ini tidak dapat dibatalkan.
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
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

SalaryComponents.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Komponen Gaji', href: '/admin/salary-components' },
    ],
};

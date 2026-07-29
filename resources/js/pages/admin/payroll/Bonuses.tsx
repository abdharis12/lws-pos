import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react';
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

interface EmployeeUser { id: number; name: string; }
interface EmployeeData { id: number; user: EmployeeUser; position: string; }
interface BonusData {
    id: number; employee_id: number; period: string; amount: string;
    reason: string; approved_by: number | null;
    employee: EmployeeData;
    approved_by_user?: { id: number; name: string; } | null;
}

interface Props { bonuses: BonusData[]; }

export default function Bonuses({ bonuses }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BonusData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<BonusData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '',
        period: '',
        amount: '',
        reason: '',
    });

    function openCreate() {
        setEditing(null);
        reset();
        setData('period', new Date().toISOString().slice(0, 7));
        setOpen(true);
    }

    function openEdit(b: BonusData) {
        setEditing(b);
        setData({ employee_id: String(b.employee_id), period: b.period, amount: String(b.amount), reason: b.reason });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/bonuses/${editing.id}`, {
                onSuccess: () => { setOpen(false); reset(); },
                preserveScroll: true,
            });
        } else {
            post('/admin/bonuses', {
                onSuccess: () => { setOpen(false); reset(); },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        const bonus = bonuses.find((b) => b.id === id) ?? null;
        setDeleteConfirm(bonus);
    }

    function confirmDelete() {
        if (!deleteConfirm) return;
        destroy(`/admin/bonuses/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Bonus" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <Gift className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Insentif Karyawan</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Bonus
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Input manual bonus per periode
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                            <Plus className="mr-2 size-4" /> Tambah Bonus
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] shadow-xl">
                        <DialogHeader className="border-b border-[oklch(0.80_0.038_88.5)]/30 pb-4">
                            <DialogTitle className="font-serif text-xl font-semibold text-[oklch(0.48_0.032_195.5)]">
                                {editing ? 'Edit Bonus' : 'Tambah Bonus'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Karyawan</Label>
                                <Select value={data.employee_id} onValueChange={(v) => setData('employee_id', v)} disabled={!!editing}>
                                    <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                        <SelectValue placeholder="Pilih karyawan" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                        {bonuses.map((b) => (
                                            <SelectItem key={b.employee.id} value={String(b.employee.id)}>{b.employee.user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.employee_id} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Periode</Label>
                                    <Input type="month" value={data.period} onChange={(e) => setData('period', e.target.value)} className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                    <InputError message={errors.period} />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Jumlah</Label>
                                    <Input type="number" min="0" value={data.amount} onChange={(e) => setData('amount', e.target.value)} className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                    <InputError message={errors.amount} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Alasan</Label>
                                <Input value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Mis: Bonus kinerja bulan ini" className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                <InputError message={errors.reason} />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                                {editing ? 'Simpan' : 'Tambah Bonus'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <div className="border-b border-[oklch(0.80_0.038_88.5)]/20 px-6 py-4">
                    <h2 className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">Riwayat Bonus</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                <th className="px-6 py-3.5 font-semibold">Periode</th>
                                <th className="px-6 py-3.5 font-semibold">Jumlah</th>
                                <th className="px-6 py-3.5 font-semibold">Alasan</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                            {bonuses.map((b) => (
                                <tr key={b.id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                    <td className="px-6 py-4 font-medium">{b.employee.user.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)]/10 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.48_0.032_195.5)]">
                                            {b.period}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold">Rp {Number(b.amount).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 text-slate-500">{b.reason}</td>
                                    <td className="flex justify-end gap-1 px-6 py-4">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.48_0.032_195.5)]/70 hover:text-white transition-colors">
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {bonuses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-sm italic text-slate-500">
                                        Belum ada bonus.
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
                            Hapus Bonus
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            Apakah Anda yakin ingin menghapus bonus untuk <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{deleteConfirm?.employee.user.name}</span> pada periode <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{deleteConfirm?.period}</span>? Tindakan ini tidak dapat dibatalkan.
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

Bonuses.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bonus', href: '/admin/bonuses' },
    ],
};

import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Clock, Coins, Gift, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { CurrencyInput } from '@/components/currency-input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EmployeeUser {
    id: number;
    name: string;
}
interface EmployeeData {
    id: number;
    user: EmployeeUser;
    position: string;
}
interface BonusData {
    id: number;
    employee_id: number;
    period: string;
    amount: string;
    reason: string;
    approved_by: number | null;
    employee: EmployeeData;
    approved_by_user?: { id: number; name: string } | null;
}

interface Props {
    bonuses: BonusData[];
    employees: EmployeeData[];
}

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

export default function Bonuses({ bonuses, employees }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<BonusData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<BonusData | null>(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
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
        setData({
            employee_id: String(b.employee_id),
            period: b.period,
            amount: String(b.amount),
            reason: b.reason,
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/bonuses/${editing.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        } else {
            post('/admin/bonuses', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        const bonus = bonuses.find((b) => b.id === id) ?? null;
        setDeleteConfirm(bonus);
    }

    function confirmDelete() {
        if (!deleteConfirm) {
return;
}

        destroy(`/admin/bonuses/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Bonus" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Gift className="size-3.5 text-[#4F6B6A]" />
                            <span>Insentif Karyawan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Bonus
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Input manual bonus per periode
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={openCreate}
                                className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                            >
                                <Plus className="mr-2 size-4" />
                                Bonus
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl border-[#CFC0A4]/50 bg-[#F6F2E9] shadow-xl">
                            <DialogHeader className="border-b border-[#CFC0A4]/30 pb-4">
                                <DialogTitle className="font-serif text-xl font-semibold text-[#4F6B6A]">
                                    {editing ? 'Edit Bonus' : 'Tambah Bonus'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Karyawan
                                    </Label>
                                    <Select
                                        value={data.employee_id}
                                        onValueChange={(v) =>
                                            setData('employee_id', v)
                                        }
                                        disabled={!!editing}
                                    >
                                        <SelectTrigger className="border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                            <SelectValue placeholder="-- Pilih karyawan --" />
                                        </SelectTrigger>
                                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                            {employees.map((e) => (
                                                <SelectItem
                                                    key={e.id}
                                                    value={String(e.id)}
                                                >
                                                    {e.user.name} — {e.position}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.employee_id} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Periode
                                        </Label>
                                        <Input
                                            type="month"
                                            value={data.period}
                                            onChange={(e) =>
                                                setData(
                                                    'period',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                        <InputError message={errors.period} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Jumlah
                                        </Label>
                                        <CurrencyInput
                                            value={data.amount}
                                            onChange={(v) =>
                                                setData('amount', v)
                                            }
                                            className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                        <InputError message={errors.amount} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Alasan
                                    </Label>
                                    <Input
                                        value={data.reason}
                                        onChange={(e) =>
                                            setData('reason', e.target.value)
                                        }
                                        placeholder="Mis: Bonus kinerja bulan ini"
                                        className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                    <InputError message={errors.reason} />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                                >
                                    {editing ? 'Simpan' : 'Tambah Bonus'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                <Coins className="size-5 text-[#CFC0A4]" />
                                Bonus Karyawan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                            <th className="px-6 py-3.5 font-semibold">
                                                Karyawan
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Periode
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Jumlah
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Alasan
                                            </th>
                                            <th className="px-6 py-3.5 text-right font-semibold">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#CFC0A4]/15">
                                        {bonuses.map((b) => (
                                            <tr
                                                key={b.id}
                                                className="transition-colors hover:bg-[#CFC0A4]/5"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    {b.employee.user.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="rounded-full border border-[#CFC0A4]/30 bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-medium text-[#4F6B6A]">
                                                        {b.period}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    Rp{' '}
                                                    {Number(b.amount).toLocaleString(
                                                        'id-ID',
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {b.reason}
                                                </td>
                                                <td className="flex justify-end gap-1 px-6 py-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(b)}
                                                        className="bg-[#4F6B6A] text-white transition-colors hover:bg-[#4F6B6A]/70 hover:text-white"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDelete(b.id)
                                                        }
                                                        className="bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {bonuses.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-12 text-center text-sm text-slate-500 italic"
                                                >
                                                    <div className="flex flex-col items-center px-6 py-12 text-center">
                                                        <div
                                                            className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                                            style={{
                                                                backgroundColor:
                                                                    INK_LIGHT,
                                                            }}
                                                        >
                                                            <Clock
                                                                className="size-8"
                                                                style={{ color: INK }}
                                                            />
                                                        </div>
                                                        <h2
                                                            className="font-serif text-xl font-bold"
                                                            style={{ color: INK }}
                                                        >
                                                            Belum Ada Bonus
                                                        </h2>
                                                        <p
                                                            className="mt-1 max-w-sm text-sm"
                                                            style={{
                                                                color: 'oklch(0.60 0.03 88.5)',
                                                            }}
                                                        >
                                                            Bonus karyawan belum
                                                            ditambahkan.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={!!deleteConfirm}
                    onOpenChange={(open) => !open && setDeleteConfirm(null)}
                >
                    <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                                <Trash2 className="size-6 text-rose-600" />
                            </div>
                            <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[#4F6B6A]">
                                Hapus Bonus
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus bonus untuk{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {deleteConfirm?.employee.user.name}
                                </span>{' '}
                                pada periode{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {deleteConfirm?.period}
                                </span>
                                ? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteConfirm(null)}
                                className="border border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
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
        </div>
    );
}

Bonuses.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bonus', href: '/admin/bonuses' },
    ],
};

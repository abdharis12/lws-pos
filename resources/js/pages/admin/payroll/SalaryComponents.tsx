import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Clock, Coins, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CurrencyInput } from '@/components/currency-input';
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

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

export default function SalaryComponents({ components, employees }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ComponentData | null>(null);

    const [deleteConfirm, setDeleteConfirm] = useState<ComponentData | null>(
        null,
    );

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
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        } else {
            post('/admin/salary-components', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        const component = components.find((c) => c.id === id) ?? null;
        setDeleteConfirm(component);
    }

    function confirmDelete() {
        if (!deleteConfirm) {
return;
}

        destroy(`/admin/salary-components/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Komponen Gaji" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Coins className="size-3.5 text-[#4F6B6A]" />
                            <span>Komponen Gaji</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Komponen Gaji
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Atur gaji pokok, tunjangan, dan rate lembur per
                            karyawan
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={openCreate}
                                className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                            >
                                <Plus className="mr-2 size-4" /> Komponen
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl border-[#CFC0A4]/50 bg-[#F6F2E9] shadow-xl">
                            <DialogHeader className="border-b border-[#CFC0A4]/30 pb-4">
                                <DialogTitle className="font-serif text-xl font-semibold text-[#4F6B6A]">
                                    {editing
                                        ? 'Edit Komponen Gaji'
                                        : 'Tambah Komponen Gaji'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Karyawan
                                    </Label>
                                    <Select
                                        value={data.employee_id ?? undefined}
                                        onValueChange={(v) =>
                                            setData('employee_id', v)
                                        }
                                        disabled={!!editing}
                                        defaultValue=""
                                    >
                                        <SelectTrigger className="border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                            <SelectValue placeholder="-- Pilih Karyawan --" />
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
                                            {employees.length === 0 && (
                                                <SelectItem
                                                    value="_none"
                                                    disabled
                                                >
                                                    Tidak ada data karyawan
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.employee_id} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Gaji Pokok (Rp)
                                        </Label>
                                        <CurrencyInput
                                            value={data.base_salary}
                                            onChange={(v) =>
                                                setData('base_salary', v)
                                            }
                                            placeholder="0"
                                            className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                        <InputError
                                            message={errors.base_salary}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Tipe Gaji
                                        </Label>
                                        <Select
                                            value={data.salary_type}
                                            onValueChange={(v) =>
                                                setData('salary_type', v)
                                            }
                                        >
                                            <SelectTrigger className="border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                                <SelectItem value="monthly">
                                                    Bulanan
                                                </SelectItem>
                                                <SelectItem value="daily">
                                                    Harian
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Tunjangan Makan (Rp)
                                        </Label>
                                        <CurrencyInput
                                            value={data.meal_allowance}
                                            onChange={(v) =>
                                                setData('meal_allowance', v)
                                            }
                                            placeholder="0"
                                            className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Tunjangan Transport (Rp)
                                        </Label>
                                        <CurrencyInput
                                            value={data.transport_allowance}
                                            onChange={(v) =>
                                                setData(
                                                    'transport_allowance',
                                                    v,
                                                )
                                            }
                                            placeholder="0"
                                            className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Rate Lembur per Jam (Rp)
                                    </Label>
                                    <CurrencyInput
                                        value={data.overtime_rate_per_hour}
                                        onChange={(v) =>
                                            setData('overtime_rate_per_hour', v)
                                        }
                                        placeholder="0"
                                        className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                                >
                                    {editing ? 'Simpan Perubahan' : 'Simpan'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <div className="border-b border-[#CFC0A4]/20 px-6 py-4">
                        <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                            Komponen Gaji Karyawan
                        </h2>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                    <th className="px-6 py-3.5 font-semibold">
                                        Karyawan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Tipe
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Gaji Pokok
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Tunjangan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Rate Lembur
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#CFC0A4]/15">
                                {components.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium">
                                                {c.employee.user.name}
                                            </span>
                                            <p className="text-xs text-slate-500">
                                                {c.employee.position}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 capitalize">
                                            {c.salary_type === 'monthly'
                                                ? 'Bulanan'
                                                : 'Harian'}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                c.base_salary,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600">
                                                Makan: Rp{' '}
                                                {Number(
                                                    c.meal_allowance,
                                                ).toLocaleString('id-ID')}
                                            </span>
                                            <br />
                                            <span className="text-slate-600">
                                                Transport: Rp{' '}
                                                {Number(
                                                    c.transport_allowance,
                                                ).toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                c.overtime_rate_per_hour,
                                            ).toLocaleString('id-ID')}
                                            /jam
                                        </td>
                                        <td className="flex justify-end gap-1 px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(c)}
                                                className="bg-[#4F6B6A] text-white transition-colors hover:bg-[#4F6B6A]/70 hover:text-white"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDelete(c.id)
                                                }
                                                className="bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {components.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
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
                                                    Belum Ada Komponen Gaji
                                                </h2>
                                                <p
                                                    className="mt-1 max-w-sm text-sm"
                                                    style={{
                                                        color: 'oklch(0.60 0.03 88.5)',
                                                    }}
                                                >
                                                    Komponen gaji karyawan belum
                                                    ditambahkan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                                Hapus Komponen Gaji
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus komponen gaji
                                untuk{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {deleteConfirm?.employee.user.name}
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

SalaryComponents.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Komponen Gaji', href: '/admin/salary-components' },
    ],
};

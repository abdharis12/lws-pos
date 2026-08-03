import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    Pencil,
    Plus,
    Trash2,
    Clock,
} from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ThrData {
    id: number;
    calculation_type: string;
    value: string;
    is_active: boolean;
    notes: string | null;
}

interface Props {
    thrSettings: ThrData[];
}

const typeLabels: Record<string, string> = {
    flat: 'Nominal Flat',
    percentage: 'Persentase Gaji',
    tenure_ratio: 'Rasio Masa Kerja',
};

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

export default function PayrollSettings({ thrSettings }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ThrData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ThrData | null>(null);

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
        calculation_type: 'flat',
        value: '',
        notes: '',
    });

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(t: ThrData) {
        setEditing(t);
        setData({
            calculation_type: t.calculation_type,
            value: String(t.value),
            notes: t.notes ?? '',
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/payroll/thr/${editing.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        } else {
            post('/admin/payroll/thr', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        const thr = thrSettings.find((t) => t.id === id) ?? null;
        setDeleteConfirm(thr);
    }

    function confirmDelete() {
        if (!deleteConfirm) {
return;
}

        destroy(`/admin/payroll/thr/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Pengaturan Payroll" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <SettingsIcon className="size-3.5 text-[#4F6B6A]" />
                            <span>Konfigurasi THR</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Pengaturan Payroll
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Konfigurasi THR
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={openCreate}
                                className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                            >
                                <Plus className="mr-2 size-4" />
                                Pengaturan THR
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl border-[#CFC0A4]/50 bg-[#F6F2E9] shadow-xl">
                            <DialogHeader className="border-b border-[#CFC0A4]/30 pb-4">
                                <DialogTitle className="font-serif text-xl font-semibold text-[#4F6B6A]">
                                    {editing
                                        ? 'Edit THR'
                                        : 'Tambah Pengaturan THR'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Tipe Perhitungan
                                    </Label>
                                    <Select
                                        value={data.calculation_type}
                                        onValueChange={(v) =>
                                            setData('calculation_type', v)
                                        }
                                    >
                                        <SelectTrigger className="border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                            {Object.entries(typeLabels).map(
                                                ([k, v]) => (
                                                    <SelectItem
                                                        key={k}
                                                        value={k}
                                                    >
                                                        {v}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.calculation_type}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Nilai
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.value}
                                        onChange={(e) =>
                                            setData('value', e.target.value)
                                        }
                                        className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                    <p className="text-xs text-slate-500">
                                        {data.calculation_type === 'flat'
                                            ? 'Nominal dalam Rupiah'
                                            : data.calculation_type ===
                                                'percentage'
                                              ? 'Persentase dari gaji pokok (contoh: 100 untuk 100%)'
                                              : 'Nilai per tahun masa kerja (dalam Rupiah)'}
                                    </p>
                                    <InputError message={errors.value} />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Catatan
                                    </Label>
                                    <Input
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        placeholder="Opsional"
                                        className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                                >
                                    {editing ? 'Simpan' : 'Tambah'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <div className="border-b border-[#CFC0A4]/20 px-6 py-4">
                        <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                            Pengaturan THR
                        </h2>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                    <th className="px-6 py-3.5 font-semibold">
                                        Tipe
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Nilai
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Catatan
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#CFC0A4]/15">
                                {thrSettings.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <td className="px-6 py-4">
                                            {typeLabels[t.calculation_type] ??
                                                t.calculation_type}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {t.calculation_type === 'percentage'
                                                ? `${t.value}%`
                                                : `Rp ${Number(t.value).toLocaleString('id-ID')}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.is_active ? (
                                                <span className="rounded-full border border-[#CFC0A4]/30 bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-medium text-[#4F6B6A]">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {t.notes ?? '-'}
                                        </td>
                                        <td className="flex justify-end gap-1 px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEdit(t)}
                                                className="bg-[#4F6B6A] text-white transition-colors hover:bg-[#4F6B6A]/70 hover:text-white"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDelete(t.id)
                                                }
                                                className="bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {thrSettings.length === 0 && (
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
                                                    Belum Ada THR
                                                </h2>
                                                <p
                                                    className="mt-1 max-w-sm text-sm"
                                                    style={{
                                                        color: 'oklch(0.60 0.03 88.5)',
                                                    }}
                                                >
                                                    Belum ada THR yang diatur.
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
                                Hapus Pengaturan THR
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus pengaturan
                                THR? Tindakan ini tidak dapat dibatalkan.
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

PayrollSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Payroll', href: '/admin/payroll/settings' },
    ],
};

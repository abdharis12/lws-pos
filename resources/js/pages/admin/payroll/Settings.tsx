import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Settings as SettingsIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ThrData {
    id: number; calculation_type: string; value: string;
    is_active: boolean; notes: string | null;
}

interface Props { thrSettings: ThrData[]; }

const typeLabels: Record<string, string> = { flat: 'Nominal Flat', percentage: 'Persentase Gaji', tenure_ratio: 'Rasio Masa Kerja' };

export default function PayrollSettings({ thrSettings }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ThrData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        calculation_type: 'flat', value: '', notes: '',
    });

    function openCreate() {
        setEditing(null); reset(); setOpen(true);
    }

    function openEdit(t: ThrData) {
        setEditing(t);
        setData({ calculation_type: t.calculation_type, value: String(t.value), notes: t.notes ?? '' });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/payroll/thr/${editing.id}`, {
                onSuccess: () => { setOpen(false); reset(); },
                preserveScroll: true,
            });
        } else {
            post('/admin/payroll/thr', {
                onSuccess: () => { setOpen(false); reset(); },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus pengaturan THR ini?')) {
            destroy(`/admin/payroll/thr/${id}`);
        }
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Pengaturan Payroll" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <SettingsIcon className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Konfigurasi THR</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Pengaturan Payroll
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Konfigurasi THR
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                            <Plus className="mr-2 size-4" /> Tambah Pengaturan THR
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] shadow-xl">
                        <DialogHeader className="border-b border-[oklch(0.80_0.038_88.5)]/30 pb-4">
                            <DialogTitle className="font-serif text-xl font-semibold text-[oklch(0.48_0.032_195.5)]">
                                {editing ? 'Edit THR' : 'Tambah Pengaturan THR'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Tipe Perhitungan</Label>
                                <Select value={data.calculation_type} onValueChange={(v) => setData('calculation_type', v)}>
                                    <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                        {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.calculation_type} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Nilai</Label>
                                <Input type="number" min="0" step="0.01" value={data.value} onChange={(e) => setData('value', e.target.value)} className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                                <p className="text-xs text-slate-500">
                                    {data.calculation_type === 'flat' ? 'Nominal dalam Rupiah' :
                                     data.calculation_type === 'percentage' ? 'Persentase dari gaji pokok (contoh: 100 untuk 100%)' :
                                     'Nilai per tahun masa kerja (dalam Rupiah)'}
                                </p>
                                <InputError message={errors.value} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">Catatan</Label>
                                <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Opsional" className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]" />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                                {editing ? 'Simpan' : 'Tambah'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <div className="border-b border-[oklch(0.80_0.038_88.5)]/20 px-6 py-4">
                    <h2 className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">Pengaturan THR</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                <th className="px-6 py-3.5 font-semibold">Tipe</th>
                                <th className="px-6 py-3.5 font-semibold">Nilai</th>
                                <th className="px-6 py-3.5 font-semibold">Status</th>
                                <th className="px-6 py-3.5 font-semibold">Catatan</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                            {thrSettings.map((t) => (
                                <tr key={t.id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                    <td className="px-6 py-4">{typeLabels[t.calculation_type] ?? t.calculation_type}</td>
                                    <td className="px-6 py-4 font-medium">
                                        {t.calculation_type === 'percentage' ? `${t.value}%` : `Rp ${Number(t.value).toLocaleString('id-ID')}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.is_active ? (
                                            <span className="rounded-full border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)]/10 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.48_0.032_195.5)]">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{t.notes ?? '-'}</td>
                                    <td className="flex justify-end gap-1 px-6 py-4">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.48_0.032_195.5)]/70 hover:text-white transition-colors">
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {thrSettings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-sm italic text-slate-500">
                                        Belum ada pengaturan THR.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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

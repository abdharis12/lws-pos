import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
                onSuccess: () => {
 setOpen(false); reset(); 
}, preserveScroll: true,
            });
        } else {
            post('/admin/payroll/thr', {
                onSuccess: () => {
 setOpen(false); reset(); 
}, preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus pengaturan THR ini?')) {
destroy(`/admin/payroll/thr/${id}`);
}
    }

    return (
        <>
            <Head title="Pengaturan Payroll" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Pengaturan Payroll</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Konfigurasi THR</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}><Plus className="mr-2 size-4" /> Tambah Pengaturan THR</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader><DialogTitle>{editing ? 'Edit THR' : 'Tambah Pengaturan THR'}</DialogTitle></DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Tipe Perhitungan</Label>
                                <Select value={data.calculation_type} onValueChange={(v) => setData('calculation_type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.calculation_type} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Nilai</Label>
                                <Input type="number" min="0" step="0.01" value={data.value} onChange={(e) => setData('value', e.target.value)} />
                                <p className="text-xs text-muted-foreground">
                                    {data.calculation_type === 'flat' ? 'Nominal dalam Rupiah' :
                                     data.calculation_type === 'percentage' ? 'Persentase dari gaji pokok (contoh: 100 untuk 100%)' :
                                     'Nilai per tahun masa kerja (dalam Rupiah)'}
                                </p>
                                <InputError message={errors.value} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Catatan</Label>
                                <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Opsional" />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">{editing ? 'Simpan' : 'Tambah'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Pengaturan THR</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Tipe</th>
                                <th className="px-6 py-3 font-medium">Nilai</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Catatan</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thrSettings.map((t) => (
                                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3">{typeLabels[t.calculation_type] ?? t.calculation_type}</td>
                                    <td className="px-6 py-3 font-medium">
                                        {t.calculation_type === 'percentage' ? `${t.value}%` : `Rp ${Number(t.value).toLocaleString('id-ID')}`}
                                    </td>
                                    <td className="px-6 py-3">
                                        <Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                                    </td>
                                    <td className="px-6 py-3 text-muted-foreground">{t.notes ?? '-'}</td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="size-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="size-4 text-destructive" /></Button>
                                    </td>
                                </tr>
                            ))}
                            {thrSettings.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Belum ada pengaturan THR.</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

PayrollSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Payroll', href: '/admin/payroll/settings' },
    ],
};

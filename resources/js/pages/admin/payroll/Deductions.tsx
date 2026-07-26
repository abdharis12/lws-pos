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

interface EmployeeUser { id: number; name: string; }
interface EmployeeData { id: number; user: EmployeeUser; }
interface DeductionData {
    id: number; employee_id: number; period: string; type: string;
    amount: string; notes: string | null;
    employee: EmployeeData;
}

interface Props { deductions: DeductionData[]; }

const typeLabels: Record<string, string> = { late: 'Keterlambatan', loan: 'Kasbon/Pinjaman', other: 'Lainnya' };

export default function Deductions({ deductions }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<DeductionData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '', period: '', type: 'late', amount: '', notes: '',
    });

    function openCreate() {
        setEditing(null);
        reset();
        setData('period', new Date().toISOString().slice(0, 7));
        setOpen(true);
    }

    function openEdit(d: DeductionData) {
        setEditing(d);
        setData({ employee_id: String(d.employee_id), period: d.period, type: d.type, amount: String(d.amount), notes: d.notes ?? '' });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/deductions/${editing.id}`, {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        } else {
            post('/admin/deductions', {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus potongan ini?')) {
destroy(`/admin/deductions/${id}`);
}
    }

    return (
        <>
            <Head title="Potongan" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Potongan</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Potongan gaji: keterlambatan, kasbon, dll.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}><Plus className="mr-2 size-4" /> Tambah Potongan</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader><DialogTitle>{editing ? 'Edit Potongan' : 'Tambah Potongan'}</DialogTitle></DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Karyawan</Label>
                                <Select value={data.employee_id} onValueChange={(v) => setData('employee_id', v)} disabled={!!editing}>
                                    <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                                    <SelectContent>
                                        {deductions.map((d) => (
                                            <SelectItem key={d.id} value={String(d.employee_id)}>{d.employee.user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.employee_id} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Periode</Label>
                                    <Input type="month" value={data.period} onChange={(e) => setData('period', e.target.value)} />
                                    <InputError message={errors.period} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tipe</Label>
                                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(typeLabels).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Jumlah</Label>
                                <Input type="number" min="0" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                                <InputError message={errors.amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Catatan</Label>
                                <Input value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Opsional" />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">{editing ? 'Simpan' : 'Tambah Potongan'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Riwayat Potongan</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Karyawan</th>
                                <th className="px-6 py-3 font-medium">Periode</th>
                                <th className="px-6 py-3 font-medium">Tipe</th>
                                <th className="px-6 py-3 font-medium">Jumlah</th>
                                <th className="px-6 py-3 font-medium">Catatan</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deductions.map((d) => (
                                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3 font-medium">{d.employee.user.name}</td>
                                    <td className="px-6 py-3"><Badge variant="outline">{d.period}</Badge></td>
                                    <td className="px-6 py-3">{typeLabels[d.type] ?? d.type}</td>
                                    <td className="px-6 py-3 font-semibold text-destructive">(Rp {Number(d.amount).toLocaleString('id-ID')})</td>
                                    <td className="px-6 py-3 text-muted-foreground">{d.notes ?? '-'}</td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="size-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="size-4 text-destructive" /></Button>
                                    </td>
                                </tr>
                            ))}
                            {deductions.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Belum ada potongan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

Deductions.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Potongan', href: '/admin/deductions' },
    ],
};

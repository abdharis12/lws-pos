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
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        } else {
            post('/admin/bonuses', {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus bonus ini?')) {
destroy(`/admin/bonuses/${id}`);
}
    }

    return (
        <>
            <Head title="Bonus" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Bonus</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Input manual bonus per periode</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}><Plus className="mr-2 size-4" /> Tambah Bonus</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader><DialogTitle>{editing ? 'Edit Bonus' : 'Tambah Bonus'}</DialogTitle></DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Karyawan</Label>
                                <Select value={data.employee_id} onValueChange={(v) => setData('employee_id', v)} disabled={!!editing}>
                                    <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
                                    <SelectContent>
                                        {bonuses.map((b) => (
                                            <SelectItem key={b.employee.id} value={String(b.employee.id)}>{b.employee.user.name}</SelectItem>
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
                                    <Label>Jumlah</Label>
                                    <Input type="number" min="0" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                                    <InputError message={errors.amount} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Alasan</Label>
                                <Input value={data.reason} onChange={(e) => setData('reason', e.target.value)} placeholder="Mis: Bonus kinerja bulan ini" />
                                <InputError message={errors.reason} />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">{editing ? 'Simpan' : 'Tambah Bonus'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Riwayat Bonus</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Karyawan</th>
                                <th className="px-6 py-3 font-medium">Periode</th>
                                <th className="px-6 py-3 font-medium">Jumlah</th>
                                <th className="px-6 py-3 font-medium">Alasan</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bonuses.map((b) => (
                                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3 font-medium">{b.employee.user.name}</td>
                                    <td className="px-6 py-3"><Badge variant="outline">{b.period}</Badge></td>
                                    <td className="px-6 py-3 font-semibold">Rp {Number(b.amount).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{b.reason}</td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="size-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="size-4 text-destructive" /></Button>
                                    </td>
                                </tr>
                            ))}
                            {bonuses.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Belum ada bonus.</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

Bonuses.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bonus', href: '/admin/bonuses' },
    ],
};

import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
}

export default function SalaryComponents({ components }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ComponentData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '',
        base_salary: '',
        salary_type: 'monthly',
        meal_allowance: '0',
        transport_allowance: '0',
        overtime_rate_per_hour: '0',
    });

    function openCreate() {
        setEditing(null);
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
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        } else {
            post('/admin/salary-components', {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus komponen gaji ini?')) {
            destroy(`/admin/salary-components/${id}`);
        }
    }

    return (
        <>
            <Head title="Komponen Gaji" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Komponen Gaji</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Atur gaji pokok, tunjangan, dan rate lembur per karyawan</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" /> Tambah Komponen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Karyawan</Label>
                                <Select
                                    value={data.employee_id}
                                    onValueChange={(v) => setData('employee_id', v)}
                                    disabled={!!editing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih karyawan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {components.map((c) => (
                                            <SelectItem key={c.employee.id} value={String(c.employee.id)}>
                                                {c.employee.user.name} — {c.employee.position}
                                            </SelectItem>
                                        ))}
                                        {components.length === 0 && (
                                            <SelectItem value="_none" disabled>Tidak ada data karyawan</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.employee_id} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Gaji Pokok</Label>
                                    <Input type="number" min="0" value={data.base_salary} onChange={(e) => setData('base_salary', e.target.value)} />
                                    <InputError message={errors.base_salary} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tipe Gaji</Label>
                                    <Select value={data.salary_type} onValueChange={(v) => setData('salary_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Bulanan</SelectItem>
                                            <SelectItem value="daily">Harian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Tunjangan Makan</Label>
                                    <Input type="number" min="0" value={data.meal_allowance} onChange={(e) => setData('meal_allowance', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tunjangan Transport</Label>
                                    <Input type="number" min="0" value={data.transport_allowance} onChange={(e) => setData('transport_allowance', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Rate Lembur (per jam)</Label>
                                <Input type="number" min="0" value={data.overtime_rate_per_hour} onChange={(e) => setData('overtime_rate_per_hour', e.target.value)} />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Komponen Gaji Karyawan</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Karyawan</th>
                                <th className="px-6 py-3 font-medium">Tipe</th>
                                <th className="px-6 py-3 font-medium">Gaji Pokok</th>
                                <th className="px-6 py-3 font-medium">Tunjangan</th>
                                <th className="px-6 py-3 font-medium">Rate Lembur</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {components.map((c) => (
                                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3">
                                        <span className="font-medium">{c.employee.user.name}</span>
                                        <p className="text-xs text-muted-foreground">{c.employee.position}</p>
                                    </td>
                                    <td className="px-6 py-3 capitalize">{c.salary_type === 'monthly' ? 'Bulanan' : 'Harian'}</td>
                                    <td className="px-6 py-3">Rp {Number(c.base_salary).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3">
                                        Makan: Rp {Number(c.meal_allowance).toLocaleString('id-ID')}<br />
                                        Transport: Rp {Number(c.transport_allowance).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-3">Rp {Number(c.overtime_rate_per_hour).toLocaleString('id-ID')}/jam</td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {components.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Belum ada komponen gaji.</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

SalaryComponents.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Komponen Gaji', href: '/admin/salary-components' },
    ],
};

import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
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

interface UserData {
    id: number;
    name: string;
    email: string;
}

interface EmployeeData {
    id: number;
    user_id: number;
    phone: string | null;
    position: string;
    join_date: string;
    base_salary: string | number;
    salary_type: string;
    is_active: boolean;
    user: UserData;
}

interface Props {
    employees: EmployeeData[];
    roles: string[];
}

export default function EmployeesIndex({ employees, roles }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<EmployeeData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        position: '',
        role: '',
        join_date: '',
        base_salary: '',
        salary_type: 'monthly',
        is_active: true,
    });

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(emp: EmployeeData) {
        setEditing(emp);
        setData({
            name: emp.user.name,
            email: emp.user.email,
            password: '',
            phone: emp.phone ?? '',
            position: emp.position,
            role: '',
            join_date: emp.join_date,
            base_salary: String(emp.base_salary),
            salary_type: emp.salary_type,
            is_active: emp.is_active,
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/employees/${editing.id}`, {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        } else {
            post('/admin/employees', {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus karyawan ini?')) {
            destroy(`/admin/employees/${id}`);
        }
    }

    return (
        <>
            <Head title="Karyawan" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Karyawan</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Kelola data karyawan</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Tambah Karyawan
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} />
                            </div>
                            {!editing && (
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="phone">No. Telepon</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                                <InputError message={errors.phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="position">Posisi</Label>
                                <Input
                                    id="position"
                                    value={data.position}
                                    onChange={(e) => setData('position', e.target.value)}
                                />
                                <InputError message={errors.position} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(v) => setData('role', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.role} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="join_date">Tanggal Masuk</Label>
                                <Input
                                    id="join_date"
                                    type="date"
                                    value={data.join_date}
                                    onChange={(e) => setData('join_date', e.target.value)}
                                />
                                <InputError message={errors.join_date} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="base_salary">Gaji Pokok</Label>
                                    <Input
                                        id="base_salary"
                                        type="number"
                                        min="0"
                                        value={data.base_salary}
                                        onChange={(e) => setData('base_salary', e.target.value)}
                                    />
                                    <InputError message={errors.base_salary} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="salary_type">Tipe Gaji</Label>
                                    <Select
                                        value={data.salary_type}
                                        onValueChange={(v) => setData('salary_type', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Bulanan</SelectItem>
                                            <SelectItem value="daily">Harian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.salary_type} />
                                </div>
                            </div>
                            {editing && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        className="size-4 rounded border"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                    <Label htmlFor="is_active">Aktif</Label>
                                </div>
                            )}
                            <Button type="submit" disabled={processing} className="w-full">
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Semua Karyawan</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Nama</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Posisi</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                                {emp.user.name.charAt(0)}
                                            </div>
                                            <span className="font-medium">{emp.user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-muted-foreground">{emp.user.email}</td>
                                    <td className="px-6 py-3">{emp.position}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant={emp.is_active ? 'default' : 'secondary'}>
                                            {emp.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <Link href={`/admin/employees/${emp.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="size-4" />
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        Belum ada karyawan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Karyawan', href: '/admin/employees' },
    ],
};

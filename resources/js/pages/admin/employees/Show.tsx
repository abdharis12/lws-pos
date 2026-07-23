import { Head, Link } from '@inertiajs/react';
import { Pencil, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    resign_date: string | null;
    base_salary: string | number;
    salary_type: string;
    is_active: boolean;
    user: UserData;
}

interface Props {
    employee: EmployeeData;
}

export default function EmployeesShow({ employee }: Props) {
    return (
        <>
            <Head title={employee.user.name} />

            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/employees">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="size-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{employee.user.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Detail karyawan</p>
                </div>
                <Link href={`/admin/employees/${employee.id}`}>
                    <Button>
                        <Pencil className="mr-2 size-4" />
                        Edit Karyawan
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="flex flex-col items-center pt-6">
                            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
                                {employee.user.name.charAt(0)}
                            </div>
                            <h3 className="text-lg font-semibold">{employee.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{employee.position}</p>
                            <div className="mt-3">
                                <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                                    {employee.is_active ? 'Aktif' : 'Tidak Aktif'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pribadi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <p className="font-medium">{employee.user.email}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Telepon</span>
                                    <p className="font-medium">{employee.phone || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Posisi</span>
                                    <p className="font-medium">{employee.position}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Tanggal Masuk</span>
                                    <p className="font-medium">{employee.join_date}</p>
                                </div>
                                {employee.resign_date && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">Tanggal Keluar</span>
                                        <p className="font-medium">{employee.resign_date}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Gaji</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Gaji Pokok</span>
                                    <p className="text-lg font-semibold">
                                        Rp {Number(employee.base_salary).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Tipe Gaji</span>
                                    <p className="font-medium capitalize">
                                        {employee.salary_type === 'monthly' ? 'Bulanan' : 'Harian'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

EmployeesShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Karyawan', href: '/admin/employees' },
        { title: 'Detail', href: '#' },
    ],
};

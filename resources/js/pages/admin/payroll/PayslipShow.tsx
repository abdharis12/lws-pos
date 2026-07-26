import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UserData { id: number; name: string; }
interface EmployeeData { id: number; user: UserData; position: string; }
interface PayslipData {
    id: number; employee_id: number; period: string;
    base_salary: string; allowances_total: string; bonus_total: string;
    overtime_total: string; deduction_total: string; take_home_pay: string;
    status: string; paid_at: string | null; paid_method: string | null;
    employee: EmployeeData;
}

interface Props { payslip: PayslipData; }

const statusLabels: Record<string, string> = { draft: 'Draft', approved: 'Disetujui', paid: 'Dibayar' };

export default function PayslipShow({ payslip }: Props) {
    const items = [
        { label: 'Gaji Pokok', value: `Rp ${Number(payslip.base_salary).toLocaleString('id-ID')}` },
        { label: 'Tunjangan', value: `Rp ${Number(payslip.allowances_total).toLocaleString('id-ID')}` },
        { label: 'Bonus', value: `Rp ${Number(payslip.bonus_total).toLocaleString('id-ID')}` },
        { label: 'Lembur', value: `Rp ${Number(payslip.overtime_total).toLocaleString('id-ID')}` },
        { label: 'Potongan', value: `(Rp ${Number(payslip.deduction_total).toLocaleString('id-ID')})`, negative: true },
    ];

    return (
        <>
            <Head title="Detail Slip Gaji" />
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/payslips">
                    <Button variant="ghost" size="icon"><ArrowLeft className="size-5" /></Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">Slip Gaji — {payslip.employee.user.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Periode {payslip.period}</p>
                </div>
                <a href={`/payslips/${payslip.id}/pdf`} target="_blank">
                    <Button><Download className="mr-2 size-4" /> PDF</Button>
                </a>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardContent className="flex flex-col items-center pt-6">
                            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
                                {payslip.employee.user.name.charAt(0)}
                            </div>
                            <h3 className="text-lg font-semibold">{payslip.employee.user.name}</h3>
                            <p className="text-sm text-muted-foreground">{payslip.employee.position}</p>
                            <div className="mt-3">
                                <Badge variant={payslip.status === 'paid' ? 'outline' : payslip.status === 'approved' ? 'default' : 'secondary'}>
                                    {statusLabels[payslip.status] ?? payslip.status}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="divide-y">
                                {items.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between py-3">
                                        <span className="text-muted-foreground">{item.label}</span>
                                        <span className={`font-semibold ${item.negative ? 'text-destructive' : ''}`}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between py-4">
                                    <span className="text-lg font-semibold">Take Home Pay</span>
                                    <span className="text-xl font-bold" style={{ color: '#4F6B6A' }}>
                                        Rp {Number(payslip.take_home_pay).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {payslip.status === 'paid' && (
                                <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                                    <p>Dibayar: {payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('id-ID') : '-'}</p>
                                    <p>Metode: {payslip.paid_method === 'cash' ? 'Tunai' : 'Transfer'}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

PayslipShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Slip Gaji', href: '/admin/payslips' },
        { title: 'Detail', href: '#' },
    ],
};

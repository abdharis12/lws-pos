import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeUser { id: number; name: string; }
interface EmployeeData { id: number; user: EmployeeUser; }
interface PayslipData {
    id: number; period: string; base_salary: string; allowances_total: string;
    bonus_total: string; overtime_total: string; deduction_total: string;
    take_home_pay: string; status: string; paid_at: string | null;
    employee: EmployeeData;
}

interface Props {
    payslips: PayslipData[]; period: string; periods: string[];
    summary: {
        total_labor_cost: number; total_base_salary: number; total_allowances: number;
        total_bonuses: number; total_overtime: number; total_deductions: number;
        paid_count: number; approved_count: number; draft_count: number;
    };
}

const statusLabels: Record<string, string> = { draft: 'Draft', approved: 'Disetujui', paid: 'Dibayar' };

export default function PayrollReport({ payslips, period, periods, summary }: Props) {
    function switchPeriod(p: string) {
        router.get('/admin/payroll/report', { period: p }, { preserveState: true });
    }

    function exportReport() {
        window.open(`/admin/payroll/export?period=${period}`, '_blank');
    }

    return (
        <>
            <Head title="Laporan Payroll" />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Laporan Payroll</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Total biaya tenaga kerja & rasio per periode</p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={switchPeriod}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {periods.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Button onClick={exportReport}><Download className="mr-2 size-4" /> Export Excel</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Labor Cost</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">Rp {Math.ceil(summary.total_labor_cost).toLocaleString('id-ID')}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Gaji Pokok</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">Rp {Math.ceil(summary.total_base_salary).toLocaleString('id-ID')}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Bonus</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">Rp {Math.ceil(summary.total_bonuses).toLocaleString('id-ID')}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Potongan</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-destructive">Rp {Math.ceil(summary.total_deductions).toLocaleString('id-ID')}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Tunjangan</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">Rp {Math.ceil(summary.total_allowances).toLocaleString('id-ID')}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Lembur</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">Rp {Math.ceil(summary.total_overtime).toLocaleString('id-ID')}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Status Pembayaran</CardTitle></CardHeader>
                    <CardContent>
                        <p>Dibayar: {summary.paid_count}</p>
                        <p>Disetujui: {summary.approved_count}</p>
                        <p>Draft: {summary.draft_count}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader><CardTitle>Rincian Payroll — {period}</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Karyawan</th>
                                <th className="px-6 py-3 font-medium">Gaji Pokok</th>
                                <th className="px-6 py-3 font-medium">Tunjangan</th>
                                <th className="px-6 py-3 font-medium">Bonus</th>
                                <th className="px-6 py-3 font-medium">Lembur</th>
                                <th className="px-6 py-3 font-medium">Potongan</th>
                                <th className="px-6 py-3 font-medium">THP</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.map((p) => (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3 font-medium">{p.employee.user.name}</td>
                                    <td className="px-6 py-3">Rp {Number(p.base_salary).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3">Rp {Number(p.allowances_total).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3">Rp {Number(p.bonus_total).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3">Rp {Number(p.overtime_total).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3 text-destructive">(Rp {Number(p.deduction_total).toLocaleString('id-ID')})</td>
                                    <td className="px-6 py-3 font-semibold">Rp {Number(p.take_home_pay).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3"><Badge variant="outline">{statusLabels[p.status] ?? p.status}</Badge></td>
                                </tr>
                            ))}
                            {payslips.length === 0 && (
                                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Belum ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

PayrollReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Payroll', href: '/admin/payroll/report' },
    ],
};

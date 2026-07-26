import { Head, router } from '@inertiajs/react';
import { Download, Eye, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeUser { id: number; name: string; }
interface EmployeeData { id: number; user: EmployeeUser; position: string; }
interface PayslipData {
    id: number; employee_id: number; period: string;
    base_salary: string; allowances_total: string; bonus_total: string;
    overtime_total: string; deduction_total: string; take_home_pay: string;
    status: string; paid_at: string | null; paid_method: string | null;
    employee: EmployeeData;
}

interface Props { payslips: PayslipData[]; period: string; periods: string[]; }

const statusLabels: Record<string, string> = { draft: 'Draft', approved: 'Disetujui', paid: 'Dibayar' };
const statusVariants: Record<string, string> = { draft: 'secondary', approved: 'default', paid: 'outline' };

export default function Payslips({ payslips, period, periods }: Props) {
    function switchPeriod(p: string) {
        router.get('/admin/payslips', { period: p }, { preserveState: true });
    }

    function generate() {
        if (confirm(`Generate slip gaji untuk periode ${period}?`)) {
            router.post('/admin/payslips/generate', { period }, { preserveScroll: true });
        }
    }

    function approve(id: number) {
        router.post(`/admin/payslips/${id}/approve`, {}, { preserveScroll: true });
    }

    function markPaid(id: number) {
        const method = prompt('Metode pembayaran (cash/transfer):');

        if (method && ['cash', 'transfer'].includes(method)) {
            router.post(`/admin/payslips/${id}/mark-paid`, { paid_method: method }, { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title="Slip Gaji" />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Slip Gaji</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Generate & kelola slip gaji karyawan</p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={switchPeriod}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {periods.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={generate}><RefreshCw className="mr-2 size-4" /> Generate</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{payslips.length} slip</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disetujui</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{payslips.filter(p => p.status === 'approved').length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dibayar</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{payslips.filter(p => p.status === 'paid').length}</p></CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader><CardTitle>Slip Gaji — {period}</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Karyawan</th>
                                <th className="px-6 py-3 font-medium">Gaji Pokok</th>
                                <th className="px-6 py-3 font-medium">Bonus</th>
                                <th className="px-6 py-3 font-medium">Potongan</th>
                                <th className="px-6 py-3 font-medium">Take Home Pay</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.map((p) => (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-3">
                                        <span className="font-medium">{p.employee.user.name}</span>
                                        <p className="text-xs text-muted-foreground">{p.employee.position}</p>
                                    </td>
                                    <td className="px-6 py-3">Rp {Number(p.base_salary).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3">Rp {Number(p.bonus_total).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3 text-destructive">(Rp {Number(p.deduction_total).toLocaleString('id-ID')})</td>
                                    <td className="px-6 py-3 font-semibold">Rp {Number(p.take_home_pay).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-3">
                                        <Badge variant={statusVariants[p.status] as 'default' | 'secondary' | 'outline'}>
                                            {statusLabels[p.status] ?? p.status}
                                        </Badge>
                                    </td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <a href={`/admin/payslips/${p.id}`}>
                                            <Button variant="ghost" size="icon"><Eye className="size-4" /></Button>
                                        </a>
                                        <a href={`/payslips/${p.id}/pdf`} target="_blank">
                                            <Button variant="ghost" size="icon"><Download className="size-4" /></Button>
                                        </a>
                                        {p.status === 'draft' && (
                                            <Button variant="ghost" size="sm" onClick={() => approve(p.id)}>Setujui</Button>
                                        )}
                                        {p.status === 'approved' && (
                                            <Button variant="ghost" size="sm" onClick={() => markPaid(p.id)}>Bayar</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payslips.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                    Belum ada slip gaji. Klik "Generate" untuk membuat.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

Payslips.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Slip Gaji', href: '/admin/payslips' },
    ],
};

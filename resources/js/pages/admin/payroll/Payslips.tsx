import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { AlertTriangle, Download, Eye, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const statusClasses: Record<string, string> = {
    draft: 'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500',
    approved: 'rounded-full border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)]/10 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.48_0.032_195.5)]',
    paid: 'rounded-full border border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[oklch(0.48_0.032_195.5)] shadow-sm',
};

export default function Payslips({ payslips, period, periods }: Props) {
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
    const [generating, setGenerating] = useState(false);

    function switchPeriod(p: string) {
        router.get('/admin/payslips', { period: p }, { preserveState: true });
    }

    function confirmGenerate() {
        setGenerating(true);
        setShowGenerateConfirm(false);
        router.post('/admin/payslips/generate', { period }, {
            preserveScroll: true,
            onFinish: () => setGenerating(false),
        });
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
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Slip Gaji" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <FileText className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Penggajian Karyawan</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Slip Gaji
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Generate & kelola slip gaji karyawan
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={switchPeriod}>
                        <SelectTrigger className="w-36 border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                            {periods.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setShowGenerateConfirm(true)} disabled={generating} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                        <RefreshCw className={`mr-2 size-4 ${generating ? 'animate-spin' : ''}`} /> Generate
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">Total</p>
                    <p className="mt-2 font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">{payslips.length} slip</p>
                </div>
                <div className="overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">Disetujui</p>
                    <p className="mt-2 font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">{payslips.filter(p => p.status === 'approved').length}</p>
                </div>
                <div className="overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">Dibayar</p>
                    <p className="mt-2 font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">{payslips.filter(p => p.status === 'paid').length}</p>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <div className="border-b border-[oklch(0.80_0.038_88.5)]/20 px-6 py-4">
                    <h2 className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">Slip Gaji — {period}</h2>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                <th className="px-6 py-3.5 font-semibold">Gaji Pokok</th>
                                <th className="px-6 py-3.5 font-semibold">Bonus</th>
                                <th className="px-6 py-3.5 font-semibold">Potongan</th>
                                <th className="px-6 py-3.5 font-semibold">Take Home Pay</th>
                                <th className="px-6 py-3.5 font-semibold">Status</th>
                                <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                            {payslips.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                    <td className="px-6 py-4">
                                        <span className="font-medium">{p.employee.user.name}</span>
                                        <p className="text-xs text-slate-500">{p.employee.position}</p>
                                    </td>
                                    <td className="px-6 py-4">Rp {Number(p.base_salary).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">Rp {Number(p.bonus_total).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 text-rose-700">(Rp {Number(p.deduction_total).toLocaleString('id-ID')})</td>
                                    <td className="px-6 py-4 font-semibold">Rp {Number(p.take_home_pay).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">
                                        <span className={statusClasses[p.status] ?? ''}>
                                            {statusLabels[p.status] ?? p.status}
                                        </span>
                                    </td>
                                    <td className="flex justify-end gap-1 px-6 py-4">
                                        <a href={`/admin/payslips/${p.id}`}>
                                            <Button variant="ghost" size="icon" className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.48_0.032_195.5)]/70 hover:text-white transition-colors">
                                                <Eye className="size-4" />
                                            </Button>
                                        </a>
                                        <a href={`/payslips/${p.id}/pdf`} target="_blank">
                                            <Button variant="ghost" size="icon" className="border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10">
                                                <Download className="size-4" />
                                            </Button>
                                        </a>
                                        {p.status === 'draft' && (
                                            <Button variant="ghost" size="sm" onClick={() => approve(p.id)} className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                                                Setujui
                                            </Button>
                                        )}
                                        {p.status === 'approved' && (
                                            <Button variant="ghost" size="sm" onClick={() => markPaid(p.id)} className="bg-[oklch(0.80_0.038_88.5)]/20 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/30">
                                                Bayar
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payslips.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-sm italic text-slate-500">
                                        Belum ada slip gaji. Klik "Generate" untuk membuat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
                <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[oklch(0.80_0.038_88.5)]/15">
                            <AlertTriangle className="size-6 text-[oklch(0.48_0.032_195.5)]" />
                        </div>
                        <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                            Generate Slip Gaji
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            Apakah Anda yakin ingin generate slip gaji untuk periode <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{period}</span>? Slip gaji yang sudah ada akan ditimpa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setShowGenerateConfirm(false)}
                            className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmGenerate}
                            disabled={generating}
                            className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                        >
                            {generating ? 'Menggenerate...' : 'Ya, Generate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

Payslips.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Slip Gaji', href: '/admin/payslips' },
    ],
};

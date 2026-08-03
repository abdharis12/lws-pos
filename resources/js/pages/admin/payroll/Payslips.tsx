import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    Check,
    Clock,
    Download,
    Eye,
    FileText,
    HandCoins,
    Landmark,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EmployeeUser {
    id: number;
    name: string;
}
interface DeductionData {
    id: number;
    type: string;
    amount: string;
    notes: string | null;
}
interface EmployeeData {
    id: number;
    user: EmployeeUser;
    position: string;
    deductions: DeductionData[];
}
interface PayslipData {
    id: number;
    employee_id: number;
    period: string;
    base_salary: string;
    allowances_total: string;
    bonus_total: string;
    overtime_total: string;
    deduction_total: string;
    take_home_pay: string;
    status: string;
    paid_at: string | null;
    paid_method: string | null;
    employee: EmployeeData;
    meal_allowance: string;
    transport_allowance: string;
}

interface Props {
    payslips: PayslipData[];
    period: string;
    periods: string[];
}

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    approved: 'Disetujui',
    paid: 'Dibayar',
};

const deductionLabels: Record<string, string> = {
    late: 'Keterlambatan',
    loan: 'Kasbon/Pinjaman',
    other: 'Lainnya',
};

const statusClasses: Record<string, string> = {
    draft: 'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500',
    approved:
        'rounded-full border border-[#CFC0A4]/30 bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-medium text-[#4F6B6A]',
    paid: 'rounded-full border border-primary/50 bg-primary px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white shadow-sm',
};

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

export default function Payslips({ payslips, period, periods }: Props) {
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [payingPayslip, setPayingPayslip] = useState<PayslipData | null>(
        null,
    );
    const [paidMethod, setPaidMethod] = useState<'cash' | 'transfer'>('cash');
    const [paying, setPaying] = useState(false);

    function switchPeriod(p: string) {
        router.get('/admin/payslips', { period: p }, { preserveState: true });
    }

    function confirmGenerate() {
        setGenerating(true);
        setShowGenerateConfirm(false);
        router.post(
            '/admin/payslips/generate',
            { period },
            {
                preserveScroll: true,
                onFinish: () => setGenerating(false),
            },
        );
    }

    function approve(id: number) {
        router.post(
            `/admin/payslips/${id}/approve`,
            {},
            { preserveScroll: true },
        );
    }

    function openPayDialog(p: PayslipData) {
        setPaidMethod('cash');
        setPayingPayslip(p);
    }

    function confirmPay() {
        if (!payingPayslip) {
            return;
        }

        setPaying(true);
        router.post(
            `/admin/payslips/${payingPayslip.id}/mark-paid`,
            { paid_method: paidMethod },
            {
                preserveScroll: true,
                onFinish: () => {
                    setPaying(false);
                    setPayingPayslip(null);
                },
            },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Slip Gaji" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <FileText className="size-3.5 text-[#4F6B6A]" />
                            <span>Penggajian Karyawan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Slip Gaji
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Generate & kelola slip gaji karyawan
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={period} onValueChange={switchPeriod}>
                            <SelectTrigger className="w-36 border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                {periods.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => setShowGenerateConfirm(true)}
                            disabled={generating}
                            className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                        >
                            <RefreshCw
                                className={`mr-2 size-4 ${generating ? 'animate-spin' : ''}`}
                            />{' '}
                            Generate
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Total
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            {payslips.length} slip
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Disetujui
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            {
                                payslips.filter((p) => p.status === 'approved')
                                    .length
                            }
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Dibayar
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            {payslips.filter((p) => p.status === 'paid').length}
                        </p>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <div className="border-b border-[#CFC0A4]/20 px-6 py-4">
                        <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                            Slip Gaji — {period}
                        </h2>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                    <th className="px-6 py-3.5 font-semibold">
                                        Karyawan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Gaji Pokok
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Uang Makan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Transport
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Bonus
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Potongan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Take Home Pay
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#CFC0A4]/15">
                                {payslips.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium">
                                                {p.employee.user.name}
                                            </span>
                                            <p className="text-xs text-slate-500">
                                                {p.employee.position}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                p.base_salary,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                p.meal_allowance,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                p.transport_allowance,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                p.bonus_total,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-rose-700">
                                            <span>
                                                (Rp{' '}
                                                {Number(
                                                    p.deduction_total,
                                                ).toLocaleString('id-ID')}
                                                )
                                            </span>
                                            {p.employee.deductions?.length >
                                                0 && (
                                                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                                                    {p.employee.deductions.map(
                                                        (d) => (
                                                            <div key={d.id}>
                                                                {deductionLabels[
                                                                    d.type
                                                                ] ?? d.type}
                                                                {d.notes
                                                                    ? ` — ${d.notes}`
                                                                    : ''}
                                                                : Rp{' '}
                                                                {Number(
                                                                    d.amount,
                                                                ).toLocaleString(
                                                                    'id-ID',
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            Rp{' '}
                                            {Number(
                                                p.take_home_pay,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={
                                                    statusClasses[p.status] ??
                                                    ''
                                                }
                                            >
                                                {statusLabels[p.status] ??
                                                    p.status}
                                            </span>
                                        </td>
                                        <td className="flex justify-end gap-1 px-6 py-4">
                                            <a href={`/admin/payslips/${p.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="bg-[#4F6B6A] text-white transition-colors hover:bg-[#4F6B6A]/70 hover:text-white"
                                                >
                                                    <Eye className="size-4" />
                                                </Button>
                                            </a>
                                            <a
                                                href={`/payslips/${p.id}/pdf`}
                                                target="_blank"
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            </a>
                                            {p.status === 'draft' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        approve(p.id)
                                                    }
                                                    className="bg-teal-700 text-white transition-colors hover:bg-teal-600 hover:text-white"
                                                >
                                                    <Check className="size-4" />
                                                </Button>
                                            )}
                                            {p.status === 'approved' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openPayDialog(p)
                                                    }
                                                    className="border border-blue-700 bg-blue-700 text-white transition-colors hover:bg-blue-600 hover:text-white"
                                                >
                                                    <HandCoins className="size-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {payslips.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="py-12 text-center text-sm text-slate-500 italic"
                                        >
                                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                                <div
                                                    className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                                    style={{
                                                        backgroundColor:
                                                            INK_LIGHT,
                                                    }}
                                                >
                                                    <Clock
                                                        className="size-8"
                                                        style={{ color: INK }}
                                                    />
                                                </div>
                                                <h2
                                                    className="font-serif text-xl font-bold"
                                                    style={{ color: INK }}
                                                >
                                                    Belum Ada Slip Gaji
                                                </h2>
                                                <p
                                                    className="mt-1 max-w-sm text-sm"
                                                    style={{
                                                        color: 'oklch(0.60 0.03 88.5)',
                                                    }}
                                                >
                                                    Belum ada slip gaji. Klik
                                                    "Generate" untuk membuat.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Dialog
                    open={showGenerateConfirm}
                    onOpenChange={setShowGenerateConfirm}
                >
                    <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#CFC0A4]/15">
                                <AlertTriangle className="size-6 text-[#4F6B6A]" />
                            </div>
                            <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[#4F6B6A]">
                                Generate Slip Gaji
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin generate slip gaji untuk
                                periode{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {period}
                                </span>
                                ? Slip gaji yang sudah ada akan ditimpa.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => setShowGenerateConfirm(false)}
                                className="border border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={confirmGenerate}
                                disabled={generating}
                                className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                            >
                                {generating
                                    ? 'Menggenerate...'
                                    : 'Ya, Generate'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Payment Confirmation Dialog */}
                <Dialog
                    open={!!payingPayslip}
                    onOpenChange={(open) => !open && setPayingPayslip(null)}
                >
                    <style>{`
                        @keyframes pay-float {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-8px); }
                        }
                        @keyframes pay-glow {
                            0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35); }
                            50% { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
                        }
                        @keyframes pay-shine {
                            0% { background-position: -200% center; }
                            100% { background-position: 200% center; }
                        }
                        .pay-float { animation: pay-float 2.6s ease-in-out infinite; }
                        .pay-glow { animation: pay-glow 2.2s ease-out infinite; }
                        .pay-shine {
                            background-image: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%);
                            background-size: 200% auto;
                            animation: pay-shine 2.8s linear infinite;
                        }
                    `}</style>
                    <DialogContent className="overflow-hidden border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                        {payingPayslip && (
                            <>
                                <DialogHeader>
                                    <div className="relative mx-auto flex size-15 items-center justify-center">
                                        <span className="pay-glow absolute inset-0 rounded-full" />
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20 [animation-duration:2.2s]" />
                                        <div className="pay-float relative flex size-15 items-center justify-center rounded-full border-2 border-primary bg-gradient-to-br from-primary/80 to-primary text-white shadow-lg shadow-primary/40">
                                            <HandCoins className="size-7" />
                                        </div>
                                    </div>
                                    <DialogTitle className="mt-4 text-center font-serif text-2xl font-bold text-[#4F6B6A]">
                                        Konfirmasi Pembayaran
                                    </DialogTitle>
                                    <DialogDescription className="text-center text-slate-500">
                                        Pastikan data berikut sudah benar
                                        sebelum slip gaji ditandai{' '}
                                        <span className="font-semibold text-[#4F6B6A]">
                                            Dibayar
                                        </span>
                                        .
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Payslip Summary */}
                                <div className="relative overflow-hidden rounded-xl border border-[#CFC0A4]/40 bg-white p-5 text-center shadow-sm">
                                    <div className="pay-shine pointer-events-none absolute inset-0" />
                                    <p className="font-medium text-[#4F6B6A]">
                                        {payingPayslip.employee.user.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {payingPayslip.employee.position} •
                                        Periode {payingPayslip.period}
                                    </p>
                                    <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                        Rp{' '}
                                        {Number(
                                            payingPayslip.take_home_pay,
                                        ).toLocaleString('id-ID')}
                                    </p>
                                </div>

                                {/* Payment Method */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaidMethod('cash')}
                                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                                            paidMethod === 'cash'
                                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                                                : 'border-[#CFC0A4]/40 bg-white/70 text-slate-600 hover:border-primary hover:text-primary'
                                        }`}
                                    >
                                        <Banknote className="size-5" />
                                        Tunai
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaidMethod('transfer')
                                        }
                                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                                            paidMethod === 'transfer'
                                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25'
                                                : 'border-[#CFC0A4]/40 bg-white/70 text-slate-600 hover:border-primary hover:text-primary'
                                        }`}
                                    >
                                        <Landmark className="size-5" />
                                        Transfer
                                    </button>
                                </div>

                                <DialogFooter className="gap-2 sm:justify-center">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setPayingPayslip(null)}
                                        disabled={paying}
                                        className="border border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        onClick={confirmPay}
                                        disabled={paying}
                                        className="bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/80"
                                    >
                                        {paying
                                            ? 'Memproses...'
                                            : 'Konfirmasi Bayar'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

Payslips.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Slip Gaji', href: '/admin/payslips' },
    ],
};

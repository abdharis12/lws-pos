import { Head, router } from '@inertiajs/react';
import { BarChart3, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
interface EmployeeData {
    id: number;
    user: EmployeeUser;
}
interface PayslipData {
    id: number;
    period: string;
    base_salary: string;
    allowances_total: string;
    bonus_total: string;
    overtime_total: string;
    deduction_total: string;
    take_home_pay: string;
    status: string;
    paid_at: string | null;
    employee: EmployeeData;
}

interface Props {
    payslips: PayslipData[];
    period: string;
    periods: string[];
    summary: {
        total_labor_cost: number;
        total_base_salary: number;
        total_allowances: number;
        total_bonuses: number;
        total_overtime: number;
        total_deductions: number;
        paid_count: number;
        approved_count: number;
        draft_count: number;
    };
}

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    approved: 'Disetujui',
    paid: 'Dibayar',
};

const statusClasses: Record<string, string> = {
    draft: 'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500',
    approved:
        'rounded-full border border-[#CFC0A4]/30 bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-medium text-[#4F6B6A]',
    paid: 'rounded-full border border-[#CFC0A4]/50 bg-[#F6F2E9] px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[#4F6B6A] shadow-sm',
};

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

export default function PayrollReport({
    payslips,
    period,
    periods,
    summary,
}: Props) {
    function switchPeriod(p: string) {
        router.get(
            '/admin/payroll/report',
            { period: p },
            { preserveState: true },
        );
    }

    function exportReport() {
        window.open(`/admin/payroll/export?period=${period}`, '_blank');
    }

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Laporan Payroll" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <BarChart3 className="size-3.5 text-[#4F6B6A]" />
                            <span>Analitik Payroll</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Laporan Payroll
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Total biaya tenaga kerja & rasio per periode
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
                            onClick={exportReport}
                            className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                        >
                            <Download className="mr-2 size-4" /> Export Excel
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Total Labor Cost
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            Rp{' '}
                            {Math.ceil(summary.total_labor_cost).toLocaleString(
                                'id-ID',
                            )}
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Total Gaji Pokok
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            Rp{' '}
                            {Math.ceil(
                                summary.total_base_salary,
                            ).toLocaleString('id-ID')}
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Total Bonus
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            Rp{' '}
                            {Math.ceil(summary.total_bonuses).toLocaleString(
                                'id-ID',
                            )}
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-rose-700 uppercase">
                            Total Potongan
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-rose-700">
                            Rp{' '}
                            {Math.ceil(summary.total_deductions).toLocaleString(
                                'id-ID',
                            )}
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Total Tunjangan
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            Rp{' '}
                            {Math.ceil(summary.total_allowances).toLocaleString(
                                'id-ID',
                            )}
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Total Lembur
                        </p>
                        <p className="mt-2 font-serif text-2xl font-bold text-[#4F6B6A]">
                            Rp{' '}
                            {Math.ceil(summary.total_overtime).toLocaleString(
                                'id-ID',
                            )}
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white p-6 shadow-sm backdrop-blur-sm">
                        <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Status Pembayaran
                        </p>
                        <div className="mt-3 space-y-1">
                            <p className="text-sm text-slate-600">
                                Dibayar:{' '}
                                <span className="font-semibold">
                                    {summary.paid_count}
                                </span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Disetujui:{' '}
                                <span className="font-semibold">
                                    {summary.approved_count}
                                </span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Draft:{' '}
                                <span className="font-semibold">
                                    {summary.draft_count}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-lg border border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <div className="border-b border-[#CFC0A4]/20 px-6 py-4">
                        <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                            Rincian Payroll — {period}
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
                                        Tunjangan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Bonus
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Lembur
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Potongan
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        THP
                                    </th>
                                    <th className="px-6 py-3.5 font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#CFC0A4]/15">
                                {payslips.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {p.employee.user.name}
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
                                                p.allowances_total,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                p.bonus_total,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            Rp{' '}
                                            {Number(
                                                p.overtime_total,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-rose-700">
                                            (Rp{' '}
                                            {Number(
                                                p.deduction_total,
                                            ).toLocaleString('id-ID')}
                                            )
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
                                    </tr>
                                ))}
                                {payslips.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
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
                                                    Belum Ada Payroll
                                                </h2>
                                                <p
                                                    className="mt-1 max-w-sm text-sm"
                                                    style={{
                                                        color: 'oklch(0.60 0.03 88.5)',
                                                    }}
                                                >
                                                    Belum ada payroll yang
                                                    ditambahkan.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

PayrollReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Payroll', href: '/admin/payroll/report' },
    ],
};

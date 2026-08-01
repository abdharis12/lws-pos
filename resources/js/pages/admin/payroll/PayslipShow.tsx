import { Head, Link } from '@inertiajs/react';
import { Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserData {
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
    user: UserData;
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
    meal_allowance: string;
    transport_allowance: string;
    status: string;
    paid_at: string | null;
    paid_method: string | null;
    employee: EmployeeData;
}

interface Props {
    payslip: PayslipData;
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
    paid: 'rounded-full border border-[#CFC0A4]/50 bg-[#F6F2E9] px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[#4F6B6A] shadow-sm',
};

export default function PayslipShow({ payslip }: Props) {
    const items = [
        {
            label: 'Gaji Pokok',
            value: `Rp ${Number(payslip.base_salary).toLocaleString('id-ID')}`,
        },
        {
            label: 'Uang Makan',
            value: `Rp ${Number(payslip.meal_allowance).toLocaleString('id-ID')}`,
        },
        {
            label: 'Transport',
            value: `Rp ${Number(payslip.transport_allowance).toLocaleString('id-ID')}`,
        },
        {
            label: 'Bonus',
            value: `Rp ${Number(payslip.bonus_total).toLocaleString('id-ID')}`,
        },
        {
            label: 'Lembur',
            value: `Rp ${Number(payslip.overtime_total).toLocaleString('id-ID')}`,
        },
        {
            label: 'Potongan',
            value: `(Rp ${Number(payslip.deduction_total).toLocaleString('id-ID')})`,
            negative: true,
        },
    ];

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Detail Slip Gaji" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Receipt className="size-3.5 text-[#4F6B6A]" />
                            <span>Detail Slip Gaji</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Slip Gaji — {payslip.employee.user.name}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Periode {payslip.period}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/payslips">
                            <Button variant="outline">Kembali</Button>
                        </Link>
                        <a href={`/payslips/${payslip.id}/pdf`} target="_blank">
                            <Button className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]">
                                <Download className="mr-2 size-4" /> PDF
                            </Button>
                        </a>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                            <div className="flex flex-col items-center pt-6 pb-6">
                                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-[#CFC0A4]/20 text-3xl font-semibold text-[#4F6B6A]">
                                    {payslip.employee.user.name.charAt(0)}
                                </div>
                                <h3 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    {payslip.employee.user.name}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {payslip.employee.position}
                                </p>
                                <div className="mt-3">
                                    <span
                                        className={
                                            statusClasses[payslip.status] ?? ''
                                        }
                                    >
                                        {statusLabels[payslip.status] ??
                                            payslip.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                            <div className="border-b border-[#CFC0A4]/20 bg-primary/5 px-6 py-4">
                                <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    Rincian Gaji
                                </h2>
                            </div>
                            <div className="px-6 py-4">
                                <div className="divide-y divide-[#CFC0A4]/15">
                                    {items.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center justify-between py-3"
                                        >
                                            <span className="text-slate-500">
                                                {item.label}
                                            </span>
                                            <span
                                                className={`font-semibold ${item.negative ? 'text-rose-700' : 'text-slate-800'}`}
                                            >
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between py-4">
                                        <span className="font-serif text-lg font-semibold text-[#4F6B6A]">
                                            Take Home Pay
                                        </span>
                                        <span className="font-serif text-xl font-bold text-[#4F6B6A]">
                                            Rp{' '}
                                            {Number(
                                                payslip.take_home_pay,
                                            ).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>

                                {payslip.employee.deductions?.length > 0 && (
                                    <div className="mt-4 rounded-lg border border-rose-200/70 bg-rose-50/60 p-3 text-sm">
                                        <p className="mb-1 text-xs font-semibold tracking-wider text-rose-700 uppercase">
                                            Rincian Potongan
                                        </p>
                                        <div className="divide-y divide-rose-100">
                                            {payslip.employee.deductions.map(
                                                (d) => (
                                                    <div
                                                        key={d.id}
                                                        className="flex items-center justify-between py-1"
                                                    >
                                                        <span className="text-slate-600">
                                                            {deductionLabels[
                                                                d.type
                                                            ] ?? d.type}
                                                            {d.notes
                                                                ? ` — ${d.notes}`
                                                                : ''}
                                                        </span>
                                                        <span className="font-medium text-rose-700">
                                                            (Rp{' '}
                                                            {Number(
                                                                d.amount,
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                            )
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {payslip.status === 'paid' && (
                                    <div className="mt-4 rounded-lg border border-[#CFC0A4]/20 bg-[#CFC0A4]/5 p-3 text-sm">
                                        <p className="text-slate-600">
                                            Dibayar:{' '}
                                            {payslip.paid_at
                                                ? new Date(
                                                      payslip.paid_at,
                                                  ).toLocaleDateString('id-ID')
                                                : '-'}
                                        </p>
                                        <p className="text-slate-600">
                                            Metode:{' '}
                                            {payslip.paid_method === 'cash'
                                                ? 'Tunai'
                                                : 'Transfer'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

PayslipShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Slip Gaji', href: '/admin/payslips' },
        { title: 'Detail', href: '#' },
    ],
};

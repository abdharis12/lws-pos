import { Head, Link } from '@inertiajs/react';
import { Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserData { id: number; name: string; }
interface DeductionData { id: number; type: string; amount: string; notes: string | null; }
interface EmployeeData { id: number; user: UserData; position: string; deductions: DeductionData[]; }
interface PayslipData {
    id: number; employee_id: number; period: string;
    base_salary: string; allowances_total: string; bonus_total: string;
    overtime_total: string; deduction_total: string; take_home_pay: string;
    meal_allowance: string; transport_allowance: string;
    status: string; paid_at: string | null; paid_method: string | null;
    employee: EmployeeData;
}

interface Props { payslip: PayslipData; }

const statusLabels: Record<string, string> = { draft: 'Draft', approved: 'Disetujui', paid: 'Dibayar' };

const deductionLabels: Record<string, string> = { late: 'Keterlambatan', loan: 'Kasbon/Pinjaman', other: 'Lainnya' };

const statusClasses: Record<string, string> = {
    draft: 'rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500',
    approved: 'rounded-full border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)]/10 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.48_0.032_195.5)]',
    paid: 'rounded-full border border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[oklch(0.48_0.032_195.5)] shadow-sm',
};

export default function PayslipShow({ payslip }: Props) {
    const items = [
        { label: 'Gaji Pokok', value: `Rp ${Number(payslip.base_salary).toLocaleString('id-ID')}` },
        { label: 'Uang Makan', value: `Rp ${Number(payslip.meal_allowance).toLocaleString('id-ID')}` },
        { label: 'Transport', value: `Rp ${Number(payslip.transport_allowance).toLocaleString('id-ID')}` },
        { label: 'Bonus', value: `Rp ${Number(payslip.bonus_total).toLocaleString('id-ID')}` },
        { label: 'Lembur', value: `Rp ${Number(payslip.overtime_total).toLocaleString('id-ID')}` },
        { label: 'Potongan', value: `(Rp ${Number(payslip.deduction_total).toLocaleString('id-ID')})`, negative: true },
    ];

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Detail Slip Gaji" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <Receipt className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Detail Slip Gaji</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Slip Gaji — {payslip.employee.user.name}
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            Periode {payslip.period}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/payslips">
                            <Button variant="outline">
                                Kembali
                            </Button>
                        </Link>
                        <a href={`/payslips/${payslip.id}/pdf`} target="_blank">
                            <Button className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]">
                                <Download className="mr-2 size-4" /> PDF
                            </Button>
                        </a>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm rounded-2xl">
                            <div className="flex flex-col items-center pt-6 pb-6">
                                <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-[oklch(0.80_0.038_88.5)]/20 text-3xl font-semibold text-[oklch(0.48_0.032_195.5)]">
                                    {payslip.employee.user.name.charAt(0)}
                                </div>
                                <h3 className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">{payslip.employee.user.name}</h3>
                                <p className="text-sm text-slate-500">{payslip.employee.position}</p>
                                <div className="mt-3">
                                    <span className={statusClasses[payslip.status] ?? ''}>
                                        {statusLabels[payslip.status] ?? payslip.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="border border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm rounded-2xl overflow-hidden">
                            <div className="border-b border-[oklch(0.80_0.038_88.5)]/20 px-6 py-4 bg-primary/5">
                                <h2 className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">Rincian Gaji</h2>
                            </div>
                            <div className="px-6 py-4">
                                <div className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                    {items.map((item) => (
                                        <div key={item.label} className="flex items-center justify-between py-3">
                                            <span className="text-slate-500">{item.label}</span>
                                            <span className={`font-semibold ${item.negative ? 'text-rose-700' : 'text-slate-800'}`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between py-4">
                                        <span className="font-serif text-lg font-semibold text-[oklch(0.48_0.032_195.5)]">Take Home Pay</span>
                                        <span className="font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                            Rp {Number(payslip.take_home_pay).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>

                                {payslip.employee.deductions?.length > 0 && (
                                    <div className="mt-4 rounded-lg border border-rose-200/70 bg-rose-50/60 p-3 text-sm">
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-700">Rincian Potongan</p>
                                        <div className="divide-y divide-rose-100">
                                            {payslip.employee.deductions.map((d) => (
                                                <div key={d.id} className="flex items-center justify-between py-1">
                                                    <span className="text-slate-600">
                                                        {deductionLabels[d.type] ?? d.type}{d.notes ? ` — ${d.notes}` : ''}
                                                    </span>
                                                    <span className="font-medium text-rose-700">(Rp {Number(d.amount).toLocaleString('id-ID')})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {payslip.status === 'paid' && (
                                    <div className="mt-4 rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.80_0.038_88.5)]/5 p-3 text-sm">
                                        <p className="text-slate-600">Dibayar: {payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('id-ID') : '-'}</p>
                                        <p className="text-slate-600">Metode: {payslip.paid_method === 'cash' ? 'Tunai' : 'Transfer'}</p>
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

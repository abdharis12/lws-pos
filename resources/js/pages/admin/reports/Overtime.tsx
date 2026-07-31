import { Head, router } from '@inertiajs/react';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OvertimeSummary {
    employee_id: number;
    name: string;
    position: string;
    total_attendance_days: number;
    total_overtime_days: number;
    total_overtime_hours: number;
}

interface Props {
    summary: OvertimeSummary[];
    month: string;
}

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';
export default function OvertimeReport({ summary, month }: Props) {
    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Laporan Lembur" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                                <Clock className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                                <span>Jam Lembur</span>
                            </div>
                            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                                Laporan Jam Lembur
                            </h1>
                            <p className="mt-1 text-sm italic text-slate-500">
                                Periode: {month}
                            </p>
                        </div>
                    </div>
                </div>

                {summary.length === 0 ? (
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardContent className="py-8">
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: INK_LIGHT }}>
                                    <Clock className="size-8" style={{ color: INK }} />
                                </div>
                                <h2 className="font-serif text-xl font-bold" style={{ color: INK }}>Belum Ada Laporan</h2>
                                <p className="mt-1 max-w-sm text-sm" style={{ color: 'oklch(0.60 0.03 88.5)' }}>
                                    tidak ada karyawan yang memiliki jam lembur pada periode ini.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                <Clock className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                                Rekap Lembur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                            <th className="px-6 py-3.5 font-semibold">Posisi</th>
                                            <th className="px-6 py-3.5 font-semibold text-center">Hadir</th>
                                            <th className="px-6 py-3.5 font-semibold text-center">Hari Lembur</th>
                                            <th className="px-6 py-3.5 font-semibold text-right">Total Jam Lembur</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                        {summary.map((emp) => (
                                            <tr
                                                key={emp.employee_id}
                                                className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                                                <td className="px-6 py-4 text-slate-500">{emp.position}</td>
                                                <td className="px-6 py-4 text-center font-semibold text-[oklch(0.48_0.032_195.5)]">{emp.total_attendance_days}</td>
                                                <td className="px-6 py-4 text-center font-semibold text-slate-800">{emp.total_overtime_days}</td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-800">{emp.total_overtime_hours} jam</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

OvertimeReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Lembur', href: '/admin/reports/overtime' },
    ],
};

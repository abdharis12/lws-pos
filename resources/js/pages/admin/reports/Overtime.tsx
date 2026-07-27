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

export default function OvertimeReport({ summary, month }: Props) {
    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Laporan Lembur" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.get('/admin/reports')}
                        className="text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
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
                        <p className="text-center text-sm italic text-slate-500">
                            Tidak ada karyawan yang lembur pada periode ini.
                        </p>
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
    );
}

OvertimeReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Lembur', href: '/admin/reports/overtime' },
    ],
};

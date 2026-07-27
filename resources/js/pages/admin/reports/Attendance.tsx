import { Head, router } from '@inertiajs/react';
import { Users, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmployeeSummary {
    employee_id: number;
    name: string;
    position: string;
    total_days: number;
    late_days: number;
    total_hours: number;
}

interface Props {
    summary: EmployeeSummary[];
    month: string;
}

export default function AttendanceReport({ summary, month }: Props) {
    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Laporan Kehadiran" />

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
                            <Users className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Kehadiran Karyawan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Laporan Kehadiran Karyawan
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            Periode: {month}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardContent className="p-0">
                    {summary.length === 0 ? (
                        <p className="py-8 text-center text-sm italic text-slate-500">
                            Belum ada data kehadiran untuk periode ini.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                        <th className="px-6 py-3.5 font-semibold">Posisi</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">Hadir</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">Terlambat</th>
                                        <th className="px-6 py-3.5 font-semibold text-right">Total Jam</th>
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
                                            <td className="px-6 py-4 text-center font-semibold text-[oklch(0.48_0.032_195.5)]">{emp.total_days}</td>
                                            <td className="px-6 py-4 text-center">
                                                {emp.late_days > 0 ? (
                                                    <span className="flex items-center justify-center gap-1 font-semibold text-amber-600">
                                                        <AlertTriangle className="size-3" />
                                                        {emp.late_days}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{emp.total_hours} jam</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

AttendanceReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Kehadiran', href: '/admin/reports/attendance' },
    ],
};

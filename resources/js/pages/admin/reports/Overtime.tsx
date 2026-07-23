import { Head, router } from '@inertiajs/react';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';

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
        <>
            <Head title="Laporan Lembur" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.get('/admin/reports')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                            Laporan Jam Lembur
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                            Periode: {month}
                        </p>
                    </div>
                </div>

                {summary.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <p className="text-center text-sm" style={{ color: '#8a968f' }}>
                                Tidak ada karyawan yang lembur pada periode ini.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <Clock className="size-5" style={{ color: PRIMARY }} />
                                Rekap Lembur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                            <th className="px-6 py-4 font-semibold">Karyawan</th>
                                            <th className="px-6 py-4 font-semibold">Posisi</th>
                                            <th className="px-6 py-4 font-semibold text-center">Hadir</th>
                                            <th className="px-6 py-4 font-semibold text-center">Hari Lembur</th>
                                            <th className="px-6 py-4 font-semibold text-right">Total Jam Lembur</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.map((emp) => (
                                            <tr key={emp.employee_id} className="border-b last:border-0 transition-colors hover:bg-[#F6F2E9]/30" style={{ borderColor: 'rgba(37,51,47,0.06)' }}>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium" style={{ color: DARK }}>{emp.name}</span>
                                                </td>
                                                <td className="px-6 py-4" style={{ color: '#5c6a66' }}>
                                                    {emp.position}
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold" style={{ color: PRIMARY }}>
                                                    {emp.total_attendance_days}
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold" style={{ color: DARK }}>
                                                    {emp.total_overtime_days}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold" style={{ color: DARK }}>
                                                    {emp.total_overtime_hours} jam
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

OvertimeReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Lembur', href: '/admin/reports/overtime' },
    ],
};

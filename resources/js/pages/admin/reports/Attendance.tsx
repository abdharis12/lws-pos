import { Head, router } from '@inertiajs/react';
import { Users, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';

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
        <>
            <Head title="Laporan Kehadiran" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.get('/admin/reports')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                            Laporan Kehadiran Karyawan
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                            Periode: {month}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {summary.length === 0 ? (
                            <p className="py-8 text-center text-sm" style={{ color: '#8a968f' }}>
                                Belum ada data kehadiran untuk periode ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                            <th className="px-6 py-4 font-semibold">Karyawan</th>
                                            <th className="px-6 py-4 font-semibold">Posisi</th>
                                            <th className="px-6 py-4 font-semibold text-center">Hadir</th>
                                            <th className="px-6 py-4 font-semibold text-center">Terlambat</th>
                                            <th className="px-6 py-4 font-semibold text-right">Total Jam</th>
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
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-semibold" style={{ color: PRIMARY }}>{emp.total_days}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {emp.late_days > 0 ? (
                                                        <span className="flex items-center justify-center gap-1 font-semibold" style={{ color: '#b8860b' }}>
                                                            <AlertTriangle className="size-3" />
                                                            {emp.late_days}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#8a968f' }}>0</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold" style={{ color: DARK }}>
                                                    {emp.total_hours} jam
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AttendanceReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Kehadiran', href: '/admin/reports/attendance' },
    ],
};

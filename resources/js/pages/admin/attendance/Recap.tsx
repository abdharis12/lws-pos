import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { ClipboardList, Download, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserData {
    id: number;
    name: string;
}

interface EmployeeData {
    id: number;
    user: UserData;
    position: string;
}

interface AttendanceData {
    id: number;
    employee_id: number;
    clock_in_at: string | null;
    clock_out_at: string | null;
    status: string;
    employee: EmployeeData;
}

interface DailyAttendance {
    clock_in: string | null;
    clock_out: string | null;
    status: string | null;
    attended: boolean;
}

interface SummaryItem {
    employee_id: number;
    employee_name: string;
    position: string;
    hadir: number;
    total_jam: number;
    terlambat: number;
    daily_attendance: Record<string, DailyAttendance>;
}

interface MonthlyStats {
    total_hadir: number;
    total_jam: number;
    total_terlambat: number;
}

interface Props {
    attendances: AttendanceData[];
    employees: EmployeeData[];
    summary: SummaryItem[];
    dates: string[];
    filterMonth: string;
    filterEmployeeId: string | null;
    monthlyStats: MonthlyStats;
}

export default function AttendanceRecap({
    attendances,
    employees,
    summary,
    dates,
    filterMonth,
    filterEmployeeId,
    monthlyStats,
}: Props) {
    const { data, setData, get, processing } = useForm({
        month: filterMonth,
        employee_id: filterEmployeeId ?? '',
    });

    function handleFilter() {
        get('/admin/attendance/recap', { preserveState: true });
    }

    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2026, i, 1);
        const value = date.toISOString().slice(0, 7);
        const label = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

        return { value, label };
    });

    return (
        <>
            <Head title="Rekap Absensi" />

            <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <ClipboardList className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Laporan Kehadiran</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Rekap Absensi
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            Laporan kehadiran karyawan
                        </p>
                    </div>
                    <Button variant="outline" className="gap-2 border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10">
                        <Download className="size-4" />
                        Export Excel
                    </Button>
                </div>

                <div className="flex flex-col gap-6">
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                <Filter className="size-4" />
                                Filter
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        Bulan
                                    </label>
                                    <select
                                        className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                        value={data.month}
                                        onChange={(e) => setData('month', e.target.value)}
                                    >
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        Karyawan
                                    </label>
                                    <select
                                        className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                        value={data.employee_id}
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                    >
                                        <option value="">Semua Karyawan</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    onClick={handleFilter}
                                    disabled={processing}
                                    className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                Ringkasan Bulanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                            <th className="px-6 py-3.5 font-semibold">Posisi</th>
                                            <th className="px-6 py-3.5 text-center font-semibold">Hadir</th>
                                            <th className="px-6 py-3.5 text-center font-semibold">Total Jam</th>
                                            <th className="px-6 py-3.5 text-center font-semibold">Terlambat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                        {summary.map((item) => (
                                            <tr key={item.employee_id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                                <td className="px-6 py-4 font-medium text-[oklch(0.48_0.032_195.5)]">
                                                    {item.employee_name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {item.position}
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                    {item.hadir}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-500">
                                                    {item.total_jam} jam
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.terlambat > 0 ? (
                                                        <Badge className="rounded-full bg-[oklch(0.80_0.038_88.5)]/20 font-semibold text-[oklch(0.80_0.038_88.5)]">
                                                            {item.terlambat}x
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {summary.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-sm italic text-slate-500">
                                                    Belum ada data absensi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Attendance Calendar */}
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                    Kalender Absensi Bulanan
                                </CardTitle>
                                <div className="flex items-center gap-4 text-xs">
                                    {monthlyStats.total_hadir > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">Total Hadir:</span>
                                            <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{monthlyStats.total_hadir}</span>
                                        </div>
                                    )}
                                    {monthlyStats.total_jam > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">Total Jam:</span>
                                            <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{Math.round(monthlyStats.total_jam / 60)} jam</span>
                                        </div>
                                    )}
                                    {monthlyStats.total_terlambat > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">Terlambat:</span>
                                            <span className="font-semibold text-[oklch(0.80_0.038_88.5)]">{monthlyStats.total_terlambat}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            <th className="sticky left-0 z-10 min-w-[160px] bg-[oklch(0.48_0.032_195.5)]/5 px-4 py-3.5 font-semibold">Karyawan</th>
                                            {dates.map((date) => {
                                                const d = new Date(date + 'T12:00:00');
                                                return (
                                                    <th
                                                        key={date}
                                                        className="min-w-[70px] px-2 py-3.5 text-center font-semibold"
                                                    >
                                                        <p className="text-[10px] text-slate-400">{d.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 2)}</p>
                                                        <p className="font-serif text-xs font-bold text-[oklch(0.48_0.032_195.5)]">{d.getDate()}</p>
                                                    </th>
                                                );
                                            })}
                                            <th className="px-4 py-3.5 text-center font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                        {summary.map((item) => (
                                            <tr key={item.employee_id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                                <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                                                    <p className="font-medium text-[oklch(0.48_0.032_195.5)]">{item.employee_name}</p>
                                                    <p className="text-[10px] text-slate-400">{item.position}</p>
                                                </td>
                                                {dates.map((date) => {
                                                    const daily = item.daily_attendance[date];
                                                    const isWeekend = date ? new Date(date + 'T12:00:00').getDay() === 0 || new Date(date + 'T12:00:00').getDay() === 6 : false;
                                                    
                                                    return (
                                                        <td key={date} className="px-2 py-2.5 text-center">
                                                            {daily.attended ? (
                                                                <div className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md bg-[oklch(0.48_0.032_195.5)]/10 px-1.5 py-1">
                                                                    <span className="text-[10px] font-medium text-[oklch(0.48_0.032_195.5)]">
                                                                        {daily.clock_in?.slice(0, 5)}
                                                                    </span>
                                                                    {daily.clock_out && (
                                                                        <span className="text-[10px] text-slate-500">
                                                                            -{daily.clock_out.slice(0, 5)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className={isWeekend ? 'text-slate-300' : 'text-slate-200'}>
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2.5 text-center font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                    {item.hadir}x
                                                </td>
                                            </tr>
                                        ))}
                                        {summary.length === 0 && (
                                            <tr>
                                                <td colSpan={dates.length + 2} className="py-12 text-center text-sm italic text-slate-500">
                                                    Belum ada data absensi untuk bulan ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-[oklch(0.48_0.032_195.5)]/5">
                                        <tr>
                                            <td className="sticky left-0 z-10 bg-[oklch(0.48_0.032_195.5)]/10 px-4 py-3 font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                Total
                                            </td>
                                            {dates.map((date) => {
                                                const dayCount = summary.reduce((count, item) => {
                                                    return item.daily_attendance[date]?.attended ? count + 1 : count;
                                                }, 0);
                                                return (
                                                    <td key={date} className="px-2 py-3 text-center font-medium text-slate-600">
                                                        {dayCount}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                {summary.reduce((sum, item) => sum + item.hadir, 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                Detail Absensi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                            <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                                            <th className="px-6 py-3.5 font-semibold">Clock-In</th>
                                            <th className="px-6 py-3.5 font-semibold">Clock-Out</th>
                                            <th className="px-6 py-3.5 text-center font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                        {attendances.map((att) => (
                                            <tr key={att.id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                                <td className="px-6 py-4 font-medium text-[oklch(0.48_0.032_195.5)]">
                                                    {att.employee.user.name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {att.clock_in_at ? new Date(att.clock_in_at).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {att.clock_in_at ? new Date(att.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {att.clock_out_at ? new Date(att.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {att.status === 'late' ? (
                                                        <Badge className="rounded-full bg-[oklch(0.80_0.038_88.5)]/20 font-semibold text-[oklch(0.80_0.038_88.5)]">
                                                            Terlambat
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="rounded-full bg-[oklch(0.48_0.032_195.5)]/10 font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                            Hadir
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {attendances.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-sm italic text-slate-500">
                                                    Belum ada data absensi.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AttendanceRecap.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Absensi', href: '/admin/attendance' },
        { title: 'Rekap', href: '/admin/attendance/recap' },
    ],
};

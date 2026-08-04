import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Calendar, ClipboardList, Download, Filter, Users } from 'lucide-react';
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
    early_leave: boolean;
    employee: EmployeeData;
}

interface DailyAttendance {
    clock_in: string | null;
    clock_out: string | null;
    status: string | null;
    attended: boolean;
    early_leave: boolean;
}

interface SummaryItem {
    employee_id: number;
    employee_name: string;
    position: string;
    hadir: number;
    total_jam: number;
    terlambat: number;
    pulang_cepat: number;
    daily_attendance: Record<string, DailyAttendance>;
}

interface MonthlyStats {
    total_hadir: number;
    total_jam: number;
    total_terlambat: number;
    total_pulang_cepat: number;
}

interface Props {
    attendances: AttendanceData[];
    employees: EmployeeData[];
    summary: SummaryItem[];
    dates: string[];
    filterMonth: string;
    filterEmployeeId: string | null;
    monthlyStats: MonthlyStats;
    isAdmin: boolean;
}

export default function AttendanceRecap({
    attendances,
    employees,
    summary,
    dates,
    filterMonth,
    filterEmployeeId,
    monthlyStats,
    isAdmin,
}: Props) {
    const { data, setData, get, processing } = useForm({
        month: filterMonth,
        employee_id: filterEmployeeId ?? '',
    });

    function handleFilter() {
        get('/attendance/recap', { preserveState: true });
    }

    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2026, i, 1);
        const value = date.toISOString().slice(0, 7);
        const label = date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
        });

        return { value, label };
    });

    const INK = 'oklch(0.48 0.032 195.5)';
    const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

    return (
        <>
            <Head title="Rekap Absensi" />

            <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ClipboardList className="size-3.5 text-[#4F6B6A]" />
                            <span>Laporan Kehadiran</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Rekap Absensi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Laporan kehadiran karyawan
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 border-[#CFC0A4]/40 text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                    >
                        <Download className="size-4" />
                        Export Excel
                    </Button>
                </div>

                <div className="flex flex-col gap-6">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                <Filter className="size-4" />
                                Filter
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-4 mt-5">
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Bulan
                                    </label>
                                    <select
                                        className="flex h-9 rounded-md border border-[#CFC0A4]/50 bg-white px-3 py-1 text-sm shadow-xs focus:border-[#4F6B6A] focus:ring-[#4F6B6A]"
                                        value={data.month}
                                        onChange={(e) =>
                                            setData('month', e.target.value)
                                        }
                                    >
                                        {months.map((m) => (
                                            <option
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {isAdmin && (
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Karyawan
                                        </label>
                                        <select
                                            className="flex h-9 rounded-md border border-[#CFC0A4]/50 bg-white px-3 py-1 text-sm shadow-xs focus:border-[#4F6B6A] focus:ring-[#4F6B6A]"
                                            value={data.employee_id}
                                            onChange={(e) =>
                                                setData(
                                                    'employee_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Semua Karyawan
                                            </option>
                                            {employees.map((emp) => (
                                                <option
                                                    key={emp.id}
                                                    value={emp.id}
                                                >
                                                    {emp.user.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button
                                    onClick={handleFilter}
                                    disabled={processing}
                                    className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                <Calendar className="size-4" />
                                Ringkasan Bulanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                            <th className="px-6 py-3.5 font-semibold">
                                                Karyawan
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Posisi
                                            </th>
                                            <th className="px-6 py-3.5 text-center font-semibold">
                                                Hadir
                                            </th>
                                            <th className="px-6 py-3.5 text-center font-semibold">
                                                Total Jam
                                            </th>
                                            <th className="px-6 py-3.5 text-center font-semibold">
                                                Terlambat
                                            </th>
                                            <th className="px-6 py-3.5 text-center font-semibold">
                                                Pulang Cepat
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#CFC0A4]/15">
                                        {summary.map((item) => (
                                            <tr
                                                key={item.employee_id}
                                                className="transition-colors hover:bg-[#CFC0A4]/5"
                                            >
                                                <td className="px-6 py-4 font-medium text-[#4F6B6A]">
                                                    {item.employee_name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {item.position}
                                                </td>
                                                <td className="px-6 py-4 text-center font-semibold text-[#4F6B6A]">
                                                    {item.hadir}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-500">
                                                    {item.total_jam} jam
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.terlambat > 0 ? (
                                                        <Badge className="rounded-full bg-[#CFC0A4]/20 font-semibold text-[#CFC0A4]">
                                                            {item.terlambat}x
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            0
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.pulang_cepat > 0 ? (
                                                        <Badge className="rounded-full bg-[#E11D48]/20 font-semibold text-[#E11D48]">
                                                            {item.pulang_cepat}x
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">
                                                            0
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {summary.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-8 text-center text-sm text-slate-500 italic"
                                                >
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
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                    <Calendar className="mr-2 size-4 text-[#4F6B6A]" />
                                    Kalender Absensi Bulanan
                                </CardTitle>
                                <div className="flex items-center gap-4 text-xs">
                                    {monthlyStats.total_hadir > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">
                                                Total Hadir:
                                            </span>
                                            <span className="font-semibold text-[#4F6B6A]">
                                                {monthlyStats.total_hadir}
                                            </span>
                                        </div>
                                    )}
                                    {monthlyStats.total_jam > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">
                                                Total Jam:
                                            </span>
                                            <span className="font-semibold text-[#4F6B6A]">
                                                {Math.round(
                                                    monthlyStats.total_jam / 60,
                                                )}{' '}
                                                jam
                                            </span>
                                        </div>
                                    )}
                                    {monthlyStats.total_terlambat > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">
                                                Terlambat:
                                            </span>
                                            <span className="font-semibold text-[#CFC0A4]">
                                                {monthlyStats.total_terlambat}
                                            </span>
                                        </div>
                                    )}
                                    {monthlyStats.total_pulang_cepat > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">
                                                Pulang Cepat:
                                            </span>
                                            <span className="font-semibold text-[#E11D48]">
                                                {
                                                    monthlyStats.total_pulang_cepat
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                            <th className="sticky left-0 z-10 min-w-[160px] bg-[#4F6B6A]/5 px-4 py-3.5 font-semibold">
                                                Karyawan
                                            </th>
                                            {dates.map((date) => {
                                                const d = new Date(
                                                    date + 'T12:00:00',
                                                );

                                                return (
                                                    <th
                                                        key={date}
                                                        className="min-w-[70px] px-2 py-3.5 text-center font-semibold"
                                                    >
                                                        <p className="text-[10px] text-slate-400">
                                                            {d
                                                                .toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        weekday:
                                                                            'short',
                                                                    },
                                                                )
                                                                .slice(0, 2)}
                                                        </p>
                                                        <p className="font-serif text-xs font-bold text-[#4F6B6A]">
                                                            {d.getDate()}
                                                        </p>
                                                    </th>
                                                );
                                            })}
                                            <th className="px-4 py-3.5 text-center font-semibold">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#CFC0A4]/15">
                                        {summary.map((item) => (
                                            <tr
                                                key={item.employee_id}
                                                className="transition-colors hover:bg-[#CFC0A4]/5"
                                            >
                                                <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                                                    <p className="font-medium text-[#4F6B6A]">
                                                        {item.employee_name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {item.position}
                                                    </p>
                                                </td>
                                                {dates.map((date) => {
                                                    const daily =
                                                        item.daily_attendance[
                                                        date
                                                        ];
                                                    const isWeekend = date
                                                        ? new Date(
                                                            date +
                                                            'T12:00:00',
                                                        ).getDay() === 0 ||
                                                        new Date(
                                                            date +
                                                            'T12:00:00',
                                                        ).getDay() === 6
                                                        : false;

                                                    return (
                                                        <td
                                                            key={date}
                                                            className="px-2 py-2.5 text-center"
                                                        >
                                                            {daily.attended ? (
                                                                <div className="inline-flex flex-col items-center justify-center gap-0.5 rounded-md bg-[#4F6B6A]/10 px-1.5 py-1">
                                                                    <span className="text-[10px] font-medium text-[#4F6B6A]">
                                                                        {daily.clock_in?.slice(
                                                                            0,
                                                                            5,
                                                                        )}
                                                                    </span>
                                                                    {daily.clock_out && (
                                                                        <span className="text-[10px] text-slate-500">
                                                                            -
                                                                            {daily.clock_out.slice(
                                                                                0,
                                                                                5,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                    {daily.early_leave && (
                                                                        <span className="text-[9px] font-semibold text-[#E11D48]">
                                                                            PC
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className={
                                                                        isWeekend
                                                                            ? 'text-slate-300'
                                                                            : 'text-slate-200'
                                                                    }
                                                                >
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2.5 text-center font-semibold text-[#4F6B6A]">
                                                    {item.hadir}x
                                                </td>
                                            </tr>
                                        ))}
                                        {summary.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={dates.length + 2}
                                                    className="py-12 text-center text-sm text-slate-500 italic"
                                                >
                                                    Belum ada data absensi untuk
                                                    bulan ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-[#4F6B6A]/5">
                                        <tr>
                                            <td className="sticky left-0 z-10 bg-[#4F6B6A]/10 px-4 py-3 font-semibold text-[#4F6B6A]">
                                                Total
                                            </td>
                                            {dates.map((date) => {
                                                const dayCount = summary.reduce(
                                                    (count, item) => {
                                                        return item
                                                            .daily_attendance[
                                                            date
                                                        ]?.attended
                                                            ? count + 1
                                                            : count;
                                                    },
                                                    0,
                                                );

                                                return (
                                                    <td
                                                        key={date}
                                                        className="px-2 py-3 text-center font-medium text-slate-600"
                                                    >
                                                        {dayCount}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center font-semibold text-[#4F6B6A]">
                                                {summary.reduce(
                                                    (sum, item) =>
                                                        sum + item.hadir,
                                                    0,
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                <Calendar className="size-4" />
                                Detail Absensi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                            <th className="px-6 py-3.5 font-semibold">
                                                Karyawan
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Tanggal
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Clock-In
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Clock-Out
                                            </th>
                                            <th className="px-6 py-3.5 text-center font-semibold">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#CFC0A4]/15">
                                        {attendances.map((att) => (
                                            <tr
                                                key={att.id}
                                                className="transition-colors hover:bg-[#CFC0A4]/5"
                                            >
                                                <td className="px-6 py-4 font-medium text-[#4F6B6A]">
                                                    {att.employee.user.name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {att.clock_in_at
                                                        ? new Date(
                                                            att.clock_in_at,
                                                        ).toLocaleDateString(
                                                            'id-ID',
                                                        )
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {att.clock_in_at
                                                        ? new Date(
                                                            att.clock_in_at,
                                                        ).toLocaleTimeString(
                                                            'id-ID',
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {att.clock_out_at
                                                        ? new Date(
                                                            att.clock_out_at,
                                                        ).toLocaleTimeString(
                                                            'id-ID',
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {att.status ===
                                                            'late' ? (
                                                            <Badge className="rounded-full bg-[#CFC0A4]/20 font-semibold text-[#CFC0A4]">
                                                                Terlambat
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="rounded-full bg-[#4F6B6A]/10 font-semibold text-[#4F6B6A]">
                                                                Hadir
                                                            </Badge>
                                                        )}
                                                        {att.early_leave && (
                                                            <Badge className="rounded-full bg-[#E11D48]/20 font-semibold text-[#E11D48]">
                                                                Pulang Cepat
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {attendances.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-8 text-center text-sm text-slate-500 italic"
                                                >
                                                    <div className="flex flex-col items-center px-6 py-12 text-center">
                                                        <div
                                                            className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                                            style={{ backgroundColor: INK_LIGHT }}
                                                        >
                                                            <Users
                                                                className="size-8"
                                                                style={{ color: INK }}
                                                            />
                                                        </div>
                                                        <h3
                                                            className="font-serif text-xl font-bold"
                                                            style={{ color: INK }}
                                                        >
                                                            Belum Ada Kehadiran
                                                        </h3>
                                                        <p
                                                            className="mt-1 max-w-sm text-sm"
                                                            style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                                        >
                                                            Belum ada karyawan yang melakukan absensi hari
                                                            ini.
                                                        </p>
                                                    </div>
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
        { title: 'Absensi', href: '/attendance' },
        { title: 'Rekap', href: '/attendance/recap' },
    ],
};

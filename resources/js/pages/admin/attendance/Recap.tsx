import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Download, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';

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

interface SummaryItem {
    employee_id: number;
    employee_name: string;
    position: string;
    hadir: number;
    total_jam: number;
    terlambat: number;
}

interface Props {
    attendances: AttendanceData[];
    employees: EmployeeData[];
    summary: SummaryItem[];
    filterMonth: string;
    filterEmployeeId: string | null;
}

export default function AttendanceRecap({
    attendances,
    employees,
    summary,
    filterMonth,
    filterEmployeeId,
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

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                            Rekap Absensi
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                            Laporan kehadiran karyawan
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2"
                        style={{ borderColor: 'rgba(79,107,106,0.3)', color: PRIMARY }}
                    >
                        <Download className="size-4" />
                        Export Excel
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium" style={{ color: '#5c6a66' }}>
                            <Filter className="size-4" />
                            Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                    Bulan
                                </label>
                                <select
                                    className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
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
                                <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                    Karyawan
                                </label>
                                <select
                                    className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
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
                                style={{ backgroundColor: PRIMARY, color: '#FAF8F5' }}
                            >
                                Terapkan Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-display text-lg" style={{ color: DARK }}>
                            Ringkasan Bulanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                        <th className="px-6 py-3 font-semibold">Karyawan</th>
                                        <th className="px-6 py-3 font-semibold">Posisi</th>
                                        <th className="px-6 py-3 text-center font-semibold">Hadir</th>
                                        <th className="px-6 py-3 text-center font-semibold">Total Jam</th>
                                        <th className="px-6 py-3 text-center font-semibold">Terlambat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map((item) => (
                                        <tr key={item.employee_id} className="border-b last:border-0 transition-colors hover:bg-[#F6F2E9]/30" style={{ borderColor: 'rgba(37,51,47,0.06)' }}>
                                            <td className="px-6 py-3 font-medium" style={{ color: DARK }}>
                                                {item.employee_name}
                                            </td>
                                            <td className="px-6 py-3" style={{ color: '#5c6a66' }}>
                                                {item.position}
                                            </td>
                                            <td className="px-6 py-3 text-center font-semibold" style={{ color: PRIMARY }}>
                                                {item.hadir}
                                            </td>
                                            <td className="px-6 py-3 text-center" style={{ color: '#5c6a66' }}>
                                                {item.total_jam} jam
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {item.terlambat > 0 ? (
                                                    <Badge
                                                        className="border-none font-semibold"
                                                        style={{ backgroundColor: 'rgba(207,192,164,0.2)', color: '#CFC0A4' }}
                                                    >
                                                        {item.terlambat}x
                                                    </Badge>
                                                ) : (
                                                    <span style={{ color: '#8a968f' }}>0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {summary.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: '#8a968f' }}>
                                                Belum ada data absensi.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-display text-lg" style={{ color: DARK }}>
                            Detail Absensi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                        <th className="px-6 py-3 font-semibold">Karyawan</th>
                                        <th className="px-6 py-3 font-semibold">Tanggal</th>
                                        <th className="px-6 py-3 font-semibold">Clock-In</th>
                                        <th className="px-6 py-3 font-semibold">Clock-Out</th>
                                        <th className="px-6 py-3 text-center font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.map((att) => (
                                        <tr key={att.id} className="border-b last:border-0 transition-colors hover:bg-[#F6F2E9]/30" style={{ borderColor: 'rgba(37,51,47,0.06)' }}>
                                            <td className="px-6 py-3 font-medium" style={{ color: DARK }}>
                                                {att.employee.user.name}
                                            </td>
                                            <td className="px-6 py-3" style={{ color: '#5c6a66' }}>
                                                {att.clock_in_at ? new Date(att.clock_in_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-3" style={{ color: '#5c6a66' }}>
                                                {att.clock_in_at ? new Date(att.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-3" style={{ color: '#5c6a66' }}>
                                                {att.clock_out_at ? new Date(att.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <Badge
                                                    className="border-none font-semibold"
                                                    style={{
                                                        backgroundColor: att.status === 'late' ? 'rgba(207,192,164,0.2)' : 'rgba(79,107,106,0.12)',
                                                        color: att.status === 'late' ? '#CFC0A4' : PRIMARY,
                                                    }}
                                                >
                                                    {att.status === 'late' ? 'Terlambat' : 'Hadir'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {attendances.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm" style={{ color: '#8a968f' }}>
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

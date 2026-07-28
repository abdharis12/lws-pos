import { Head, router } from '@inertiajs/react';
import { Users, AlertTriangle, CheckCircle, XCircle, Clock, ArrowLeft, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceDetail {
    date: string;
    clock_in: string;
    clock_out: string | null;
    status: string;
}

interface EmployeeSummary {
    employee_id: number;
    name: string;
    position: string;
    total_shift_days: number;
    hadir: number;
    terlambat: number;
    alfa: number;
    total_jam: number;
    persentase: number;
    attendances: AttendanceDetail[];
}

interface GrandTotal {
    total_shift_days: number;
    hadir: number;
    terlambat: number;
    alfa: number;
}

interface Props {
    summary: EmployeeSummary[];
    month: string;
    monthLabel: string;
    grandTotal: GrandTotal;
}

function generateMonths() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        months.push({ value, label });
    }
    return months;
}

function formatDate(date: string) {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function AttendanceReport({ summary, month, monthLabel, grandTotal }: Props) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const months = generateMonths();

    function toggleExpand(employeeId: number) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(employeeId)) {
                next.delete(employeeId);
            } else {
                next.add(employeeId);
            }
            return next;
        });
    }

    function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
        router.get('/admin/reports/attendance', { month: e.target.value }, { preserveState: true });
    }

    const totalKaryawan = summary.length;
    const adaShift = summary.filter((e) => e.total_shift_days > 0).length;

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
                            Laporan Kehadiran
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            Rekap kehadiran, keterlambatan, dan ketidakhadiran karyawan
                        </p>
                    </div>
                </div>
                <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                        Pilih Bulan
                    </label>
                    <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <select
                            value={month}
                            onChange={handleMonthChange}
                            className="flex h-10 w-64 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 pl-9 pr-3 py-2 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)] focus:outline-none"
                        >
                            {months.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex size-11 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10">
                            <Users className="size-5 text-[oklch(0.48_0.032_195.5)]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Karyawan</p>
                            <p className="font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">{totalKaryawan}</p>
                            <p className="text-[10px] text-slate-400">{adaShift} dengan shift</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle className="size-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Hadir</p>
                            <p className="font-serif text-2xl font-bold text-emerald-600">{grandTotal.hadir}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex size-11 items-center justify-center rounded-full bg-amber-100">
                            <AlertTriangle className="size-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Terlambat</p>
                            <p className="font-serif text-2xl font-bold text-amber-600">{grandTotal.terlambat}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex size-11 items-center justify-center rounded-full bg-red-100">
                            <XCircle className="size-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Alfa</p>
                            <p className="font-serif text-2xl font-bold text-red-600">{grandTotal.alfa}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Table */}
            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                    <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                        Detail Kehadiran — {monthLabel}
                    </CardTitle>
                </CardHeader>
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
                                        <th className="w-10 px-2 py-3.5"></th>
                                        <th className="px-6 py-3.5 font-semibold">Karyawan</th>
                                        <th className="px-6 py-3.5 font-semibold">Posisi</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">Shift</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">Hadir</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">Terlambat</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">Alfa</th>
                                        <th className="px-6 py-3.5 font-semibold text-center">% Kehadiran</th>
                                        <th className="px-6 py-3.5 font-semibold text-right">Total Jam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                    {summary.map((emp) => (
                                        <tr key={emp.employee_id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                            <td className="px-2 py-4 text-center">
                                                {emp.attendances.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleExpand(emp.employee_id)}
                                                        className="size-7 text-slate-400 hover:text-[oklch(0.48_0.032_195.5)]"
                                                    >
                                                        {expanded.has(emp.employee_id) ? (
                                                            <ChevronDown className="size-4" />
                                                        ) : (
                                                            <ChevronRight className="size-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{emp.position}</td>
                                            <td className="px-6 py-4 text-center font-medium text-slate-700">{emp.total_shift_days}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-semibold text-emerald-600">{emp.hadir}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {emp.terlambat > 0 ? (
                                                    <Badge variant="secondary" className="gap-1 border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                        <AlertTriangle className="size-3" />
                                                        {emp.terlambat}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {emp.alfa > 0 ? (
                                                    <span className="font-semibold text-red-500">{emp.alfa}</span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-full max-w-[80px] overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                emp.persentase >= 80
                                                                    ? 'bg-emerald-500'
                                                                    : emp.persentase >= 50
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${emp.persentase}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-semibold ${
                                                        emp.persentase >= 80
                                                            ? 'text-emerald-600'
                                                            : emp.persentase >= 50
                                                                ? 'text-amber-600'
                                                                : 'text-red-600'
                                                    }`}>
                                                        {emp.persentase}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-700">{emp.total_jam} jam</td>
                                        </tr>
                                    ))}
                                    {expanded.size > 0 && summary.map((emp) =>
                                        expanded.has(emp.employee_id) && emp.attendances.length > 0 ? (
                                            <tr key={`detail-${emp.employee_id}`}>
                                                <td colSpan={9} className="bg-[oklch(0.48_0.032_195.5)]/[0.02] px-0">
                                                    <div className="border-t border-[oklch(0.80_0.038_88.5)]/10">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                                                                    <th className="px-6 py-2 pl-16 font-medium">Tanggal</th>
                                                                    <th className="px-4 py-2 font-medium">Clock In</th>
                                                                    <th className="px-4 py-2 font-medium">Clock Out</th>
                                                                    <th className="px-4 py-2 font-medium">Status</th>
                                                                    <th className="px-4 py-2 font-medium text-right">Durasi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/5">
                                                                {emp.attendances.map((att, i) => {
                                                                    const durasi =
                                                                        att.clock_in && att.clock_out
                                                                            ? (() => {
                                                                                const [cih, cim] = att.clock_in.split(':').map(Number);
                                                                                const [coh, com] = att.clock_out.split(':').map(Number);
                                                                                const diff = coh * 60 + com - (cih * 60 + cim);
                                                                                const h = Math.floor(diff / 60);
                                                                                const m = diff % 60;
                                                                                return `${h}j ${m}m`;
                                                                            })()
                                                                            : '—';
                                                                    return (
                                                                        <tr key={i} className="hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                                                            <td className="px-6 py-2.5 pl-16 font-medium text-slate-700">{formatDate(att.date)}</td>
                                                                            <td className="px-4 py-2.5">
                                                                                <span className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-emerald-700">
                                                                                    <Clock className="size-3" />
                                                                                    {att.clock_in}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-2.5">
                                                                                {att.clock_out ? (
                                                                                    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-slate-700">
                                                                                        <Clock className="size-3" />
                                                                                        {att.clock_out}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="italic text-slate-400">Belum clock out</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-2.5">
                                                                                {att.status === 'late' ? (
                                                                                    <Badge variant="secondary" className="gap-1 border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">
                                                                                        <AlertTriangle className="size-2.5" />
                                                                                        Terlambat
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge variant="secondary" className="gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                                                        <CheckCircle className="size-2.5" />
                                                                                        Hadir
                                                                                    </Badge>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-2.5 text-right font-mono text-sm text-slate-500">{durasi}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : null
                                    )}
                                </tbody>
                                <tfoot className="border-t-2 border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/[0.02]">
                                    <tr className="text-xs font-semibold text-[oklch(0.48_0.032_195.5)]">
                                        <td></td>
                                        <td colSpan={1} className="px-6 py-3.5">Total</td>
                                        <td className="px-6 py-3.5 text-center">{grandTotal.total_shift_days}</td>
                                        <td className="px-6 py-3.5 text-center text-emerald-600">{grandTotal.hadir}</td>
                                        <td className="px-6 py-3.5 text-center text-amber-600">{grandTotal.terlambat}</td>
                                        <td className="px-6 py-3.5 text-center text-red-500">{grandTotal.alfa}</td>
                                        <td className="px-6 py-3.5 text-center">—</td>
                                        <td className="px-6 py-3.5 text-right">—</td>
                                    </tr>
                                </tfoot>
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

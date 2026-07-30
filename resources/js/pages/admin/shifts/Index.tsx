import { Head, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Calendar, Users, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface UserData {
    id: number;
    name: string;
}

interface EmployeeData {
    id: number;
    user: UserData;
    position: string;
}

interface ShiftData {
    id: number;
    employee_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    shift_number: number;
    employee: EmployeeData;
}

interface MonthlyEmployeeSummary {
    employee: EmployeeData;
    total: number;
}

interface MonthlyDaySummary {
    date: string;
    total: number;
}

interface Props {
    shifts: Record<string, ShiftData[]>;
    employees: EmployeeData[];
    dates: string[];
    weekStart: string;
    monthlyPerEmployee: MonthlyEmployeeSummary[];
    monthlyPerDay: MonthlyDaySummary[];
    monthlyGrandTotal: number;
    activeEmployeeCount: number;
    monthLabel: string;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');

    return {
        dayName: d.toLocaleDateString('id-ID', { weekday: 'long' }),
        dayNum: d.getDate(),
        full: dateStr,
    };
}

function formatDateShort(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');

    return {
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('id-ID', { month: 'short' }),
        year: d.getFullYear(),
        full: dateStr,
    };
}

function formatDateLong(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');

    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ShiftsIndex({ shifts, employees, dates, weekStart, monthlyPerEmployee, monthlyPerDay, monthlyGrandTotal, activeEmployeeCount, monthLabel }: Props) {
    const [editingShift, setEditingShift] = useState<ShiftData | null>(null);
    const [showMonthly, setShowMonthly] = useState(false);
    const [selectedDayShifts, setSelectedDayShifts] = useState<{ date: string; shifts: ShiftData[] } | null>(null);
    const [shiftToDelete, setShiftToDelete] = useState<ShiftData | null>(null);

    const todayStr = new Date().toISOString().slice(0, 10);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '',
        shift_date: todayStr,
        start_time: '08:00',
        end_time: '16:00',
        shift_number: '1',
    });

    function prevWeek() {
        const prev = new Date(weekStart + 'T12:00:00');
        prev.setDate(prev.getDate() - 7);
        router.get('/admin/shifts', { week_start: prev.toISOString().slice(0, 10) }, { preserveScroll: true, preserveState: false });
    }

    function nextWeek() {
        const next = new Date(weekStart + 'T12:00:00');
        next.setDate(next.getDate() + 7);
        router.get('/admin/shifts', { week_start: next.toISOString().slice(0, 10) }, { preserveScroll: true, preserveState: false });
    }

    function handleAddShift() {
        post('/admin/shifts', {
            onSuccess: () => reset('start_time', 'end_time', 'employee_id'),
        });
    }

    function handleBulkAssign() {
        const payload = employees
            .filter((emp) => {
                const dayShifts = shifts[data.shift_date] ?? [];
                return !dayShifts.some((s) => s.employee_id === emp.id);
            })
            .map((emp) => ({
                employee_id: String(emp.id),
                shift_date: data.shift_date,
                start_time: data.start_time,
                end_time: data.end_time,
            }));

        if (payload.length === 0) return;

        router.post('/admin/shifts/bulk', { shifts: payload }, {
            onSuccess: () => { },
        });
    }

    function handleDeleteShift(id: number) {
        const shift = Object.values(shifts).flat().find((s) => s.id === id) ?? null;
        setShiftToDelete(shift);
    }

    function confirmDeleteShift() {
        if (shiftToDelete) {
            destroy(`/admin/shifts/${shiftToDelete.id}`);
            setShiftToDelete(null);
        }
    }

    function cancelDeleteShift() {
        setShiftToDelete(null);
    }

    function handleEditShift(shift: ShiftData) {
        setEditingShift(shift);
        setData({
            employee_id: String(shift.employee_id),
            shift_date: shift.shift_date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_number: String(shift.shift_number),
        });
    }

    function handleUpdateShift() {
        if (!editingShift) {
            return;
        }

        setData({
            employee_id: String(editingShift.employee_id),
            shift_date: editingShift.shift_date,
            start_time: data.start_time,
            end_time: data.end_time,
            shift_number: data.shift_number,
        });
        put(`/admin/shifts/${editingShift.id}`, {
            onSuccess: () => {
                setEditingShift(null);
                reset();
            },
        });
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Shift" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <Calendar className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Jadwal Mingguan</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Jadwal Shift
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Kelola jadwal shift karyawan mingguan.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Week Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={prevWeek}
                        className="gap-1 border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                    >
                        <ChevronLeft className="size-4" />
                        Minggu Sebelumnya
                    </Button>
                    <span className="font-serif text-sm font-semibold text-[oklch(0.48_0.032_195.5)]">
                        {formatDateShort(dates[0]).dayName}, {formatDateShort(dates[0]).dayNum} {formatDateShort(dates[0]).month} {formatDateShort(dates[0]).year} — {formatDateShort(dates[6]).dayName}, {formatDateShort(dates[6]).dayNum} {formatDateShort(dates[6]).month} {formatDateShort(dates[6]).year}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextWeek}
                        className="gap-1 border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                    >
                        Minggu Berikutnya
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                {/* Add Shift Form */}
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            Tambah Shift
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Karyawan
                                </label>
                                <select
                                    className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                    value={data.employee_id}
                                    onChange={(e) => setData('employee_id', e.target.value)}
                                >
                                    <option value="">Pilih karyawan...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.user.name} — {emp.position}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Tanggal
                                </label>
                                <select
                                    className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                    value={data.shift_date}
                                    onChange={(e) => setData('shift_date', e.target.value)}
                                >
                                    {dates.map((d) => (
                                        <option key={d} value={d}>
                                            {formatDateShort(d).dayName}, {formatDateShort(d).dayNum} {formatDateShort(d).month} {formatDateShort(d).year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Jam Selesai
                                </label>
                                <input
                                    type="time"
                                    className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Shift
                                </label>
                                <select
                                    className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                    value={data.shift_number}
                                    onChange={(e) => setData('shift_number', e.target.value)}
                                >
                                    <option value="1">Shift 1</option>
                                    <option value="2">Shift 2</option>
                                </select>
                            </div>
                            <Button
                                onClick={handleAddShift}
                                disabled={!data.employee_id || processing}
                                className="gap-2 bg-[oklch(0.48_0.032_195.5)] font-serif text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                            >
                                <Plus className="size-4" />
                                Tambah
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBulkAssign}
                                disabled={false}
                                title="Terapkan jam yang sama ke semua karyawan yang belum memiliki shift di tanggal ini"
                            >
                                <Users className="size-4" />
                                Terapkan
                            </Button>
                        </div>
                        <InputError message={errors.shift_date} />
                    </CardContent>
                </Card>

                {/* Weekly Calendar Grid */}
                <div className="overflow-x-auto">
                    <div className="grid min-w-[800px] grid-cols-7 gap-3">
                        {dates.map((date) => {
                            const dayShifts = shifts[date] ?? [];
                            const { dayName, dayNum } = formatDate(date);
                            const isToday = date === new Date().toISOString().slice(0, 10);

                            return (
                                <div
                                    key={date}
                                    className={`rounded-xl border p-3 transition-all ${isToday
                                            ? 'border-[oklch(0.80_0.038_88.5)]/60 bg-[oklch(0.80_0.038_88.5)]/5 shadow-sm'
                                            : 'border-[oklch(0.80_0.038_88.5)]/20 bg-white/60'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDayShifts({ date, shifts: dayShifts })}
                                        className="mb-2 w-full text-center"
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            {dayName.slice(0, 3)}
                                        </p>
                                        <p className={`font-serif text-lg font-bold ${isToday ? 'text-[oklch(0.80_0.038_88.5)]' : 'text-slate-800'}`}>
                                            {dayNum}
                                        </p>
                                        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${dayShifts.length > 0
                                                ? 'bg-[oklch(0.48_0.032_195.5)]/10 text-[oklch(0.48_0.032_195.5)]'
                                                : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {dayShifts.length} shift
                                        </span>
                                    </button>
                                    <div className="space-y-1.5">
                                        {dayShifts.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="group relative cursor-pointer rounded-lg bg-[oklch(0.48_0.032_195.5)]/10 p-2 text-xs transition-colors hover:bg-[oklch(0.48_0.032_195.5)]/20"
                                                onClick={() => handleEditShift(shift)}
                                            >
                                                <p className="font-medium truncate text-[oklch(0.48_0.032_195.5)]">
                                                    {shift.employee.user.name}
                                                </p>
                                                <p className="text-slate-500">
                                                    S{shift.shift_number} {shift.start_time.slice(0, 5)} — {shift.end_time.slice(0, 5)}
                                                </p>
                                                <button
                                                    className="absolute top-1 right-1 hidden size-4 items-center justify-center rounded-full group-hover:flex hover:bg-red-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteShift(shift.id);
                                                    }}
                                                >
                                                    <Trash2 className="size-3 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Employee × Day Matrix Table */}
                <div className="overflow-x-auto">
                    <div className="rounded-xl border border-[oklch(0.80_0.038_88.5)]/20 bg-white/60">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-[oklch(0.48_0.032_195.5)]/5">
                                    <th className="sticky left-0 z-10 min-w-[160px] bg-[oklch(0.48_0.032_195.5)]/5 px-3 py-2.5 font-semibold text-[oklch(0.48_0.032_195.5)]">
                                        Karyawan
                                    </th>
                                    {dates.map((date) => {
                                        const { dayName, dayNum, month, year } = formatDateShort(date);
                                        const isToday = date === new Date().toISOString().slice(0, 10);
                                        return (
                                            <th
                                                key={date}
                                                className={`min-w-[110px] px-2 py-2.5 text-center font-semibold ${isToday ? 'text-[oklch(0.80_0.038_88.5)]' : 'text-[oklch(0.48_0.032_195.5)]'
                                                    }`}
                                            >
                                                <p>{dayName.slice(0, 3)}</p>
                                                <p className={`font-serif text-base ${isToday ? 'font-bold' : ''}`}>{dayNum}</p>
                                                <p className="text-[10px] font-normal text-slate-400">{month} {year}</p>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/10">
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan={dates.length + 1} className="px-3 py-8 text-center text-slate-400">
                                            Belum ada karyawan
                                        </td>
                                    </tr>
                                )}
                                {employees.map((emp) => {
                                    const empShifts = dates.map((date) => {
                                        const dayShifts = shifts[date] ?? [];
                                        return dayShifts.find((s) => s.employee_id === emp.id) ?? null;
                                    });
                                    const hasAnyShift = empShifts.some((s) => s !== null);
                                    return (
                                        <tr key={emp.id} className="transition-colors hover:bg-[oklch(0.48_0.032_195.5)]/[0.02]">
                                            <td className="sticky left-0 z-10 bg-white px-3 py-2.5">
                                                <p className="font-medium text-slate-800">{emp.user.name}</p>
                                                <p className="text-[10px] text-slate-400">{emp.position}</p>
                                            </td>
                                            {empShifts.map((shift, i) => (
                                                <td key={dates[i]} className="px-2 py-2.5 text-center align-middle">
                                                    {shift ? (
                                                        <div className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.48_0.032_195.5)]/8 px-2 py-1.5">
                                                            <span className="whitespace-nowrap font-medium text-[oklch(0.48_0.032_195.5)]">
                                                                S{shift.shift_number} {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditShift(shift);
                                                                }}
                                                                className="ml-0.5 rounded p-0.5 text-slate-400 transition-colors hover:bg-[oklch(0.48_0.032_195.5)]/10 hover:text-[oklch(0.48_0.032_195.5)]"
                                                                title="Edit shift"
                                                            >
                                                                <Pencil className="size-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteShift(shift.id);
                                                                }}
                                                                className="rounded p-0.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-500"
                                                                title="Hapus shift"
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Monthly Summary Toggle */}
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader
                        className="cursor-pointer border-b border-[oklch(0.80_0.038_88.5)]/20 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                        onClick={() => setShowMonthly(!showMonthly)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                                <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                    Rekapitulasi Bulanan — {monthLabel}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">
                                    {monthlyGrandTotal} shift dari {activeEmployeeCount} karyawan aktif
                                </span>
                                <ChevronRight className={`size-4 text-slate-400 transition-transform ${showMonthly ? 'rotate-90' : ''}`} />
                            </div>
                        </div>
                    </CardHeader>
                    {showMonthly && (
                        <CardContent className="pt-5">
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Per Day Table */}
                                <div>
                                    <h4 className="mb-3 font-serif text-sm font-semibold text-[oklch(0.48_0.032_195.5)]">
                                        Per Hari
                                    </h4>
                                    <div className="overflow-x-auto rounded-lg border border-[oklch(0.80_0.038_88.5)]/20">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[oklch(0.48_0.032_195.5)]/5">
                                                    <th className="px-3 py-2 font-semibold text-[oklch(0.48_0.032_195.5)]">Tanggal</th>
                                                    <th className="px-3 py-2 text-right font-semibold text-[oklch(0.48_0.032_195.5)]">Jumlah Shift</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/10">
                                                {monthlyPerDay.map((row) => {
                                                    const { dayName, dayNum, month, year } = formatDateShort(row.date);
                                                    return (
                                                        <tr key={row.date} className="transition-colors hover:bg-[oklch(0.48_0.032_195.5)]/[0.02]">
                                                            <td className="px-3 py-2 text-slate-700">
                                                                {dayName}, {dayNum} {month} {year}
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-medium text-slate-800">
                                                                {row.total}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-[oklch(0.48_0.032_195.5)]/5">
                                                <tr>
                                                    <td className="px-3 py-2 font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                        Total
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                        {monthlyGrandTotal}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Per Employee Table */}
                                <div>
                                    <h4 className="mb-3 font-serif text-sm font-semibold text-[oklch(0.48_0.032_195.5)]">
                                        Per Karyawan
                                    </h4>
                                    <div className="overflow-x-auto rounded-lg border border-[oklch(0.80_0.038_88.5)]/20">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-[oklch(0.48_0.032_195.5)]/5">
                                                    <th className="px-3 py-2 font-semibold text-[oklch(0.48_0.032_195.5)]">Karyawan</th>
                                                    <th className="px-3 py-2 text-right font-semibold text-[oklch(0.48_0.032_195.5)]">Jumlah Shift</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/10">
                                                {monthlyPerEmployee.map((row) => (
                                                    <tr key={row.employee.id} className="transition-colors hover:bg-[oklch(0.48_0.032_195.5)]/[0.02]">
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {row.employee.user.name}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                                                            {row.total}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-[oklch(0.48_0.032_195.5)]/5">
                                                <tr>
                                                    <td className="px-3 py-2 font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                        Total
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                        {monthlyGrandTotal}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Day Shift Popup */}
                {selectedDayShifts && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedDayShifts(null)}>
                        <div className="mx-4 w-full max-w-md rounded-2xl border border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="mb-1 font-serif text-lg font-semibold text-[oklch(0.48_0.032_195.5)]">
                                Daftar Shift
                            </h3>
                            <p className="mb-4 text-sm text-slate-500">{formatDateLong(selectedDayShifts.date)}</p>
                            {selectedDayShifts.shifts.length === 0 ? (
                                <p className="py-4 text-center text-sm text-slate-400">Tidak ada shift di hari ini.</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedDayShifts.shifts.map((shift) => (
                                        <div
                                            key={shift.id}
                                            className="flex items-center justify-between rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 bg-white/80 px-3 py-2.5 text-sm"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-800">{shift.employee.user.name}</p>
                                                <p className="text-xs text-slate-400">{shift.employee.position}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="whitespace-nowrap rounded-md bg-[oklch(0.48_0.032_195.5)]/10 px-2.5 py-1 font-medium text-[oklch(0.48_0.032_195.5)]">
                                                    S{shift.shift_number} {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDayShifts(null);
                                                        handleEditShift(shift);
                                                    }}
                                                    className="rounded p-1 text-slate-400 transition-colors hover:bg-[oklch(0.48_0.032_195.5)]/10 hover:text-[oklch(0.48_0.032_195.5)]"
                                                    title="Edit shift"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedDayShifts(null)}
                                    className="border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Shift Modal */}
                {editingShift && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="w-full max-w-sm rounded-2xl border border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] p-6 shadow-xl">
                            <h3 className="mb-4 font-serif text-lg font-semibold text-[oklch(0.48_0.032_195.5)]">
                                Edit Shift
                            </h3>
                            <div className="space-y-3">
                                <div className="rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/[0.02] p-3 text-sm">
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                                        <span className="text-slate-400">Nama Karyawan</span>
                                        <span className="font-medium text-slate-800">{editingShift.employee.user.name}</span>
                                        <span className="text-slate-400">Posisi</span>
                                        <span className="text-slate-600">{editingShift.employee.position}</span>
                                        <span className="text-slate-400">Tanggal</span>
                                        <span className="text-slate-600">{formatDateLong(editingShift.shift_date)}</span>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        Jam Mulai
                                    </label>
                                    <input
                                        type="time"
                                        className="flex h-9 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        Jam Selesai
                                    </label>
                                    <input
                                        type="time"
                                        className="flex h-9 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleUpdateShift}
                                        disabled={processing}
                                        className="flex-1 bg-[oklch(0.48_0.032_195.5)] font-serif text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                                    >
                                        Simpan
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditingShift(null);
                                            reset();
                                        }}
                                        className="flex-1 border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!shiftToDelete} onOpenChange={(open) => !open && setShiftToDelete(null)}>
                    <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                                <Trash2 className="size-6 text-rose-600" />
                            </div>
                            <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                Hapus Shift
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus shift <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{shiftToDelete?.employee.user.name}</span> pada <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{formatDateLong(shiftToDelete?.shift_date ?? '')}</span>? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-center">
                            <Button
                                variant="ghost"
                                onClick={cancelDeleteShift}
                                className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={confirmDeleteShift}
                                disabled={processing}
                                className="bg-rose-700 text-white hover:bg-rose-800"
                            >
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Shift', href: '/admin/shifts' },
    ],
};

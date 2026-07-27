import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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

interface ShiftData {
    id: number;
    employee_id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    employee: EmployeeData;
}

interface Props {
    shifts: Record<string, ShiftData[]>;
    employees: EmployeeData[];
    dates: string[];
    weekStart: string;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');

    return {
        dayName: d.toLocaleDateString('id-ID', { weekday: 'long' }),
        dayNum: d.getDate(),
        full: dateStr,
    };
}

export default function ShiftsIndex({ shifts, employees, dates, weekStart }: Props) {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedDate, setSelectedDate] = useState(dates[0]);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('16:00');
    const [editingShift, setEditingShift] = useState<ShiftData | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '',
        shift_date: '',
        start_time: '',
        end_time: '',
    });

    const { data: bulkData, setData: setBulkData, post: bulkPost, processing: bulkProcessing } = useForm({
        shifts: [] as { employee_id: string; shift_date: string; start_time: string; end_time: string }[],
    });

    function prevWeek() {
        const prev = new Date(weekStart + 'T12:00:00');
        prev.setDate(prev.getDate() - 7);
        window.location.href = `/admin/shifts?week_start=${prev.toISOString().slice(0, 10)}`;
    }

    function nextWeek() {
        const next = new Date(weekStart + 'T12:00:00');
        next.setDate(next.getDate() + 7);
        window.location.href = `/admin/shifts?week_start=${next.toISOString().slice(0, 10)}`;
    }

    function handleAddShift() {
        setData({
            employee_id: selectedEmployee,
            shift_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
        });
        post('/admin/shifts', {
            onSuccess: () => {
                setSelectedEmployee('');
                setStartTime('08:00');
                setEndTime('16:00');
            },
        });
    }

    function handleDeleteShift(id: number) {
        if (confirm('Hapus shift ini?')) {
            destroy(`/admin/shifts/${id}`);
        }
    }

    function handleEditShift(shift: ShiftData) {
        setEditingShift(shift);
        setData({
            employee_id: String(shift.employee_id),
            shift_date: shift.shift_date,
            start_time: shift.start_time,
            end_time: shift.end_time,
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
                        {formatDate(dates[0]).dayName}, {formatDate(dates[0]).dayNum} — {formatDate(dates[6]).dayName}, {formatDate(dates[6]).dayNum}
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
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
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
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                >
                                    {dates.map((d) => (
                                        <option key={d} value={d}>
                                            {formatDate(d).dayName}, {formatDate(d).dayNum}
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
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Jam Selesai
                                </label>
                                <input
                                    type="time"
                                    className="flex h-9 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleAddShift}
                                disabled={!selectedEmployee || processing}
                                className="gap-2 bg-[oklch(0.48_0.032_195.5)] font-serif text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                            >
                                <Plus className="size-4" />
                                Tambah
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
                                    className={`rounded-xl border p-3 transition-all ${
                                        isToday
                                            ? 'border-[oklch(0.80_0.038_88.5)]/60 bg-[oklch(0.80_0.038_88.5)]/5 shadow-sm'
                                            : 'border-[oklch(0.80_0.038_88.5)]/20 bg-white/60'
                                    }`}
                                >
                                    <div className="mb-2 text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            {dayName.slice(0, 3)}
                                        </p>
                                        <p className={`font-serif text-lg font-bold ${isToday ? 'text-[oklch(0.80_0.038_88.5)]' : 'text-slate-800'}`}>
                                            {dayNum}
                                        </p>
                                    </div>
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
                                                    {shift.start_time.slice(0, 5)} — {shift.end_time.slice(0, 5)}
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

                {/* Edit Shift Modal */}
                {editingShift && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="w-full max-w-sm rounded-2xl border border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] p-6 shadow-xl">
                            <h3 className="mb-4 font-serif text-lg font-semibold text-[oklch(0.48_0.032_195.5)]">
                                Edit Shift
                            </h3>
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600">
                                    {editingShift.employee.user.name} — {formatDate(editingShift.shift_date).dayName}, {editingShift.shift_date}
                                </p>
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

import { Head, Link } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';
const SAND = '#CFC0A4';

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
        if (!editingShift) return;
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
        <>
            <Head title="Shift" />

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                        Jadwal Shift
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                        Kelola jadwal shift karyawan mingguan
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={prevWeek} className="gap-1" style={{ borderColor: 'rgba(79,107,106,0.3)', color: PRIMARY }}>
                        <ChevronLeft className="size-4" />
                        Minggu Sebelumnya
                    </Button>
                    <span className="font-display text-sm font-semibold" style={{ color: DARK }}>
                        {formatDate(dates[0]).dayName}, {formatDate(dates[0]).dayNum} — {formatDate(dates[6]).dayName}, {formatDate(dates[6]).dayNum}
                    </span>
                    <Button variant="outline" size="sm" onClick={nextWeek} className="gap-1" style={{ borderColor: 'rgba(79,107,106,0.3)', color: PRIMARY }}>
                        Minggu Berikutnya
                        <ChevronRight className="size-4" />
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-display text-lg" style={{ color: DARK }}>
                            Tambah Shift
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                    Karyawan
                                </label>
                                <select
                                    className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
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
                                <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                    Tanggal
                                </label>
                                <select
                                    className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
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
                                <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                    Jam Selesai
                                </label>
                                <input
                                    type="time"
                                    className="flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleAddShift}
                                disabled={!selectedEmployee || processing}
                                className="gap-2"
                                style={{ backgroundColor: PRIMARY, color: '#FAF8F5' }}
                            >
                                <Plus className="size-4" />
                                Tambah
                            </Button>
                        </div>
                        <InputError message={errors.shift_date} />
                    </CardContent>
                </Card>

                <div className="overflow-x-auto">
                    <div className="grid min-w-[800px] grid-cols-7 gap-3">
                        {dates.map((date) => {
                            const dayShifts = shifts[date] ?? [];
                            const { dayName, dayNum } = formatDate(date);
                            const isToday = date === new Date().toISOString().slice(0, 10);

                            return (
                                <div
                                    key={date}
                                    className="rounded-xl border p-3"
                                    style={{
                                        borderColor: isToday ? SAND : 'rgba(37,51,47,0.08)',
                                        backgroundColor: isToday ? 'rgba(207,192,164,0.05)' : '#fff',
                                    }}
                                >
                                    <div className="mb-2 text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5c6a66' }}>
                                            {dayName.slice(0, 3)}
                                        </p>
                                        <p
                                            className="font-display text-lg font-bold"
                                            style={{ color: isToday ? SAND : DARK }}
                                        >
                                            {dayNum}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        {dayShifts.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="group relative cursor-pointer rounded-lg p-2 text-xs transition-colors hover:opacity-80"
                                                style={{ backgroundColor: 'rgba(79,107,106,0.1)', color: DARK }}
                                                onClick={() => handleEditShift(shift)}
                                            >
                                                <p className="font-medium truncate">
                                                    {shift.employee.user.name}
                                                </p>
                                                <p style={{ color: '#5c6a66' }}>
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

                {editingShift && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                            <h3 className="mb-4 font-display text-lg font-semibold" style={{ color: DARK }}>
                                Edit Shift
                            </h3>
                            <div className="space-y-4">
                                <p className="text-sm" style={{ color: '#5c6a66' }}>
                                    {editingShift.employee.user.name} — {formatDate(editingShift.shift_date).dayName}, {editingShift.shift_date}
                                </p>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                        Jam Mulai
                                    </label>
                                    <input
                                        type="time"
                                        className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                        style={{ borderColor: 'rgba(37,51,47,0.2)' }}
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-medium" style={{ color: '#5c6a66' }}>
                                        Jam Selesai
                                    </label>
                                    <input
                                        type="time"
                                        className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                        style={{ borderColor: 'rgba(37,51,47,0.2)' }}
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleUpdateShift}
                                        disabled={processing}
                                        className="flex-1"
                                        style={{ backgroundColor: PRIMARY, color: '#FAF8F5' }}
                                    >
                                        Simpan
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setEditingShift(null); reset(); }}
                                        className="flex-1"
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Shift', href: '/admin/shifts' },
    ],
};

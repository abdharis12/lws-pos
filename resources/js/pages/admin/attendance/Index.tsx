import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Camera, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';

interface UserData {
    id: number;
    name: string;
    email: string;
}

interface EmployeeData {
    id: number;
    user: UserData;
    position: string;
    is_active: boolean;
}

interface AttendanceData {
    id: number;
    employee_id: number;
    clock_in_at: string | null;
    clock_out_at: string | null;
    photo_path_in: string | null;
    photo_path_out: string | null;
    status: string;
    employee: EmployeeData;
}

interface OutletData {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    geofence_radius_meters: number | null;
}

interface Props {
    attendances: AttendanceData[];
    employees: EmployeeData[];
    todayAttendance: Record<number, AttendanceData>;
    stats: {
        hadir: number;
        belum_absen: number;
        total_karyawan: number;
    };
    outlet: OutletData;
}

export default function AttendanceIndex({
    attendances,
    employees,
    todayAttendance,
    stats,
    outlet,
}: Props) {
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { data: inData, setData: setInData, post: postIn, processing: inProcessing, errors: inErrors, reset: resetIn } = useForm({
        employee_id: '',
        photo: null as File | null,
        latitude: '',
        longitude: '',
    });

    const { data: outData, setData: setOutData, post: postOut, processing: outProcessing, errors: outErrors, reset: resetOut } = useForm({
        employee_id: '',
        photo: null as File | null,
        latitude: '',
        longitude: '',
    });

    function getLocation() {
        return new Promise<{ lat: string; lng: string } | null>((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
                () => resolve(null),
                { timeout: 5000 },
            );
        });
    }

    async function handleClockIn() {
        if (!selectedEmployee) return;

        const loc = await getLocation();
        setInData({
            employee_id: String(selectedEmployee),
            photo: photoFile,
            latitude: loc?.lat ?? '',
            longitude: loc?.lng ?? '',
        });
        postIn('/admin/attendance/clock-in', {
            forceFormData: true,
            onSuccess: () => {
                setSelectedEmployee(null);
                setPhotoFile(null);
                setPhotoPreview(null);
                resetIn();
            },
        });
    }

    async function handleClockOut(employeeId: number) {
        const loc = await getLocation();
        setOutData({
            employee_id: String(employeeId),
            photo: outData.photo,
            latitude: loc?.lat ?? '',
            longitude: loc?.lng ?? '',
        });
        postOut('/admin/attendance/clock-out', {
            forceFormData: true,
            onSuccess: () => {
                setOutData('employee_id', '');
                setOutData('photo', null);
                resetOut();
            },
        });
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setInData('photo', file);
            const reader = new FileReader();
            reader.onload = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            <Head title="Absensi" />

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                        Absensi Karyawan
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                        {dateStr} — {timeStr}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Hadir
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                {stats.hadir}
                            </p>
                            <p className="text-xs" style={{ color: '#8a968f' }}>
                                Dari {stats.total_karyawan} karyawan
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Belum Absen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                {stats.belum_absen}
                            </p>
                            <p className="text-xs" style={{ color: '#8a968f' }}>
                                Karyawan tanpa clock-in
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Total Karyawan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                {stats.total_karyawan}
                            </p>
                            <p className="text-xs" style={{ color: '#8a968f' }}>
                                Karyawan aktif
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-display text-lg" style={{ color: DARK }}>
                                Clock-In
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                    Pilih Karyawan
                                </label>
                                <select
                                    className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                    style={{ borderColor: 'rgba(37,51,47,0.2)' }}
                                    value={selectedEmployee ?? ''}
                                    onChange={(e) => {
                                        const id = e.target.value ? Number(e.target.value) : null;
                                        setSelectedEmployee(id);
                                        setInData('employee_id', e.target.value);
                                    }}
                                >
                                    <option value="">Pilih karyawan...</option>
                                    {employees.map((emp) => {
                                        const alreadyIn = todayAttendance[emp.id] && !todayAttendance[emp.id].clock_out_at;
                                        return (
                                            <option key={emp.id} value={emp.id} disabled={!!alreadyIn}>
                                                {emp.user.name} — {emp.position}
                                                {alreadyIn ? ' (sudah clock-in)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <InputError message={inErrors.employee_id} />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                    Foto Selfie
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-[#F6F2E9]" style={{ borderColor: 'rgba(37,51,47,0.2)' }}>
                                        <Camera className="size-4" style={{ color: PRIMARY }} />
                                        <span style={{ color: '#5c6a66' }}>Ambil Foto</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                    {photoPreview && (
                                        <img src={photoPreview} alt="Preview" className="h-14 w-14 rounded-full object-cover" />
                                    )}
                                </div>
                            </div>

                            {outlet.latitude && outlet.longitude && (
                                <div className="flex items-center gap-2 text-xs" style={{ color: '#8a968f' }}>
                                    <MapPin className="size-3" />
                                    Geofencing aktif ({outlet.geofence_radius_meters ?? 100}m radius)
                                </div>
                            )}

                            <InputError message={inErrors.photo} />

                            <Button
                                onClick={handleClockIn}
                                disabled={!selectedEmployee || inProcessing}
                                className="w-full gap-2 font-semibold"
                                style={{ backgroundColor: PRIMARY, color: '#FAF8F5' }}
                            >
                                <Clock className="size-4" />
                                {inProcessing ? 'Memproses...' : 'Clock-In'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-display text-lg" style={{ color: DARK }}>
                                Absensi Hari Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {attendances.length === 0 ? (
                                <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                    Belum ada absensi hari ini.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {attendances.map((att) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                            style={{ borderColor: 'rgba(37,51,47,0.08)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex size-9 items-center justify-center rounded-full text-sm font-semibold"
                                                    style={{ backgroundColor: 'rgba(79,107,106,0.12)', color: PRIMARY }}
                                                >
                                                    {att.employee.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: DARK }}>
                                                        {att.employee.user.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs" style={{ color: '#8a968f' }}>
                                                        <Clock className="size-3" />
                                                        {att.clock_in_at ? new Date(att.clock_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        {att.clock_out_at && (
                                                            <> → {new Date(att.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className="border-none font-semibold"
                                                    style={{
                                                        backgroundColor: att.status === 'late' ? 'rgba(207,192,164,0.2)' : 'rgba(79,107,106,0.12)',
                                                        color: att.status === 'late' ? '#CFC0A4' : PRIMARY,
                                                    }}
                                                >
                                                    {att.status === 'late' ? 'Terlambat' : 'Hadir'}
                                                </Badge>
                                                {!att.clock_out_at && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-xs"
                                                        onClick={() => handleClockOut(att.employee_id)}
                                                        disabled={outProcessing}
                                                        style={{ borderColor: 'rgba(207,192,164,0.4)', color: '#CFC0A4' }}
                                                    >
                                                        Clock-Out
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Absensi', href: '/admin/attendance' },
    ],
};

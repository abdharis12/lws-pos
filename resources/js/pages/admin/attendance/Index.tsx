import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Camera, Clock, MapPin, CheckCircle2, XCircle, UserCheck, Navigation, UserX, Users, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    early_leave: boolean;
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
    const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [distanceToOutlet, setDistanceToOutlet] = useState<number | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [geofenceAlert, setGeofenceAlert] = useState<{ open: boolean; isClockIn: boolean; loc: { lat: number; lng: number } } | null>(null);
    const [locationAlert, setLocationAlert] = useState<{ open: boolean; isClockIn: boolean; type: 'no_location' | 'no_gps'; employeeId?: number } | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const markerRef = useRef<unknown>(null);

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

    function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    useEffect(() => {
        if (!outlet.latitude || !outlet.longitude) return;

        let destroyed = false;

        async function initMap() {
            await import('leaflet/dist/leaflet.css');
            const L = (await import('leaflet')).default;

            const container = mapRef.current;
            if (destroyed || !container) return;

            const lat = outlet.latitude!;
            const lng = outlet.longitude!;
            const radius = outlet.geofence_radius_meters ?? 20;

            const mapInstance = L.map(container, { center: [lat, lng], zoom: 17, zoomControl: false });

            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 18,
            });

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; Esri',
                maxZoom: 18,
            });

            satelliteLayer.addTo(mapInstance);

            L.control.layers({ 'Satelit': satelliteLayer, 'Street': streetLayer }, undefined, { position: 'topleft' }).addTo(mapInstance);

            L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

            setTimeout(() => mapInstance.invalidateSize(), 200);

            L.circle([lat, lng], {
                radius,
                color: '#4F6B6A',
                fillColor: '#4F6B6A',
                fillOpacity: 0.08,
                weight: 2,
            }).addTo(mapInstance);

            L.marker([lat, lng])
                .addTo(mapInstance)
                .bindPopup(`<b>${outlet.name}</b><br>Radius: ${radius}m`);

            if (!destroyed) {
                mapInstanceRef.current = mapInstance;
            }
        }

        initMap();

        return () => {
            destroyed = true;
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove: () => void }).remove();
                mapInstanceRef.current = null;
            }
        };
    }, [outlet]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !userPosition) return;

        const { lat: userLat, lng: userLng } = userPosition;

        async function addUserMarker() {
            await import('leaflet/dist/leaflet.css');
            const L = (await import('leaflet')).default;

            const existing = (map as Record<string, unknown>).userMarker as L.Marker | undefined;
            if (existing) {
                existing.setLatLng([userLat, userLng]);
                return;
            }

            const blueIcon = L.divIcon({
                className: '',
                html: '<div style="width:24px;height:24px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            const marker = L.marker([userLat, userLng], { icon: blueIcon })
                .addTo(map as L.Map)
                .bindPopup('<b>Lokasi Anda</b>');

            (map as Record<string, unknown>).userMarker = marker;

            if (outlet.latitude && outlet.longitude) {
                const bounds = L.latLngBounds(
                    [userLat, userLng],
                    [outlet.latitude, outlet.longitude],
                );
                (map as L.Map).fitBounds(bounds.pad(0.3));
            }
        }

        addUserMarker();
    }, [userPosition, outlet.latitude, outlet.longitude]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation tidak didukung browser');

            return;
        }

        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            setGeoError('Akses via HTTPS diperlukan untuk GPS. Gunakan https://' + location.host);

            return;
        }

        let fallback = false;
        const opts = { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 };

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setUserPosition({ lat, lng });
                setGeoError(null);

                if (outlet.latitude && outlet.longitude) {
                    setDistanceToOutlet(haversineDistance(lat, lng, outlet.latitude, outlet.longitude));
                }
            },
            (err) => {
                if (!fallback && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
                    fallback = true;
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const { latitude: lat, longitude: lng } = pos.coords;
                            setUserPosition({ lat, lng });
                            setGeoError(null);
                            setDistanceToOutlet(haversineDistance(lat, lng, outlet.latitude!, outlet.longitude!));
                        },
                        () => setGeoError('Lokasi tidak terdeteksi. Pastikan situs diakses via HTTPS dan izin lokasi browser diaktifkan.'),
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
                    );
                } else if (!fallback) {
                    setGeoError('Gagal mendapatkan lokasi GPS');
                }
            },
            opts,
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [outlet.latitude, outlet.longitude, outlet.geofence_radius_meters]);

    async function getLocation() {
        if (userPosition) {
            return { lat: String(userPosition.lat), lng: String(userPosition.lng) };
        }

        return new Promise<{ lat: string; lng: string } | null>((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);

                return;
            }

            function attempt(highAccuracy: boolean) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }),
                    (err) => {
                        if (import.meta.env.DEV) {
                            console.warn('[GPS] getLocation attempt (highAccuracy=' + highAccuracy + ') failed:', err.code, err.message);
                        }
                        if (highAccuracy) {
                            attempt(false);
                        } else {
                            resolve(null);
                        }
                    },
                    {
                        enableHighAccuracy: highAccuracy,
                        timeout: highAccuracy ? 5000 : 10000,
                        maximumAge: 60000,
                    },
                );
            }

            attempt(true);
        });
    }

    function submitClockIn(loc?: { lat: string; lng: string }) {
        setInData({
            employee_id: String(selectedEmployee),
            photo: photoFile,
            latitude: loc?.lat ?? '',
            longitude: loc?.lng ?? '',
        });
        postIn('/attendance/clock-in', {
            forceFormData: true,
            onSuccess: () => {
                setSelectedEmployee(null);
                setPhotoFile(null);
                setPhotoPreview(null);
                resetIn();
            },
        });
    }

    async function handleClockIn() {
        if (!selectedEmployee) {
            return;
        }

        if (!outlet.latitude || !outlet.longitude) {
            setLocationAlert({ open: true, isClockIn: true, type: 'no_location' });
            return;
        }

        const loc = await getLocation();
        if (!loc) {
            setLocationAlert({ open: true, isClockIn: true, type: 'no_gps', employeeId: selectedEmployee });
            return;
        }

        const distance = haversineDistance(outlet.latitude, outlet.longitude, loc.lat, loc.lng);
        const radius = outlet.geofence_radius_meters ?? 20;

        if (distance > radius) {
            setGeofenceAlert({
                open: true,
                isClockIn: true,
                loc: { lat: loc.lat, lng: loc.lng },
            });
            return;
        }

        submitClockIn(loc);
    }

    function submitClockOut(employeeId: number, loc?: { lat: string; lng: string }) {
        setOutData({
            employee_id: String(employeeId),
            photo: outData.photo,
            latitude: loc?.lat ?? '',
            longitude: loc?.lng ?? '',
        });
        postOut('/attendance/clock-out', {
            forceFormData: true,
            onSuccess: () => {
                setOutData('employee_id', '');
                setOutData('photo', null);
                resetOut();
            },
        });
    }

    async function handleClockOut(employeeId: number) {
        if (!outlet.latitude || !outlet.longitude) {
            setLocationAlert({ open: true, isClockIn: false, type: 'no_location' });
            return;
        }

        const loc = await getLocation();
        if (!loc) {
            setLocationAlert({ open: true, isClockIn: false, type: 'no_gps', employeeId });
            return;
        }

        const distance = haversineDistance(outlet.latitude, outlet.longitude, loc.lat, loc.lng);
        const radius = outlet.geofence_radius_meters ?? 20;

        if (distance > radius) {
            setGeofenceAlert({
                open: true,
                isClockIn: false,
                loc: { lat: loc.lat, lng: loc.lng },
            });
            return;
        }

        submitClockOut(employeeId, loc);
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
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Absensi" />
            <div className="mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <UserCheck className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Sistem Kehadiran</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Absensi Karyawan
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            {dateStr} &mdash; {timeStr}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Stats Cards */}
                    <div className="hidden gap-5 md:grid md:grid-cols-3">
                                                
                        <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                            {/* Aksen garis atas */}
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />

                            <CardHeader className="flex flex-row items-start justify-between pt-5">
                                <div>
                                    <CardTitle className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#4F6B6A]/70">
                                        Hadir
                                    </CardTitle>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                    <CheckCircle2 className="h-4.5 w-4.5 text-[#4F6B6A]" strokeWidth={2} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
                                    {stats.hadir}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Dari <span className="font-medium text-slate-700">{stats.total_karyawan}</span> karyawan
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#CFC0A4] to-[#4F6B6A]" />

                            <CardHeader className="flex flex-row items-start justify-between pt-5">
                                <CardTitle className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#4F6B6A]/70">
                                    Belum Absen
                                </CardTitle>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CFC0A4]/25">
                                    <UserX className="h-4.5 w-4.5 text-[#4F6B6A]" strokeWidth={2} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
                                    {stats.belum_absen}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Karyawan tanpa clock-in
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                            <div className="absolute inset-x-0 top-0 h-1 bg-[#4F6B6A]" />

                            <CardHeader className="flex flex-row items-start justify-between pt-5">
                                <CardTitle className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#4F6B6A]/70">
                                    Total Karyawan
                                </CardTitle>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                    <Users className="h-4.5 w-4.5 text-[#4F6B6A]" strokeWidth={2} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
                                    {stats.total_karyawan}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Karyawan aktif
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Left Column: Clock-In + Daftar Absensi */}
                        <div className="flex flex-col gap-6">
                            {/* Clock-In Card */}
                            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                                    <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                        Clock-In
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            Pilih Karyawan
                                        </label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-1 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)]"
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
                                        <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            Foto Selfie
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-4 py-2 text-sm transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/10">
                                                <Camera className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                                                <span className="text-slate-600">Ambil Foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="user"
                                                    className="hidden"
                                                    onChange={handlePhotoChange}
                                                />
                                            </label>
                                            {photoPreview && (
                                                <img src={photoPreview} alt="Preview" className="h-14 w-14 rounded-full object-cover border border-[oklch(0.80_0.038_88.5)]/30" />
                                            )}
                                        </div>
                                    </div>

                                    {outlet.latitude && outlet.longitude && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <MapPin className="size-3" />
                                            Geofencing aktif ({outlet.geofence_radius_meters ?? 100}m radius)
                                        </div>
                                    )}

                                    <InputError message={inErrors.photo} />

                                    <Button
                                        onClick={handleClockIn}
                                        disabled={!selectedEmployee || inProcessing}
                                        className="w-full gap-2 bg-[oklch(0.48_0.032_195.5)] font-serif tracking-wider text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                                    >
                                        <Clock className="size-4" />
                                        {inProcessing ? 'Memproses...' : 'Clock-In'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Today's Attendance */}
                            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                                    <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                        Absensi Hari Ini
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    {attendances.length === 0 ? (
                                        <p className="py-4 text-center text-sm italic text-slate-500">
                                            Belum ada absensi hari ini.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {attendances.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="flex items-center justify-between rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 p-3 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-9 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10 font-serif text-sm font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                            {att.employee.user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">
                                                                {att.employee.user.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
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
                                                            className={`border-none font-semibold rounded-full ${
                                                                att.status === 'late'
                                                                    ? 'bg-[oklch(0.80_0.038_88.5)]/20 text-[oklch(0.80_0.038_88.5)]'
                                                                    : 'bg-[oklch(0.48_0.032_195.5)]/10 text-[oklch(0.48_0.032_195.5)]'
                                                            }`}
                                                        >
                                                            {att.status === 'late' ? 'Terlambat' : 'Hadir'}
                                                        </Badge>
                                                        {att.early_leave && att.clock_out_at && (
                                                            <Badge className="rounded-full border-none bg-[oklch(0.55_0.15_30)]/20 font-semibold text-[oklch(0.55_0.15_30)]">
                                                                Pulang Cepat
                                                            </Badge>
                                                        )}
                                                        {!att.clock_out_at && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="gap-1 text-xs"
                                                                onClick={() => handleClockOut(att.employee_id)}
                                                                disabled={outProcessing}
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

                        {/* Right Column: Map */}
                        {outlet.latitude && outlet.longitude ? (
                            <Card className="h-fit overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                            Peta Geofence
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-xs">
                                            {distanceToOutlet !== null && (
                                                <span
                                                    className={`flex items-center gap-1.5 font-medium ${
                                                        distanceToOutlet <= (outlet.geofence_radius_meters ?? 20)
                                                            ? 'text-emerald-600'
                                                            : 'text-red-500'
                                                    }`}
                                                >
                                                    {distanceToOutlet <= (outlet.geofence_radius_meters ?? 20) ? (
                                                        <CheckCircle2 className="size-3.5" />
                                                    ) : (
                                                        <XCircle className="size-3.5" />
                                                    )}
                                                    {distanceToOutlet < 1000
                                                        ? `${Math.round(distanceToOutlet)}m dari outlet`
                                                        : `${(distanceToOutlet / 1000).toFixed(1)}km dari outlet`}
                                                </span>
                                            )}
                                            {geoError && (
                                                <span className="flex items-center gap-1.5 text-amber-500">
                                                    <Navigation className="size-3.5" />
                                                    {geoError}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div
                                        ref={mapRef}
                                        className="h-[450px] w-full rounded-b-lg"
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                                    <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                        Peta Geofence
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <MapPin className="mb-3 size-10 text-slate-300" />
                                    <p className="mb-1 text-sm font-medium text-slate-600">Lokasi outlet belum diatur</p>
                                    <p className="mb-4 text-center text-xs text-slate-400">
                                        Atur lokasi outlet untuk mengaktifkan peta geofence dan validasi absensi.
                                    </p>
                                    <a
                                        href="/admin/outlet-settings"
                                        className="inline-flex items-center gap-1.5 rounded-md bg-[oklch(0.48_0.032_195.5)] px-4 py-2 text-xs font-medium text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                                    >
                                        <Navigation className="size-3.5" />
                                        Atur Lokasi Outlet
                                    </a>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Geofence Alert Dialog */}
                {geofenceAlert && (
                    <Dialog open={geofenceAlert.open} onOpenChange={() => setGeofenceAlert(null)}>
                        <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                            <DialogHeader>
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                                    <XCircle className="size-6 text-rose-600" />
                                </div>
                                <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                    {geofenceAlert.isClockIn ? 'Tidak Bisa Clock-In' : 'Tidak Bisa Clock-Out'}
                                </DialogTitle>
                                <DialogDescription className="text-center text-slate-500">
                                    Anda berada di luar radius geofence absensi. Anda harus berada dalam radius <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{outlet.geofence_radius_meters ?? 20}m</span> dari outlet untuk bisa {geofenceAlert.isClockIn ? 'clock-in' : 'clock-out'}.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => setGeofenceAlert(null)}
                                    className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                                >
                                    Tutup
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Location Alert Dialog */}
                {locationAlert && (
                    <Dialog open={locationAlert.open} onOpenChange={() => setLocationAlert(null)}>
                        <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                            <DialogHeader>
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100">
                                    <Navigation className="size-6 text-amber-600" />
                                </div>
                                <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                    {locationAlert.type === 'no_location' ? 'Lokasi Belum Dikonfigurasi' : 'GPS Tidak Tersedia'}
                                </DialogTitle>
                                <DialogDescription className="text-center text-slate-500">
                                    {locationAlert.type === 'no_location'
                                        ? 'Lokasi outlet belum diatur. Silakan atur lokasi di Pengaturan Outlet terlebih dahulu.'
                                        : 'Gagal mendapatkan lokasi. Pada Chrome desktop, akses via HTTPS diperlukan. Aktifkan juga izin lokasi (ikon gembok di address bar). Gunakan "Lanjutkan Tanpa Lokasi" untuk bypass.'}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:justify-center">
                                {locationAlert.type === 'no_gps' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const alert = locationAlert;
                                            setLocationAlert(null);
                                            if (alert.isClockIn && selectedEmployee) {
                                                submitClockIn();
                                            } else if (!alert.isClockIn && alert.employeeId) {
                                                submitClockOut(alert.employeeId);
                                            }
                                        }}
                                        className="border-amber-400 text-amber-700 hover:bg-amber-50"
                                    >
                                        Lanjutkan Tanpa Lokasi
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={() => setLocationAlert(null)}
                                    className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                                >
                                    Tutup
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Absensi', href: '/attendance' },
    ],
};

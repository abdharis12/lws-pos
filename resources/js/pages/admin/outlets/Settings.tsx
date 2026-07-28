import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';

interface OutletData {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
    geofence_radius_meters: number | null;
}

interface Props {
    outlet: OutletData;
}

export default function OutletSettings({ outlet }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const markerRef = useRef<unknown>(null);
    const circleRef = useRef<unknown>(null);

    const { data, setData, put, processing, errors } = useForm({
        name: outlet.name ?? '',
        latitude: outlet.latitude ?? -3.8467067,
        longitude: outlet.longitude ?? 103.9615719,
        geofence_radius_meters: outlet.geofence_radius_meters ?? 20,
    });

    const [locating, setLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ lat: string; lon: string; display_name: string }[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        async function initMap() {
            await import('leaflet/dist/leaflet.css');
            const L = (await import('leaflet')).default;

            const lat = data.latitude ?? -3.8467067;
            const lng = data.longitude ?? 103.9615719;
            const radius = data.geofence_radius_meters ?? 20;

            const map = L.map(mapRef.current!, {
                center: [lat, lng],
                zoom: 17,
                zoomControl: true,
            });

            const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            });

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; Esri',
                maxZoom: 19,
            });

            satelliteLayer.addTo(map);

            L.control.layers({ 'Satelit': satelliteLayer, 'Street': streetLayer }, undefined, { position: 'topleft' }).addTo(map);

            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            const circle = L.circle([lat, lng], {
                radius,
                color: '#4F6B6A',
                fillColor: '#4F6B6A',
                fillOpacity: 0.1,
                weight: 2,
            }).addTo(map);

            marker.bindPopup(`Radius: ${radius}m`).openPopup();

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                setData('latitude', Math.round(pos.lat * 1e7) / 1e7);
                setData('longitude', Math.round(pos.lng * 1e7) / 1e7);
                circle.setLatLng(pos);
                marker.setPopupContent(`Lat: ${pos.lat.toFixed(7)}, Lng: ${pos.lng.toFixed(7)}`).openPopup();
            });

            map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
                const { lat, lng } = e.latlng;
                const roundedLat = Math.round(lat * 1e7) / 1e7;
                const roundedLng = Math.round(lng * 1e7) / 1e7;
                setData('latitude', roundedLat);
                setData('longitude', roundedLng);
                marker.setLatLng([roundedLat, roundedLng]);
                circle.setLatLng([roundedLat, roundedLng]);
                marker.setPopupContent(`Lat: ${roundedLat}, Lng: ${roundedLng}`).openPopup();
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
            circleRef.current = circle;
        }

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove: () => void }).remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (circleRef.current && markerRef.current) {
            const radius = typeof data.geofence_radius_meters === 'number' ? data.geofence_radius_meters : 20;
            (circleRef.current as { setRadius: (r: number) => void }).setRadius(radius);
            (markerRef.current as { setPopupContent: (c: string) => void }).setPopupContent(`Radius: ${radius}m`);
        }
    }, [data.geofence_radius_meters]);

    function handleUseMyLocation() {
        if (!navigator.geolocation) return;
        setLocating(true);

        function updateLocation(pos: GeolocationPosition) {
            const { latitude, longitude, accuracy } = pos.coords;
            const lat = Math.round(latitude * 1e7) / 1e7;
            const lng = Math.round(longitude * 1e7) / 1e7;
            setData('latitude', lat);
            setData('longitude', lng);
            if (mapInstanceRef.current && markerRef.current && circleRef.current) {
                (markerRef.current as { setLatLng: (ll: [number, number]) => void }).setLatLng([lat, lng]);
                (circleRef.current as { setLatLng: (ll: [number, number]) => void }).setLatLng([lat, lng]);
                (mapInstanceRef.current as { setView: (ll: [number, number], z: number) => void }).setView([lat, lng], 17);
                const m = markerRef.current as { setPopupContent: (c: string) => void; openPopup: () => void };
                m.setPopupContent(`Lat: ${lat}, Lng: ${lng} (akurasi ±${accuracy?.toFixed(0) ?? '?'}m)`);
                m.openPopup();
            }
            setLocating(false);
        }

        function onError(err: GeolocationPositionError) {
            if (err.code === err.PERMISSION_DENIED) {
                setLocating(false);
                return;
            }
            // GPS gagal — fallback ke WiFi/cell
            navigator.geolocation.getCurrentPosition(
                updateLocation,
                () => setLocating(false),
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
            );
        }

        navigator.geolocation.getCurrentPosition(updateLocation, onError, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
        });
    }

    function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
        const q = e.target.value;
        setSearchQuery(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (q.trim().length < 3) {
            setSearchResults([]);
            return;
        }
        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&bounded=0`,
                    { headers: { 'Accept-Language': 'id' } },
                );
                if (!res.ok) return;
                const data = await res.json();
                setSearchResults(data);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);
    }

    function selectSearchResult(result: { lat: string; lon: string; display_name: string }) {
        const lat = Math.round(parseFloat(result.lat) * 1e7) / 1e7;
        const lng = Math.round(parseFloat(result.lon) * 1e7) / 1e7;
        setData('latitude', lat);
        setData('longitude', lng);
        setSearchQuery('');
        setSearchResults([]);
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            (markerRef.current as { setLatLng: (ll: [number, number]) => void }).setLatLng([lat, lng]);
            (circleRef.current as { setLatLng: (ll: [number, number]) => void }).setLatLng([lat, lng]);
            (mapInstanceRef.current as { setView: (ll: [number, number], z: number) => void }).setView([lat, lng], 17);
            const m = markerRef.current as { setPopupContent: (c: string) => void; openPopup: () => void };
            m.setPopupContent(result.display_name);
            m.openPopup();
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put('/admin/outlet-settings');
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Pengaturan Outlet" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <MapPin className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Pengaturan</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Pengaturan Outlet
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Atur lokasi dan radius geofence absensi
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            Informasi Outlet
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Nama Outlet
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-2 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)] focus:outline-none"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={data.latitude}
                                    onChange={(e) => setData('latitude', parseFloat(e.target.value) || 0)}
                                    className="flex h-10 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-2 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)] focus:outline-none"
                                />
                                <InputError message={errors.latitude} />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={data.longitude}
                                    onChange={(e) => setData('longitude', parseFloat(e.target.value) || 0)}
                                    className="flex h-10 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-2 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)] focus:outline-none"
                                />
                                <InputError message={errors.longitude} />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    Radius Geofence (meter)
                                </label>
                                <input
                                    type="number"
                                    min={5}
                                    max={1000}
                                    value={data.geofence_radius_meters}
                                    onChange={(e) => setData('geofence_radius_meters', parseInt(e.target.value) || 20)}
                                    className="flex h-10 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 px-3 py-2 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)] focus:outline-none"
                                />
                                <InputError message={errors.geofence_radius_meters} />
                                <p className="text-xs text-slate-400">Karyawan harus berada dalam radius ini untuk bisa clock-in/out</p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleUseMyLocation}
                                    disabled={locating}
                                    className="border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                                >
                                    <Navigation className={`mr-2 size-4 ${locating ? 'animate-spin' : ''}`} />
                                    {locating ? 'Mencari...' : 'Gunakan Lokasi Saya'}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]"
                                >
                                    <Save className="mr-2 size-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            Peta Lokasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="relative mb-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchInput}
                                    placeholder="Cari alamat…"
                                    className="flex h-10 w-full rounded-md border border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 pl-9 pr-3 py-2 text-sm shadow-xs focus:border-[oklch(0.48_0.032_195.5)] focus:ring-[oklch(0.48_0.032_195.5)] focus:outline-none"
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[oklch(0.48_0.032_195.5)] border-t-transparent" />
                                )}
                            </div>
                            {searchResults.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-[oklch(0.80_0.038_88.5)]/30 bg-white shadow-lg">
                                    {searchResults.map((r, i) => (
                                        <li key={i}>
                                            <button
                                                type="button"
                                                onClick={() => selectSearchResult(r)}
                                                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-[oklch(0.48_0.032_195.5)]/10 focus:bg-[oklch(0.48_0.032_195.5)]/10 focus:outline-none"
                                            >
                                                {r.display_name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <p className="mb-3 text-xs text-slate-400">Klik pada peta, geser marker, atau cari alamat untuk mengatur lokasi outlet</p>
                        <div
                            ref={mapRef}
                            className="h-[400px] w-full overflow-hidden rounded-lg border border-[oklch(0.80_0.038_88.5)]/30"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

OutletSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Outlet', href: '/admin/outlet-settings' },
    ],
};

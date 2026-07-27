import { Head, router } from '@inertiajs/react';
import { Search, X, ScrollText } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserData { id: number; name: string; }
interface LogData {
    id: number; user_id: number | null; action: string;
    subject_type: string | null; subject_id: number | null;
    description: string | null; metadata: any;
    created_at: string;
    user: UserData | null;
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface PaginationMeta {
    data: LogData[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    logs: PaginationMeta;
    actions: string[];
    filters: { action?: string; user_id?: string; start_date?: string; end_date?: string; };
}

const actionLabels: Record<string, string> = {
    void_order: 'Void Order',
    large_discount: 'Diskon Besar',
    price_change: 'Ubah Harga Menu',
    employee_deleted: 'Hapus Karyawan',
    order_created: 'Order Dibuat',
    order_paid: 'Order Dibayar',
    menu_created: 'Menu Dibuat',
    menu_updated: 'Menu Diperbarui',
    menu_deleted: 'Menu Dihapus',
    order_cancelled: 'Order Dibatalkan',
    menu_enabled: 'Menu Diaktifkan',
    menu_disabled: 'Menu Dinonaktifkan',
    order_status_processing: 'Order Diproses',
    order_status_ready: 'Order Siap',
    order_status_completed: 'Order Selesai',
};

function cleanParams(params: Record<string, any>): Record<string, any> {
    return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
}

function useDebounce(value: string, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

export default function ActivityLogs({ logs, actions, filters }: Props) {
    const [localStartDate, setLocalStartDate] = useState(filters.start_date ?? '');
    const [localEndDate, setLocalEndDate] = useState(filters.end_date ?? '');

    const debouncedStartDate = useDebounce(localStartDate, 500);
    const debouncedEndDate = useDebounce(localEndDate, 500);

    const prevDebouncedStart = useRef(filters.start_date ?? '');
    const prevDebouncedEnd = useRef(filters.end_date ?? '');

    useEffect(() => {
        const params: Record<string, any> = { page: 1 };

        if (debouncedStartDate !== prevDebouncedStart.current) {
            params.start_date = debouncedStartDate || '';
            prevDebouncedStart.current = debouncedStartDate;
        }

        if (debouncedEndDate !== prevDebouncedEnd.current) {
            params.end_date = debouncedEndDate || '';
            prevDebouncedEnd.current = debouncedEndDate;
        }

        if (params.start_date !== undefined || params.end_date !== undefined) {
            router.get('/admin/activity-logs', cleanParams({ ...filters, ...params }), {
                preserveScroll: true,
                preserveState: true,
            });
        }
    }, [debouncedStartDate, debouncedEndDate]);

    function visit(params: Record<string, any>) {
        router.get('/admin/activity-logs', cleanParams({ ...filters, ...params }), {
            preserveScroll: true,
        });
    }

    function resetFilters() {
        setLocalStartDate('');
        setLocalEndDate('');
        router.get('/admin/activity-logs', {}, { preserveScroll: true });
    }

    function handlePerPageChange(perPage: number) {
        router.get('/admin/activity-logs', cleanParams({ ...filters, per_page: perPage, page: 1 }), {
            preserveScroll: true,
        });
    }

    const hasFilters = filters.action || filters.start_date || filters.end_date;
    const selectedAction = filters.action ?? '';

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Log Aktivitas" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <ScrollText className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Riwayat Aktivitas</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Log Aktivitas
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Pantau riwayat aksi kritikal yang terjadi dalam sistem.
                    </p>
                </div>
            </div>

            {/* Filter Controls */}
            <Card className="mb-8 border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20 pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-base font-medium text-[oklch(0.48_0.032_195.5)]">
                            Filter Pencarian
                        </CardTitle>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="h-8 text-xs text-slate-500 hover:text-[oklch(0.48_0.032_195.5)]"
                            >
                                <X className="mr-1 size-3" />
                                Reset
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-1.5">
                            <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">
                                Aksi
                            </Label>
                            <Select
                                value={selectedAction}
                                onValueChange={(v) => visit({ action: v, page: 1 })}
                            >
                                <SelectTrigger className="w-48 border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                    <SelectValue placeholder="Semua aksi" />
                                </SelectTrigger>
                                <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                    <SelectItem value="">Semua aksi</SelectItem>
                                    {actions.map((a) => (
                                        <SelectItem key={a} value={a}>
                                            {actionLabels[a] ?? a}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">
                                Dari Tanggal
                            </Label>
                            <Input
                                type="date"
                                value={localStartDate}
                                onChange={(e) => setLocalStartDate(e.target.value)}
                                className="w-40 border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">
                                Sampai Tanggal
                            </Label>
                            <Input
                                type="date"
                                value={localEndDate}
                                onChange={(e) => setLocalEndDate(e.target.value)}
                                className="w-40 border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20 pb-3">
                    <CardTitle className="font-serif text-base font-medium text-[oklch(0.48_0.032_195.5)]">
                        Riwayat Aktivitas
                        <span className="ml-2 text-sm font-normal text-slate-500">
                            ({logs.total} entri)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    <th className="px-6 py-3.5 font-semibold">Waktu</th>
                                    <th className="px-6 py-3.5 font-semibold">User</th>
                                    <th className="px-6 py-3.5 font-semibold">Aksi</th>
                                    <th className="px-6 py-3.5 font-semibold">Deskripsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                {logs.data.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                                            {new Date(log.created_at).toLocaleString('id-ID', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {log.user?.name ?? (
                                                <span className="italic text-slate-400">Sistem</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="secondary"
                                                className="whitespace-nowrap rounded-full border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)]/10 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.48_0.032_195.5)]"
                                            >
                                                {actionLabels[log.action] ?? log.action}
                                            </Badge>
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-500">
                                            {log.description ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-sm text-slate-500"
                                        >
                                            {hasFilters
                                                ? 'Tidak ada aktivitas yang cocok dengan filter.'
                                                : 'Belum ada aktivitas.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={logs} onPerPageChange={handlePerPageChange} />
                </CardContent>
            </Card>
        </div>
    );
}

ActivityLogs.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Log Aktivitas', href: '/admin/activity-logs' },
    ],
};

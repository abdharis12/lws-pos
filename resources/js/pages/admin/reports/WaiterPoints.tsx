import { Head, router } from '@inertiajs/react';
import { Award, Calendar, Crown, HandPlatter, Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WaiterSummary {
    employee_id: number;
    name: string;
    position: string;
    points: number;
    rank: number;
}

interface Props {
    summary: WaiterSummary[];
    month: string;
    monthLabel: string;
    totalWaiters: number;
    totalPoints: number;
    topWaiter: string;
    maxPoints: number;
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

export default function WaiterPointsReport({
    summary,
    month,
    monthLabel,
    totalWaiters,
    totalPoints,
    topWaiter,
    maxPoints,
}: Props) {
    const months = generateMonths();

    function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
        router.get('/admin/reports/waiter-points', { month: e.target.value }, { preserveState: true });
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Poin Waiter" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <HandPlatter className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Performa Pelayanan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Rekapan Poin Waiter
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            1 poin untuk setiap pesanan yang diantar ke pelanggan
                        </p>
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
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Waiter Aktif</p>
                                <p className="font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">{totalWaiters}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100">
                                <Trophy className="size-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Poin</p>
                                <p className="font-serif text-2xl font-bold text-emerald-600">{totalPoints}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm sm:col-span-2 lg:col-span-2">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-full bg-amber-100">
                                <Crown className="size-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Waiter Terbaik</p>
                                <p className="font-serif text-xl font-bold text-amber-600">{topWaiter}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detail Table */}
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            Peringkat Poin Waiter — {monthLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {summary.length === 0 ? (
                            <p className="py-8 text-center text-sm italic text-slate-500">
                                Belum ada data waiter untuk periode ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                            <th className="px-6 py-3.5 font-semibold">Peringkat</th>
                                            <th className="px-6 py-3.5 font-semibold">Waiter</th>
                                            <th className="px-6 py-3.5 font-semibold">Posisi</th>
                                            <th className="px-6 py-3.5 font-semibold">Poin</th>
                                            <th className="px-6 py-3.5 font-semibold">Performa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                        {summary.map((waiter) => {
                                            const isTop = waiter.rank === 1;
                                            const pct = maxPoints > 0 ? Math.round((waiter.points / maxPoints) * 100) : 0;

                                            return (
                                                <tr key={waiter.employee_id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${isTop ? 'bg-amber-500 text-white' : 'bg-[oklch(0.48_0.032_195.5)]/10 text-[oklch(0.48_0.032_195.5)]'}`}
                                                        >
                                                            {waiter.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-2 font-medium text-slate-800">
                                                            {waiter.name}
                                                            {isTop && <Award className="size-4 text-amber-500" />}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 capitalize text-slate-500">{waiter.position}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`font-serif text-lg font-bold ${isTop ? 'text-amber-600' : 'text-[oklch(0.48_0.032_195.5)]'}`}>
                                                            {waiter.points}
                                                        </span>
                                                        <span className="ml-1 text-xs text-slate-400">poin</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

WaiterPointsReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Poin Waiter', href: '/admin/reports/waiter-points' },
    ],
};

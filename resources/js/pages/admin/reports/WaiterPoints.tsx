import { Head, router } from '@inertiajs/react';
import {
    Award,
    Calendar,
    Crown,
    DollarSign,
    HandPlatter,
    Trophy,
    Users,
} from 'lucide-react';
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
        const label = d.toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
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
        router.get(
            '/admin/reports/waiter-points',
            { month: e.target.value },
            { preserveState: true },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Poin Waiter" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <HandPlatter className="size-3.5 text-[#4F6B6A]" />
                            <span>Performa Pelayanan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Rekapan Poin Waiter
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            1 poin untuk setiap pesanan yang diantar ke
                            pelanggan
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                            Pilih Bulan
                        </label>
                        <div className="relative">
                            <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <select
                                value={month}
                                onChange={handleMonthChange}
                                className="flex h-10 w-64 rounded-md border border-[#CFC0A4]/50 bg-white py-2 pr-3 pl-9 text-sm shadow-xs focus:border-[#4F6B6A] focus:ring-[#4F6B6A] focus:outline-none"
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
                    <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                        <CardHeader className="flex flex-row items-start justify-between pt-5">
                            <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                                Waiter Aktif
                            </CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                <Users
                                    className="h-4.5 w-4.5 text-[#4F6B6A]"
                                    strokeWidth={2}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                <Users className="size-5 text-[#4F6B6A]" />
                            </div>
                            <div>
                                <p className="font-serif text-2xl font-bold text-[#4F6B6A]">
                                    {totalWaiters} Orang
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                        <CardHeader className="flex flex-row items-start justify-between pt-5">
                            <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                                Total Poin
                            </CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                <Trophy
                                    className="h-4.5 w-4.5 text-[#4F6B6A]"
                                    strokeWidth={2}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-full bg-pink-500/10">
                                <Trophy className="size-5 text-pink-500" />
                            </div>
                            <div>
                                <p className="font-serif text-2xl font-bold text-pink-500">
                                    {totalPoints} Poin
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                        <CardHeader className="flex flex-row items-start justify-between pt-5">
                            <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                                Waiter Terbaik
                            </CardTitle>
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                                <Crown
                                    className="h-4.5 w-4.5 text-[#4F6B6A]"
                                    strokeWidth={2}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10">
                                <Crown className="size-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-serif text-2xl font-bold text-emerald-500">
                                    {topWaiter}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detail Table */}
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[#4F6B6A]">
                            <Trophy className="mr-2 inline size-4 text-secondary" />
                            Peringkat Poin Waiter — {monthLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {summary.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500 italic">
                                Belum ada data waiter untuk periode ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                            <th className="px-6 py-3.5 font-semibold">
                                                Peringkat
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Waiter
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Posisi
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Poin
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Performa
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#CFC0A4]/15">
                                        {summary.map((waiter) => {
                                            const isTop = waiter.rank === 1;
                                            const pct =
                                                maxPoints > 0
                                                    ? Math.round(
                                                          (waiter.points /
                                                              maxPoints) *
                                                              100,
                                                      )
                                                    : 0;

                                            return (
                                                <tr
                                                    key={waiter.employee_id}
                                                    className="transition-colors hover:bg-[#CFC0A4]/5"
                                                >
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${isTop ? 'bg-amber-500 text-white' : 'bg-[#4F6B6A]/10 text-[#4F6B6A]'}`}
                                                        >
                                                            {waiter.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-2 font-medium text-slate-800">
                                                            {waiter.name}
                                                            {isTop && (
                                                                <Award className="size-4 text-amber-500" />
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 capitalize">
                                                        {waiter.position}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`font-serif text-lg font-bold ${isTop ? 'text-amber-600' : 'text-[#4F6B6A]'}`}
                                                        >
                                                            {waiter.points}
                                                        </span>
                                                        <span className="ml-1 text-xs text-slate-400">
                                                            poin
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-500">
                                                                {pct}%
                                                            </span>
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

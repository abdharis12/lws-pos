import { Head, router } from '@inertiajs/react';
import { Scale, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TrialBalanceEntry {
    id: number;
    account_code: string;
    account_name: string;
    account_type: string;
    total_debit: number;
    total_credit: number;
}

interface Props {
    trialBalance: TrialBalanceEntry[];
    asOf: string;
    filters: { date?: string; account_type?: string };
}

const accountTypeConfig: Record<string, { label: string; className: string }> = {
    asset: { label: 'Aset', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    liability: { label: 'Kewajiban', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    equity: { label: 'Ekuitas', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    revenue: { label: 'Pendapatan', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    expense: { label: 'Beban', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function TrialBalance({ trialBalance, asOf, filters }: Props) {
    const [dateFilter, setDateFilter] = useState(filters.date ?? asOf);
    const [typeFilter, setTypeFilter] = useState(filters.account_type ?? 'all');

    const totalDebit = trialBalance.reduce((sum, e) => sum + e.total_debit, 0);
    const totalCredit = trialBalance.reduce((sum, e) => sum + e.total_credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    function applyFilter() {
        router.get(
            '/admin/accounting/trial-balance',
            {
                date: dateFilter || undefined,
                account_type: typeFilter !== 'all' ? typeFilter : undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Trial Balance - Accounting" />

            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Scale className="size-3.5 text-[#4F6B6A]" />
                            <span>Accounting</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Trial Balance
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Neraca saldo per tanggal {new Date(asOf).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        type="date"
                        className="w-44 border-[#CFC0A4]/50 bg-white"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua tipe" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="asset">Aset</SelectItem>
                            <SelectItem value="liability">Kewajiban</SelectItem>
                            <SelectItem value="equity">Ekuitas</SelectItem>
                            <SelectItem value="revenue">Pendapatan</SelectItem>
                            <SelectItem value="expense">Beban</SelectItem>
                        </SelectContent>
                    </Select>
                    <button
                        onClick={applyFilter}
                        className="rounded-md bg-[#4F6B6A] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F6B6A]/90"
                    >
                        Terapkan
                    </button>
                </div>

                {/* Summary */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Total Debit</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp {totalDebit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Total Kredit</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp {totalCredit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className={`shadow-sm ${isBalanced ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}`}>
                        <CardContent className="pt-6">
                            <p className={`text-[10px] font-medium tracking-wider uppercase ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                                Selisih
                            </p>
                            <p className={`mt-1 font-serif text-2xl font-bold ${isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                                Rp {difference.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Trial Balance Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama Akun</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tipe</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Debit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kredit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trialBalance.map((tb) => {
                                    const typeCfg = accountTypeConfig[tb.account_type] ?? accountTypeConfig.asset;

                                    return (
                                        <tr key={tb.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3 font-medium text-[#4F6B6A]">{tb.account_code}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{tb.account_name}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={typeCfg.className}>{typeCfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                {tb.total_debit > 0 ? `Rp ${tb.total_debit.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                {tb.total_credit > 0 ? `Rp ${tb.total_credit.toLocaleString('id-ID')}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            {/* Summary row */}
                            <tfoot>
                                <tr className="border-t-2 border-[#4F6B6A]/30 bg-[#F6F2E9] font-bold">
                                    <td colSpan={3} className="px-4 py-3 text-sm text-[#4F6B6A] uppercase tracking-wider">Total</td>
                                    <td className="px-4 py-3 text-right text-[#4F6B6A]">
                                        Rp {totalDebit.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-[#4F6B6A]">
                                        Rp {totalCredit.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {trialBalance.length === 0 && (
                        <div className="py-16 text-center">
                            <Scale className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Data</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Belum ada transaksi yang tercatat.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

TrialBalance.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Accounting', href: '/admin/accounting/trial-balance' },
        { title: 'Trial Balance', href: '/admin/accounting/trial-balance' },
    ],
};

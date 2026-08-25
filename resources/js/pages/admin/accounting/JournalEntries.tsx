import { Head, router } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Plus, RotateCcw, AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ChartOfAccount {
    id: number;
    code: string;
    name: string;
    type: string;
}

interface JournalLine {
    id?: number;
    chart_of_account_id: string;
    debit: string;
    credit: string;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    date: string;
    description: string;
    total_debit: number;
    total_credit: number;
    is_posted: boolean;
    is_reversed: boolean;
    lines?: Array<{
        id: number;
        debit: number;
        credit: number;
        chart_of_account?: ChartOfAccount;
    }>;
    created_by?: { name: string };
}

interface Props {
    entries: {
        data: JournalEntry[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    coaList: ChartOfAccount[];
}

export default function JournalEntries({ entries, coaList }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([
        { chart_of_account_id: '', debit: '', credit: '' },
        { chart_of_account_id: '', debit: '', credit: '' },
    ]);

    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    function addLine() {
        setLines((prev) => [...prev, { chart_of_account_id: '', debit: '', credit: '' }]);
    }

    function removeLine(index: number) {
        setLines((prev) => prev.filter((_, i) => i !== index));
    }

    function updateLine(index: number, field: keyof JournalLine, value: string) {
        setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post('/admin/accounting/journal-entries', {
            date,
            description,
            lines: lines
                .filter((l) => l.chart_of_account_id)
                .map((l) => ({
                    chart_of_account_id: l.chart_of_account_id,
                    debit: l.debit || '0',
                    credit: l.credit || '0',
                })),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                setDate('');
                setDescription('');
                setLines([
                    { chart_of_account_id: '', debit: '', credit: '' },
                    { chart_of_account_id: '', debit: '', credit: '' },
                ]);
            },
        });
    }

    function reverseEntry(id: number) {
        if (!confirm('Yakin ingin membalik jurnal ini?')) {
return;
}

        router.post(`/admin/accounting/journal-entries/${id}/reverse`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Journal Entries - Accounting" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <BookOpen className="size-3.5 text-[#4F6B6A]" />
                            <span>Accounting</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Journal Entries
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Catatan transaksi keuangan jurnal umum.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Jurnal Baru</span>
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">No. Jurnal</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Deskripsi</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Debit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kredit</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.data.map((e) => {
                                    const balanced = Math.abs(e.total_debit - e.total_credit) < 0.01;

                                    return (
                                        <tr key={e.id} className={`border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50 ${e.is_reversed ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3 font-medium text-[#4F6B6A]">{e.entry_number}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                                {new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{e.description}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp {e.total_debit.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp {e.total_credit.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {e.is_reversed ? (
                                                    <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">Dibatalkan</Badge>
                                                ) : balanced ? (
                                                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                                        <CheckCircle2 className="size-3" /> Seimbang
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                                                        <AlertTriangle className="size-3" /> Tidak Seimbang
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {!e.is_reversed && (
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-rose-600 hover:bg-rose-50" onClick={() => reverseEntry(e.id)}>
                                                        <RotateCcw className="mr-1 size-3" /> Balik
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {entries.data.length === 0 && (
                        <div className="py-16 text-center">
                            <BookOpen className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Jurnal</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat jurnal umum untuk pencatatan transaksi.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={entries} />
                </div>
            </div>

            {/* Create Journal Entry Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">Jurnal Baru</DialogTitle>
                        <DialogDescription>Catat transaksi keuangan dengan jurnal double-entry.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="je_date">Tanggal *</Label>
                                <Input id="je_date" type="date" className="border-[#CFC0A4]/50 bg-white" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="je_desc">Deskripsi *</Label>
                                <Input id="je_desc" className="border-[#CFC0A4]/50 bg-white" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi transaksi..." required />
                            </div>
                        </div>

                        {/* Lines */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Jurnal Lines</Label>
                                <Button type="button" variant="outline" size="sm" className="h-7 border-[#CFC0A4]/50 text-xs" onClick={addLine}>
                                    <Plus className="mr-1 size-3" /> Baris
                                </Button>
                            </div>

                            <div className="rounded-lg border border-[#CFC0A4]/30 bg-white p-3">
                                <div className="mb-2 grid grid-cols-[1fr_100px_100px_32px] gap-2 text-xs font-semibold text-[#4F6B6A] uppercase">
                                    <span>Akun COA</span>
                                    <span className="text-right">Debit</span>
                                    <span className="text-right">Kredit</span>
                                    <span />
                                </div>

                                {lines.map((line, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Select
                                            value={line.chart_of_account_id}
                                            onValueChange={(v) => updateLine(idx, 'chart_of_account_id', v)}
                                        >
                                            <SelectTrigger className="flex-1 border-[#CFC0A4]/50 bg-[#F6F2E9]">
                                                <SelectValue placeholder="Pilih akun" />
                                            </SelectTrigger>
                                            <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                                {coaList.map((coa) => (
                                                    <SelectItem key={coa.id} value={String(coa.id)}>
                                                        {coa.code} - {coa.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            placeholder="0"
                                            className="w-28 border-[#CFC0A4]/50 bg-[#F6F2E9] text-right"
                                            value={line.debit}
                                            onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            placeholder="0"
                                            className="w-28 border-[#CFC0A4]/50 bg-[#F6F2E9] text-right"
                                            value={line.credit}
                                            onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                                        />
                                        {lines.length > 2 && (
                                            <Button type="button" variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-100" onClick={() => removeLine(idx)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Balance check */}
                            <div className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm ${isBalanced ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                <span>Total Debit: <strong>Rp {totalDebit.toLocaleString('id-ID')}</strong></span>
                                <span>Total Kredit: <strong>Rp {totalCredit.toLocaleString('id-ID')}</strong></span>
                                <span>
                                    {isBalanced ? (
                                        <span className="flex items-center gap-1"><CheckCircle2 className="size-4" /> Seimbang</span>
                                    ) : (
                                        <span className="flex items-center gap-1"><AlertTriangle className="size-4" /> Selisih: Rp {Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')}</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={!isBalanced}>
                                Simpan Jurnal
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

JournalEntries.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Accounting', href: '/admin/accounting/journal-entries' },
        { title: 'Journal Entries', href: '/admin/accounting/journal-entries' },
    ],
};

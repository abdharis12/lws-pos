import { Head, router, useForm } from '@inertiajs/react';
import { ClipboardCheck, CheckCircle2, Clock, Play, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Template {
    id: number;
    name: string;
    type: string;
}

interface Employee {
    id: number;
    user?: { name: string };
}

interface ExecutionItem {
    id: number;
    title: string;
    is_mandatory: boolean;
    requires_photo: boolean;
    is_checked: boolean;
    notes: string | null;
}

interface Execution {
    id: number;
    template_id: number;
    employee_id: number;
    status: string;
    execution_date: string;
    started_at: string | null;
    completed_at: string | null;
    template?: Template;
    employee?: Employee & { user?: { name: string } };
    items?: ExecutionItem[];
}

interface Props {
    executions: {
        data: Execution[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    templates: Template[];
    employees: Employee[];
    filters: { date?: string; status?: string; employee_id?: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Belum Mulai', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    in_progress: { label: 'Dikerjakan', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export default function ChecklistExecutions({ executions, templates, employees, filters }: Props) {
    const [dateFilter, setDateFilter] = useState(filters.date ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [employeeFilter, setEmployeeFilter] = useState(filters.employee_id ?? 'all');
    const [startOpen, setStartOpen] = useState(false);
    const [completeOpen, setCompleteOpen] = useState(false);
    const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
    const startForm = useForm({ template_id: '', employee_id: '' });
    const completeForm = useForm({ items: [] as Array<{ id: number; is_checked: boolean; notes: string }> });

    const summary = {
        pending: executions.data.filter((e) => e.status === 'pending').length,
        in_progress: executions.data.filter((e) => e.status === 'in_progress').length,
        completed: executions.data.filter((e) => e.status === 'completed').length,
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/admin/operations/checklist-executions',
                {
                    date: dateFilter || undefined,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    employee_id: employeeFilter !== 'all' ? employeeFilter : undefined,
                },
                { preserveScroll: true, preserveState: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [dateFilter, statusFilter, employeeFilter]);

    function submitStart(e: React.FormEvent) {
        e.preventDefault();
        startForm.post('/admin/operations/checklist-executions', {
            preserveScroll: true,
            onSuccess: () => setStartOpen(false),
        });
    }

    function openComplete(execution: Execution) {
        setSelectedExecution(execution);
        completeForm.setData({
            items: (execution.items ?? []).map((i) => ({ id: i.id, is_checked: i.is_checked, notes: i.notes ?? '' })),
        });
        setCompleteOpen(true);
    }

    function updateItem(index: number, field: string, value: boolean | string) {
        completeForm.setData(
            'items',
            completeForm.data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    }

    function submitComplete(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedExecution) {
return;
}

        router.put(`/admin/operations/checklist-executions/${selectedExecution.id}`, {
            items: completeForm.data.items,
        }, {
            preserveScroll: true,
            onSuccess: () => setCompleteOpen(false),
        });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Checklist Executions - Operations" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ClipboardCheck className="size-3.5 text-[#4F6B6A]" />
                            <span>Operations</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Checklist Executions
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Pantau pelaksanaan checklist harian karyawan.
                        </p>
                    </div>

                    <Button onClick={() => setStartOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Mulai Checklist</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Clock className="size-3" /> Belum Mulai
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">{summary.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-blue-600 uppercase">
                                <Play className="size-3" /> Dikerjakan
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-blue-700">{summary.in_progress}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <CheckCircle2 className="size-3" /> Selesai
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">{summary.completed}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        type="date"
                        className="w-40 border-[#CFC0A4]/50 bg-white"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="pending">Belum Mulai</SelectItem>
                            <SelectItem value="in_progress">Dikerjakan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                        <SelectTrigger className="w-48 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua karyawan" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Karyawan</SelectItem>
                            {employees.map((e) => (
                                <SelectItem key={e.id} value={String(e.id)}>
                                    {e.user?.name ?? `Karyawan #${e.id}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Template</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Karyawan</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Selesai Pada</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executions.data.map((ex) => {
                                    const cfg = statusConfig[ex.status] ?? statusConfig.pending;

                                    return (
                                        <tr key={ex.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{ex.template?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-700">{ex.employee?.user?.name ?? '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {new Date(ex.execution_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {ex.completed_at
                                                    ? new Date(ex.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {(ex.status === 'in_progress' || ex.status === 'pending') && (
                                                    <Button variant="outline" size="sm" className="h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => openComplete(ex)}>
                                                        {ex.status === 'pending' ? <Play className="mr-1 size-3" /> : <CheckCircle2 className="mr-1 size-3" />}
                                                        {ex.status === 'pending' ? 'Mulai' : 'Selesaikan'}
                                                    </Button>
                                                )}
                                                {ex.status === 'completed' && (
                                                    <CheckCircle2 className="ml-auto inline size-5 text-emerald-500" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {executions.data.length === 0 && (
                        <div className="py-16 text-center">
                            <ClipboardCheck className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Eksekusi</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Mulai checklist pertama dari template.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={executions} />
                </div>
            </div>

            {/* Start Dialog */}
            <Dialog open={startOpen} onOpenChange={setStartOpen}>
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">Mulai Checklist</DialogTitle>
                        <DialogDescription>Pilih template dan karyawan yang akan mengerjakan checklist.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitStart} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Template *</Label>
                            <Select value={startForm.data.template_id} onValueChange={(v) => startForm.setData('template_id', v)} required>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih template" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name} ({t.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Karyawan *</Label>
                            <Select value={startForm.data.employee_id} onValueChange={(v) => startForm.setData('employee_id', v)} required>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih karyawan" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {employees.map((e) => (
                                        <SelectItem key={e.id} value={String(e.id)}>
                                            {e.user?.name ?? `Karyawan #${e.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setStartOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={startForm.processing}>Mulai</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Complete Dialog */}
            <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Checklist: {selectedExecution?.template?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Centang item yang sudah dikerjakan dan tambahkan catatan jika diperlukan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitComplete} className="space-y-4">
                        {selectedExecution?.items?.map((item, idx) => (
                            <div key={item.id} className="rounded-lg border border-[#CFC0A4]/30 bg-white p-3">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={completeForm.data.items[idx]?.is_checked ?? false}
                                        onCheckedChange={(v) => updateItem(idx, 'is_checked', v === true)}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800">
                                            {item.title}
                                            {item.is_mandatory && <span className="ml-1 text-rose-500">*</span>}
                                            {item.requires_photo && <span className="ml-1 text-xs text-slate-400">(Foto)</span>}
                                        </p>
                                        <Input
                                            className="mt-2 border-[#CFC0A4]/50 bg-white text-xs"
                                            placeholder="Catatan opsional..."
                                            value={completeForm.data.items[idx]?.notes ?? ''}
                                            onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setCompleteOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit">Simpan & Selesai</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

ChecklistExecutions.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Operations', href: '/admin/operations/checklist-executions' },
        { title: 'Checklist Executions', href: '/admin/operations/checklist-executions' },
    ],
};

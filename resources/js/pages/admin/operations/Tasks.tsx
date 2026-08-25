import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, ListTodo, Plus, Play, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
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


interface Employee {
    id: number;
    user?: { name: string };
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    created_at: string;
    assignee?: Employee & { user?: { name: string } };
    assigned_by?: { name: string };
}

interface Props {
    tasks: {
        data: Task[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    employees: Employee[];
    filters: { status?: string; priority?: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    in_progress: { label: 'Dikerjakan', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'Rendah', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    medium: { label: 'Sedang', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    high: { label: 'Tinggi', className: 'bg-rose-100 text-rose-700 border-rose-200' },
    urgent: { label: 'Mendesak', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function Tasks({ tasks, employees, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority ?? 'all');
    const [createOpen, setCreateOpen] = useState(false);
    const form = useForm({
        title: '',
        description: '',
        assignee_id: '',
        priority: 'medium',
        due_date: '',
    });

    const summary = {
        pending: tasks.data.filter((t) => t.status === 'pending').length,
        in_progress: tasks.data.filter((t) => t.status === 'in_progress').length,
        completed: tasks.data.filter((t) => t.status === 'completed').length,
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/admin/operations/tasks',
                {
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
                },
                { preserveScroll: true, preserveState: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [statusFilter, priorityFilter]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/operations/tasks', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                form.reset();
            },
        });
    }

    function startTask(id: number) {
        router.post(`/admin/operations/tasks/${id}/start`, {}, { preserveScroll: true });
    }

    function completeTask(id: number) {
        router.post(`/admin/operations/tasks/${id}/complete`, {}, { preserveScroll: true });
    }

    function cancelTask(id: number) {
        router.post(`/admin/operations/tasks/${id}/cancel`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Tasks - Operations" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ListTodo className="size-3.5 text-[#4F6B6A]" />
                            <span>Operations</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Tasks
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola tugas dan penugasan untuk karyawan.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Task Baru</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Clock className="size-3" /> Pending
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">Dikerjakan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Batal</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua prioritas" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Prioritas</SelectItem>
                            <SelectItem value="low">Rendah</SelectItem>
                            <SelectItem value="medium">Sedang</SelectItem>
                            <SelectItem value="high">Tinggi</SelectItem>
                            <SelectItem value="urgent">Mendesak</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Judul</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Ditugaskan ke</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Prioritas</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Jatuh Tempo</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.data.map((t) => {
                                    const sCfg = statusConfig[t.status] ?? statusConfig.pending;
                                    const pCfg = priorityConfig[t.priority] ?? priorityConfig.medium;

                                    return (
                                        <tr key={t.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800">{t.title}</div>
                                                {t.description && <div className="max-w-xs truncate text-xs text-slate-400 italic">{t.description}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{t.assignee?.user?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {t.due_date
                                                    ? new Date(t.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {t.status === 'pending' && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="mr-1 h-8 border-blue-300 text-xs text-blue-700 hover:bg-blue-50" onClick={() => startTask(t.id)}>
                                                            <Play className="mr-1 size-3" /> Mulai
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800" onClick={() => cancelTask(t.id)}>
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {t.status === 'in_progress' && (
                                                    <>
                                                        <Button variant="outline" size="sm" className="mr-1 h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => completeTask(t.id)}>
                                                            <CheckCircle2 className="mr-1 size-3" /> Selesai
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800" onClick={() => cancelTask(t.id)}>
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {t.status === 'completed' && (
                                                    <CheckCircle2 className="ml-auto inline size-5 text-emerald-500" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {tasks.data.length === 0 && (
                        <div className="py-16 text-center">
                            <ListTodo className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Task</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat task baru untuk mulai menugaskan karyawan.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={tasks} />
                </div>
            </div>

            {/* Create Task Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">Task Baru</DialogTitle>
                        <DialogDescription>Buat task baru dan tugaskan ke karyawan.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="task_title">Judul Task *</Label>
                            <Input id="task_title" className="border-[#CFC0A4]/50 bg-white" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required />
                            {form.errors.title && <p className="text-xs text-rose-600">{form.errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task_desc">Deskripsi</Label>
                            <textarea id="task_desc" className="flex min-h-[80px] w-full rounded-md border border-[#CFC0A4]/50 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4F6B6A]" value={form.data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => form.setData('description', e.target.value)} placeholder="Deskripsi task..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ditugaskan ke *</Label>
                                <Select value={form.data.assignee_id} onValueChange={(v) => form.setData('assignee_id', v)} required>
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
                                {form.errors.assignee_id && <p className="text-xs text-rose-600">{form.errors.assignee_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Prioritas</Label>
                                <Select value={form.data.priority} onValueChange={(v) => form.setData('priority', v)}>
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        <SelectItem value="low">Rendah</SelectItem>
                                        <SelectItem value="medium">Sedang</SelectItem>
                                        <SelectItem value="high">Tinggi</SelectItem>
                                        <SelectItem value="urgent">Mendesak</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task_due">Jatuh Tempo</Label>
                            <Input id="task_due" type="date" className="border-[#CFC0A4]/50 bg-white" value={form.data.due_date} onChange={(e) => form.setData('due_date', e.target.value)} />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

Tasks.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Operations', href: '/admin/operations/tasks' },
        { title: 'Tasks', href: '/admin/operations/tasks' },
    ],
};

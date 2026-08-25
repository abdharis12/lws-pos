import { Head, router, useForm } from '@inertiajs/react';
import { ClipboardList, Plus, Pencil, ToggleLeft } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TemplateItem {
    id?: number;
    title: string;
    is_mandatory: boolean;
    requires_photo: boolean;
}

interface ChecklistTemplate {
    id: number;
    name: string;
    type: string;
    is_active: boolean;
    items_count: number;
    items?: TemplateItem[];
}

interface Props {
    templates: ChecklistTemplate[];
}

export default function ChecklistTemplates({ templates }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const form = useForm({
        name: '',
        type: 'opening',
        items: [{ title: '', is_mandatory: true, requires_photo: false }] as TemplateItem[],
    });

    function openCreate() {
        setEditing(null);
        form.setData({
            name: '',
            type: 'opening',
            items: [{ title: '', is_mandatory: true, requires_photo: false }],
        });
        setFormOpen(true);
    }

    function openEdit(template: ChecklistTemplate) {
        setEditing(template.id);
        form.setData({
            name: template.name,
            type: template.type,
            items: template.items?.length
                ? template.items.map((i) => ({ title: i.title, is_mandatory: i.is_mandatory, requires_photo: i.requires_photo }))
                : [{ title: '', is_mandatory: true, requires_photo: false }],
        });
        setFormOpen(true);
    }

    function addLine() {
        form.setData('items', [...form.data.items, { title: '', is_mandatory: true, requires_photo: false }]);
    }

    function removeLine(index: number) {
        form.setData('items', form.data.items.filter((_, i) => i !== index));
    }

    function updateLine(index: number, field: keyof TemplateItem, value: boolean | string) {
        form.setData(
            'items',
            form.data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const validItems = form.data.items.filter((i) => i.title.trim());
        form.setData('items', validItems);

        if (editing) {
            form.put(`/admin/operations/checklist-templates/${editing}`, {
                preserveScroll: true,
                onSuccess: () => setFormOpen(false),
            });
        } else {
            form.post('/admin/operations/checklist-templates', {
                preserveScroll: true,
                onSuccess: () => setFormOpen(false),
            });
        }
    }

    function toggleActive(id: number) {
        router.post(`/admin/operations/checklist-templates/${id}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Checklist Templates - Operations" />

            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ClipboardList className="size-3.5 text-[#4F6B6A]" />
                            <span>Operations</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Checklist Templates
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola template checklist untuk operasional harian.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Template Baru</span>
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tipe</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Item Count</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((t) => (
                                    <tr key={t.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={t.type === 'opening' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                                                {t.type === 'opening' ? 'Opening' : 'Closing'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-600">{t.items_count} item</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="outline" className={t.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                                {t.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="sm" className="mr-1 h-8 text-xs text-[#4F6B6A] hover:bg-[#CFC0A4]/10" onClick={() => toggleActive(t.id)}>
                                                <ToggleLeft className="mr-1 size-3" /> Toggle
                                            </Button>
                                            <Button variant="secondary" size="icon" className="size-8" onClick={() => openEdit(t)}>
                                                <Pencil className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {templates.length === 0 && (
                        <div className="py-16 text-center">
                            <ClipboardList className="mx-auto size-10 text-slate-400" />
                            <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Template</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat template checklist untuk operasional.</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            {editing ? 'Edit Template' : 'Template Baru'}
                        </DialogTitle>
                        <DialogDescription>Buat template checklist untuk kegiatan operasional.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tpl_name">Nama Template *</Label>
                                <Input id="tpl_name" className="border-[#CFC0A4]/50 bg-white" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                {form.errors.name && <p className="text-xs text-rose-600">{form.errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Tipe *</Label>
                                <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        <SelectItem value="opening">Opening</SelectItem>
                                        <SelectItem value="closing">Closing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Checklist Items</Label>
                                <Button type="button" variant="outline" size="sm" className="h-7 border-[#CFC0A4]/50 text-xs" onClick={addLine}>
                                    <Plus className="mr-1 size-3" /> Item
                                </Button>
                            </div>

                            {form.data.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        className="flex-1 border-[#CFC0A4]/50 bg-white"
                                        placeholder="Judul item checklist..."
                                        value={item.title}
                                        onChange={(e) => updateLine(idx, 'title', e.target.value)}
                                    />
                                    <label className="flex items-center gap-1 text-xs text-slate-600">
                                        <Checkbox
                                            checked={item.is_mandatory}
                                            onCheckedChange={(v) => updateLine(idx, 'is_mandatory', v === true)}
                                        />
                                        Wajib
                                    </label>
                                    <label className="flex items-center gap-1 text-xs text-slate-600">
                                        <Checkbox
                                            checked={item.requires_photo}
                                            onCheckedChange={(v) => updateLine(idx, 'requires_photo', v === true)}
                                        />
                                        Foto
                                    </label>
                                    {form.data.items.length > 1 && (
                                        <Button type="button" variant="ghost" size="icon" className="size-8 text-rose-600 hover:bg-rose-100" onClick={() => removeLine(idx)}>
                                            &times;
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

ChecklistTemplates.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Operations', href: '/admin/operations/checklists' },
        { title: 'Checklists', href: '/admin/operations/checklists' },
    ],
};

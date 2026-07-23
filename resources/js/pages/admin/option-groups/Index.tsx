import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string | number;
    is_available: boolean;
    sort_order: number;
}

interface OptionGroup {
    id: number;
    name: string;
    selection_type: string;
    is_required: boolean;
    min_select: number;
    max_select: number;
    option_items: OptionItem[];
}

interface Props {
    groups: OptionGroup[];
}

export default function OptionGroupsIndex({ groups }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<OptionGroup | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        selection_type: 'single',
        is_required: false,
        min_select: '0',
        max_select: '0',
        items: [] as { name: string; price_adjustment: string }[],
    });

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(group: OptionGroup) {
        setEditing(group);
        setData({
            name: group.name,
            selection_type: group.selection_type,
            is_required: group.is_required,
            min_select: String(group.min_select),
            max_select: String(group.max_select),
            items: group.option_items.map((i) => ({
                name: i.name,
                price_adjustment: String(i.price_adjustment),
            })),
        });
        setOpen(true);
    }

    function addItem() {
        setData('items', [...data.items, { name: '', price_adjustment: '0' }]);
    }

    function removeItem(index: number) {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    }

    function updateItem(index: number, field: 'name' | 'price_adjustment', value: string) {
        const items = [...data.items];
        items[index][field] = value;
        setData('items', items);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/option-groups/${editing.id}`, {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        } else {
            post('/admin/option-groups', {
                onSuccess: () => {
 setOpen(false); reset(); 
},
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus grup opsi ini? Semua item di dalamnya juga akan dihapus.')) {
            destroy(`/admin/option-groups/${id}`);
        }
    }

    return (
        <>
            <Head title="Grup Opsi" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Grup Opsi</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Kelola opsi tambahan untuk menu</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Tambah Grup Opsi
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Grup Opsi' : 'Tambah Grup Opsi'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Grup</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="selection_type">Tipe Seleksi</Label>
                                <Select
                                    value={data.selection_type}
                                    onValueChange={(v) => setData('selection_type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Pilih Satu</SelectItem>
                                        <SelectItem value="multiple">Pilih Banyak</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.selection_type} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_required"
                                    checked={data.is_required}
                                    onCheckedChange={(v) => setData('is_required', v === true)}
                                />
                                <Label htmlFor="is_required">Wajib dipilih</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="min_select">Min. Pilih</Label>
                                    <Input
                                        id="min_select"
                                        type="number"
                                        min="0"
                                        value={data.min_select}
                                        onChange={(e) => setData('min_select', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max_select">Maks. Pilih</Label>
                                    <Input
                                        id="max_select"
                                        type="number"
                                        min="0"
                                        value={data.max_select}
                                        onChange={(e) => setData('max_select', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Item Opsi</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                        <Plus className="mr-1 size-3" />
                                        Tambah Item
                                    </Button>
                                </div>
                                {data.items.map((item, i) => (
                                    <div key={i} className="flex items-end gap-2 rounded-md border p-2">
                                        <div className="flex-1">
                                            <Label className="text-xs">Nama</Label>
                                            <Input
                                                value={item.name}
                                                onChange={(e) => updateItem(i, 'name', e.target.value)}
                                                placeholder="Nama item"
                                            />
                                        </div>
                                        <div className="w-28">
                                            <Label className="text-xs">Tambahan (Rp)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.price_adjustment}
                                                onChange={(e) => updateItem(i, 'price_adjustment', e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(i)}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                                <InputError message={errors['items.0.name']} />
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {groups.map((group) => (
                    <Card key={group.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{group.name}</CardTitle>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        <Badge variant="outline">
                                            {group.selection_type === 'single' ? 'Pilih 1' : 'Pilih banyak'}
                                        </Badge>
                                        {group.is_required && <Badge variant="secondary">Wajib</Badge>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {group.option_items.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Tidak ada item.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {group.option_items.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="text-muted-foreground">
                                                {Number(item.price_adjustment) > 0
                                                    ? `+Rp ${Number(item.price_adjustment).toLocaleString('id-ID')}`
                                                    : 'Gratis'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {groups.length === 0 && (
                    <p className="col-span-full py-8 text-center text-muted-foreground">
                        Belum ada grup opsi.
                    </p>
                )}
            </div>
        </>
    );
}

OptionGroupsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grup Opsi', href: '/admin/option-groups' },
    ],
};

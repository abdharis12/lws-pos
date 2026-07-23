import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category {
    id: number;
    name: string;
    sort_order: number;
}

interface Props {
    categories: Category[];
}

export default function MenuCategoriesIndex({ categories }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        sort_order: '0',
    });

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(cat: Category) {
        setEditing(cat);
        setData({ name: cat.name, sort_order: String(cat.sort_order) });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/menu-categories/${editing.id}`, {
                onSuccess: () => {
 setOpen(false); reset(); 
},
            });
        } else {
            post('/admin/menu-categories', {
                onSuccess: () => {
 setOpen(false); reset(); 
},
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Hapus kategori ini?')) {
            destroy(`/admin/menu-categories/${id}`);
        }
    }

    return (
        <>
            <Head title="Kategori Menu" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Kategori Menu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Kelola kategori menu</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" />
                            Tambah Kategori
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Kategori</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Urutan</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', e.target.value)}
                                />
                                <InputError message={errors.sort_order} />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Semua Kategori</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Nama</th>
                                <th className="px-6 py-3 font-medium">Urutan</th>
                                <th className="px-6 py-3 font-medium">Menu</th>
                                <th className="px-6 py-3 text-right font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className="border-b last:border-0">
                                    <td className="px-6 py-3">{cat.name}</td>
                                    <td className="px-6 py-3">{cat.sort_order}</td>
                                    <td className="px-6 py-3 text-muted-foreground">-</td>
                                    <td className="flex justify-end gap-1 px-6 py-3">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        Belum ada kategori.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </>
    );
}

MenuCategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kategori Menu', href: '/admin/menu-categories' },
    ],
};

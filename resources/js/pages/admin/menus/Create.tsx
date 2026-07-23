import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string | number;
}

interface OptionGroup {
    id: number;
    name: string;
    option_items: OptionItem[];
}

interface Props {
    categories: { id: number; name: string }[];
    optionGroups: OptionGroup[];
}

export default function MenusCreate({ categories, optionGroups }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category_id: '',
        name: '',
        description: '',
        price: '',
        photo: null as File | null,
        is_available: true,
        option_group_ids: [] as number[],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/menus');
    }

    function toggleOptionGroup(id: number) {
        const current = data.option_group_ids;

        if (current.includes(id)) {
            setData('option_group_ids', current.filter((g) => g !== id));
        } else {
            setData('option_group_ids', [...current, id]);
        }
    }

    return (
        <>
            <Head title="Tambah Menu" />

            <div className="mb-6 flex items-center gap-4">
                <a href="/admin/menus">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="size-5" />
                    </Button>
                </a>
                <div>
                    <h1 className="text-2xl font-semibold">Tambah Menu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Buat menu baru untuk restoran</p>
                </div>
            </div>

            <form onSubmit={submit} className="max-w-2xl space-y-6" encType="multipart/form-data">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nama Menu</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="category_id">Kategori</Label>
                    <Select
                        value={data.category_id}
                        onValueChange={(v) => setData('category_id', v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.category_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <textarea
                        id="description"
                        className="border-input flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                    />
                    <InputError message={errors.price} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="photo">Foto Menu</Label>
                    <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setData('photo', e.target.files?.[0] ?? null)}
                    />
                    <InputError message={errors.photo} />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="is_available"
                        checked={data.is_available}
                        onCheckedChange={(v) => setData('is_available', v === true)}
                    />
                    <Label htmlFor="is_available">Tersedia</Label>
                    <InputError message={errors.is_available} />
                </div>

                <div className="grid gap-2">
                    <Label>Grup Opsi</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {optionGroups.map((group) => (
                            <label
                                key={group.id}
                                className="flex items-center gap-2 rounded-md border p-3 text-sm"
                            >
                                <Checkbox
                                    checked={data.option_group_ids.includes(group.id)}
                                    onCheckedChange={() => toggleOptionGroup(group.id)}
                                />
                                <div>
                                    <p className="font-medium">{group.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {group.option_items.length} item
                                    </p>
                                </div>
                            </label>
                        ))}
                        {optionGroups.length === 0 && (
                            <p className="col-span-full text-sm text-muted-foreground">
                                Belum ada grup opsi.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>
                        <Save className="mr-2 size-4" />
                        Simpan
                    </Button>
                    <a href="/admin/menus">
                        <Button type="button" variant="outline">
                            Batal
                        </Button>
                    </a>
                </div>
            </form>
        </>
    );
}

MenusCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
        { title: 'Tambah', href: '/admin/menus/create' },
    ],
};

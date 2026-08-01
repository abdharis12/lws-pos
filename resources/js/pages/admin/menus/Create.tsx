import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Utensils } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
            setData(
                'option_group_ids',
                current.filter((g) => g !== id),
            );
        } else {
            setData('option_group_ids', [...current, id]);
        }
    }

    return (
        <>
            <Head title="Tambah Menu" />

            <div className="min-h-screen p-6 font-sans text-slate-800">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-4">
                        <a href="/admin/menus">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                            >
                                <ArrowLeft className="size-5" />
                            </Button>
                        </a>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                                <Utensils className="size-3.5 text-[#4F6B6A]" />
                                <span>Koleksi Menu Kuliner</span>
                            </div>
                            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                Tambah Menu
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 italic">
                                Buat menu baru untuk restoran
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-6"
                    encType="multipart/form-data"
                >
                    <div className="rounded-xl border border-[#CFC0A4]/40 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2 border-b border-[#CFC0A4]/20 pb-3">
                            <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                Informasi Utama
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="name"
                                    className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                >
                                    Nama Menu
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="category_id"
                                    className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                >
                                    Kategori
                                </Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(v) =>
                                        setData('category_id', v)
                                    }
                                >
                                    <SelectTrigger className="border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-background">
                                        {categories &&
                                            Array.isArray(categories) &&
                                            categories.map((cat) => (
                                                <SelectItem
                                                    key={cat.id}
                                                    value={String(cat.id)}
                                                >
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="description"
                                    className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                >
                                    Bahan Utama
                                </Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-[#CFC0A4]/50 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:border-[#4F6B6A] focus-visible:ring-[3px] focus-visible:ring-[#4F6B6A]/50 focus-visible:outline-none"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="price"
                                    className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                >
                                    Harga (Rp)
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) =>
                                        setData('price', e.target.value)
                                    }
                                    className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                />
                                <InputError message={errors.price} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="photo"
                                    className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                >
                                    Foto Menu
                                </Label>
                                <Input
                                    id="photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setData(
                                            'photo',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                />
                                <InputError message={errors.photo} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_available"
                                    checked={data.is_available}
                                    onCheckedChange={(v) =>
                                        setData('is_available', v === true)
                                    }
                                />
                                <Label
                                    htmlFor="is_available"
                                    className="text-sm font-medium text-slate-700"
                                >
                                    Tersedia
                                </Label>
                                <InputError message={errors.is_available} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#CFC0A4]/40 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between border-b border-[#CFC0A4]/20 pb-3">
                            <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                Grup Opsi
                            </h2>
                            <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-medium text-[#4F6B6A]">
                                {data.option_group_ids.length} terpilih
                            </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {optionGroups.map((group) => (
                                <label
                                    key={group.id}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#CFC0A4]/30 bg-white p-3 text-sm transition-colors hover:bg-[#CFC0A4]/5"
                                >
                                    <Checkbox
                                        checked={data.option_group_ids.includes(
                                            group.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleOptionGroup(group.id)
                                        }
                                    />
                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {group.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {group.option_items.length} item
                                        </p>
                                    </div>
                                </label>
                            ))}
                            {optionGroups.length === 0 && (
                                <p className="col-span-full text-sm text-slate-500">
                                    Belum ada grup opsi.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                        >
                            <Save className="mr-2 size-4" />
                            Simpan
                        </Button>
                        <a href="/admin/menus">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
                            >
                                Batal
                            </Button>
                        </a>
                    </div>
                </form>
            </div>
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

import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Upload,
    Image as ImageIcon,
    CheckCircle2,
    Utensils,
    Layers,
    Tag,
    DollarSign,
    FileText,
    Menu,
    SoupIcon,
} from 'lucide-react';
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

interface MenuData {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    price: string | number;
    photo_path: string | null;
    is_available: boolean;
    option_groups: OptionGroup[];
}

interface Props {
    menu: MenuData;
    categories: { id: number; name: string }[];
    optionGroups: OptionGroup[];
}

export default function MenusEdit({ menu, categories, optionGroups }: Props) {
    const initialOptionGroupIds = menu.option_groups.map((g) => g.id);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        menu.photo_path ? `/storage/${menu.photo_path}` : null
    );

    const { data, setData, put, processing, errors } = useForm({
        category_id: String(menu.category_id),
        name: menu.name,
        description: menu.description ?? '',
        price: String(menu.price),
        photo: null as File | null,
        is_available: menu.is_available,
        option_group_ids: initialOptionGroupIds,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/menus/${menu.id}`);
    }

    function toggleOptionGroup(id: number) {
        const current = data.option_group_ids;
        if (current.includes(id)) {
            setData('option_group_ids', current.filter((g) => g !== id));
        } else {
            setData('option_group_ids', [...current, id]);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('photo', file);

        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }

    return (
        <>
            <Head title={`Edit Menu - ${menu.name}`} />

            <div className="mx-auto max-w-6xl space-y-6 pb-12 bg-[#FAF9F6] w-00 min-w-full px-4 sm:px-6 lg:px-8">
                {/* Header Page */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mt-10">
                    <div className="flex items-center gap-5">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg bg-primary text-white">
                            <SoupIcon className="size-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    Edit Menu
                                </h1>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        data.is_available
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {data.is_available ? 'Tersedia' : 'Sembunyi'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground sm:text-sm">
                                Perbarui detail hidangan, harga, dan kustomisasi opsi menu.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href="/admin/menus">
                            <Button type="button" variant="outline" size="sm">
                                Batal
                            </Button>
                        </a>
                        <Button
                            onClick={submit}
                            disabled={processing}
                            size="sm"
                            className="gap-2"
                        >
                            <Save className="size-4" />
                            <span>Simpan Perubahan</span>
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-12" encType="multipart/form-data">
                    {/* Left Column: General Information */}
                    <div className="space-y-6 lg:col-span-7">
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <div className="mb-5 flex items-center gap-2 border-b pb-3">
                                <Utensils className="size-4 text-muted-foreground" />
                                <h2 className="font-semibold text-foreground">Informasi Utama Menu</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Name Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-xs font-semibold">
                                        Nama Menu <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Nasi Goreng Spesial"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="h-10"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Category Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="category_id" className="text-xs font-semibold">
                                        Kategori <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(v) => setData('category_id', v)}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih kategori menu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories && Array.isArray(categories) && categories.map((cat) => (
                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="size-3.5 text-muted-foreground" />
                                                        <span>{cat.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} />
                                </div>

                                {/* Price Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-xs font-semibold">
                                        Harga (Rp) <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                            Rp
                                        </span>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={data.price}
                                            onChange={(e) => setData('price', e.target.value)}
                                            className="h-10 pl-9"
                                        />
                                    </div>
                                    <InputError message={errors.price} />
                                </div>

                                {/* Main Ingredients / Description Field */}
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-xs font-semibold">
                                        Bahan Utama / Deskripsi
                                    </Label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        placeholder="Jelaskan komposisi atau rasa hidangan ini..."
                                        className="border-input bg-transparent text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none flex w-full rounded-md border px-3 py-2"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                {/* Availability Checkbox Card */}
                                <div className="pt-2">
                                    <label
                                        htmlFor="is_available"
                                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors ${
                                            data.is_available
                                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                                : 'bg-muted/30 hover:bg-muted/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="is_available"
                                                checked={data.is_available}
                                                onCheckedChange={(v) => setData('is_available', v === true)}
                                            />
                                            <div>
                                                <p className="text-sm font-medium leading-none text-foreground">
                                                    Status Ketersediaan
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Tampilkan menu ini di daftar pesanan pelanggan.
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                    <InputError message={errors.is_available} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Media Upload & Option Groups */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Photo Card */}
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <div className="mb-4 flex items-center gap-2 border-b pb-3">
                                <ImageIcon className="size-4 text-muted-foreground" />
                                <h2 className="font-semibold text-foreground">Foto Menu</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Preview Container */}
                                <div className="group relative aspect-4/3 overflow-hidden rounded-lg border bg-muted/20">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={menu.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
                                            <ImageIcon className="mb-2 size-10 opacity-40" />
                                            <p className="text-xs">Belum ada foto menu</p>
                                        </div>
                                    )}

                                    {data.photo && (
                                        <div className="absolute right-2 top-2 rounded-full bg-emerald-500 p-1 text-white shadow-xs">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Custom Upload Control */}
                                <div className="grid gap-2">
                                    <Label htmlFor="photo" className="text-xs font-semibold">
                                        Ganti Foto
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary-foreground hover:file:cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Format JPG, PNG, atau WEBP. Biarkan kosong jika tidak diubah.
                                    </p>
                                    <InputError message={errors.photo} />
                                </div>
                            </div>
                        </div>

                        {/* Option Groups Selection */}
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <div className="mb-4 flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="size-4 text-muted-foreground" />
                                    <h2 className="font-semibold text-foreground">Grup Opsi</h2>
                                </div>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-mono">
                                    {data.option_group_ids.length} terpilih
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {optionGroups.length === 0 ? (
                                    <p className="text-center py-4 text-xs text-muted-foreground">
                                        Belum ada grup opsi yang tersedia.
                                    </p>
                                ) : (
                                    optionGroups.map((group) => {
                                        const isChecked = data.option_group_ids.includes(group.id);
                                        return (
                                            <label
                                                key={group.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                                                    isChecked
                                                        ? 'border-primary/50 bg-primary/5 shadow-2xs'
                                                        : 'border-border/60 hover:bg-muted/40'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleOptionGroup(group.id)}
                                                    className="mt-0.5"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {group.name}
                                                        </p>
                                                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-xs">
                                                            {group.option_items.length} item
                                                        </span>
                                                    </div>
                                                    {group.option_items.length > 0 && (
                                                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                                            {group.option_items.map((i) => i.name).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

MenusEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
        { title: 'Edit', href: '#' },
    ],
};
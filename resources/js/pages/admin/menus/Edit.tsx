import { Head, useForm } from '@inertiajs/react';
import {
    Save,
    Image as ImageIcon,
    CheckCircle2,
    Utensils,
    Layers,
    Tag,
    SoupIcon,
} from 'lucide-react';
import React, { useState } from 'react';
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

const STATION_OPTIONS = [
    { value: 'Main', label: 'Main (makanan utama)' },
    { value: 'Grill', label: 'Grill (panggang/gorengan)' },
    { value: 'Drink', label: 'Drink (minuman)' },
    { value: 'Dessert', label: 'Dessert (penutup)' },
];

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
    station: string | null;
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
        menu.photo_path ? `/storage/${menu.photo_path}` : null,
    );

    const { data, setData, put, processing, errors } = useForm({
        category_id: String(menu.category_id),
        name: menu.name,
        description: menu.description ?? '',
        price: String(menu.price),
        photo: null as File | null,
        is_available: menu.is_available,
        station: menu.station ?? '',
        option_group_ids: initialOptionGroupIds,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/admin/menus/${menu.id}`);
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

            <div className="min-h-screen p-6 font-sans text-slate-800">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg bg-[#4F6B6A] text-white"
                        >
                            <SoupIcon className="size-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-serif text-2xl font-bold tracking-tight text-[#4F6B6A]">
                                    Edit Menu
                                </h1>
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        data.is_available
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {data.is_available
                                        ? 'Tersedia'
                                        : 'Sembunyi'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500 italic">
                                Perbarui detail hidangan, harga, dan kustomisasi
                                opsi menu.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href="/admin/menus">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
                            >
                                Batal
                            </Button>
                        </a>
                        <Button
                            onClick={submit}
                            disabled={processing}
                            size="sm"
                            className="gap-2 bg-[#4F6B6A] text-white hover:bg-[#3B5655]"
                        >
                            <Save className="size-4" />
                            <span>Simpan Perubahan</span>
                        </Button>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-12"
                    encType="multipart/form-data"
                >
                    {/* Left Column: General Information */}
                    <div className="space-y-6 lg:col-span-7">
                        <div className="rounded-xl border border-[#CFC0A4]/40 bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center gap-2 border-b border-[#CFC0A4]/20 pb-3">
                                <Utensils className="size-4 text-[#4F6B6A]" />
                                <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    Informasi Utama Menu
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {/* Name Field */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Nama Menu{' '}
                                        <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Nasi Goreng Spesial"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        className="h-10 border-[#CFC0A4]/50 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Category Field */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="category_id"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Kategori{' '}
                                        <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(v) =>
                                            setData('category_id', v)
                                        }
                                    >
                                        <SelectTrigger className="h-10 border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                            <SelectValue placeholder="Pilih kategori menu" />
                                        </SelectTrigger>
                                        <SelectContent className="border-[#CFC0A4]/40 bg-background">
                                            {categories &&
                                                Array.isArray(categories) &&
                                                categories.map((cat) => (
                                                    <SelectItem
                                                        key={cat.id}
                                                        value={String(cat.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Tag className="size-3.5 text-slate-400" />
                                                            <span>
                                                                {cat.name}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} />
                                </div>

                                {/* Station Field */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="station"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Station Dapur
                                    </Label>
                                    <Select
                                        value={data.station || 'none'}
                                        onValueChange={(v) =>
                                            setData(
                                                'station',
                                                v === 'none' ? '' : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-10 border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                                            <SelectValue placeholder="Pilih station dapur" />
                                        </SelectTrigger>
                                        <SelectContent className="border-[#CFC0A4]/40 bg-background">
                                            <SelectItem value="none">
                                                — Belum ada station —
                                            </SelectItem>
                                            {STATION_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-slate-500">
                                        Station menentukan station dapur mana yang memasak
                                        menu ini (tampil di KDS).
                                    </p>
                                    <InputError message={errors.station} />
                                </div>

                                {/* Price Field */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="price"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Harga (Rp){' '}
                                        <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-slate-400">
                                            Rp
                                        </span>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={data.price}
                                            onChange={(e) =>
                                                setData('price', e.target.value)
                                            }
                                            className="h-10 border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                    </div>
                                    <InputError message={errors.price} />
                                </div>

                                {/* Main Ingredients / Description Field */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="description"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Bahan Utama / Deskripsi
                                    </Label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        placeholder="Jelaskan komposisi atau rasa hidangan ini..."
                                        className="flex w-full rounded-md border border-[#CFC0A4]/50 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:border-[#4F6B6A] focus-visible:ring-[3px] focus-visible:ring-[#4F6B6A]/50 focus-visible:outline-none"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
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
                                                : 'bg-slate-50 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="is_available"
                                                checked={data.is_available}
                                                onCheckedChange={(v) =>
                                                    setData(
                                                        'is_available',
                                                        v === true,
                                                    )
                                                }
                                            />
                                            <div>
                                                <p className="text-sm leading-none font-medium text-slate-800">
                                                    Status Ketersediaan
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Tampilkan menu ini di daftar
                                                    pesanan pelanggan.
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
                        <div className="rounded-xl border border-[#CFC0A4]/40 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b border-[#CFC0A4]/20 pb-3">
                                <ImageIcon className="size-4 text-[#4F6B6A]" />
                                <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    Foto Menu
                                </h2>
                            </div>

                            <div className="space-y-4">
                                {/* Preview Container */}
                                <div className="group relative aspect-4/3 overflow-hidden rounded-lg border border-[#CFC0A4]/30 bg-[#4F6B6A]/5">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt={menu.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                                            <ImageIcon className="mb-2 size-10 opacity-40" />
                                            <p className="text-xs">
                                                Belum ada foto menu
                                            </p>
                                        </div>
                                    )}

                                    {data.photo && (
                                        <div className="absolute top-2 right-2 rounded-full bg-emerald-500 p-1 text-white shadow-sm">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Custom Upload Control */}
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="photo"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Ganti Foto
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="border-[#CFC0A4]/50 bg-white text-xs file:mr-2 file:rounded-md file:border-0 file:bg-[#4F6B6A] file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-white hover:file:cursor-pointer focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Format JPG, PNG, atau WEBP. Biarkan
                                        kosong jika tidak diubah.
                                    </p>
                                    <InputError message={errors.photo} />
                                </div>
                            </div>
                        </div>

                        {/* Option Groups Selection */}
                        <div className="rounded-xl border border-[#CFC0A4]/40 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between border-b border-[#CFC0A4]/20 pb-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="size-4 text-[#4F6B6A]" />
                                    <h2 className="font-serif text-lg font-medium text-[#4F6B6A]">
                                        Grup Opsi
                                    </h2>
                                </div>
                                <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-medium text-[#4F6B6A]">
                                    {data.option_group_ids.length} terpilih
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {optionGroups.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-slate-500">
                                        Belum ada grup opsi yang tersedia.
                                    </p>
                                ) : (
                                    optionGroups.map((group) => {
                                        const isChecked =
                                            data.option_group_ids.includes(
                                                group.id,
                                            );

                                        return (
                                            <label
                                                key={group.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                                                    isChecked
                                                        ? 'border-[#4F6B6A]/50 bg-[#4F6B6A]/5 shadow-sm'
                                                        : 'border-[#CFC0A4]/30 hover:bg-[#CFC0A4]/5'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() =>
                                                        toggleOptionGroup(
                                                            group.id,
                                                        )
                                                    }
                                                    className="mt-0.5"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-slate-800">
                                                            {group.name}
                                                        </p>
                                                        <span className="rounded-sm bg-[#4F6B6A]/10 px-2 py-0.5 text-[11px] font-medium text-[#4F6B6A]">
                                                            {
                                                                group
                                                                    .option_items
                                                                    .length
                                                            }{' '}
                                                            item
                                                        </span>
                                                    </div>
                                                    {group.option_items.length >
                                                        0 && (
                                                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                                            {group.option_items
                                                                .map(
                                                                    (i) =>
                                                                        i.name,
                                                                )
                                                                .join(', ')}
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

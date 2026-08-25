import { Head, router, useForm } from '@inertiajs/react';
import { ChefHat, Plus, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
    cost_per_unit: string | number;
}

interface RecipeRow {
    id: number;
    ingredient_id: number;
    quantity_per_portion: string | number;
    unit: string;
    yield_percentage: string | number;
    notes: string | null;
    ingredient?: IngredientOption;
}

interface MenuData {
    id: number;
    name: string;
    price: string | number;
    cost: string | number;
    category?: { name: string };
}

interface Props {
    menu: MenuData;
    recipes: RecipeRow[];
    availableIngredients: IngredientOption[];
    hpp: number;
    validation: string[];
}

export default function MenuRecipe({
    menu,
    recipes,
    availableIngredients,
    hpp,
    validation,
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [ingredientId, setIngredientId] = useState('');
    const [qty, setQty] = useState('');
    const [yieldPct, setYieldPct] = useState('100');
    const [notes, setNotes] = useState('');

    function openAdd() {
        setIngredientId('');
        setQty('');
        setYieldPct('100');
        setNotes('');
        setDialogOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        router.post(
            `/admin/menus/${menu.id}/recipe`,
            {
                ingredient_id: ingredientId,
                quantity_per_portion: qty,
                unit:
                    availableIngredients.find(
                        (i) => String(i.id) === ingredientId,
                    )?.unit ?? 'unit',
                yield_percentage: yieldPct,
                notes: notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            },
        );
    }

    function removeRecipe(recipeId: number) {
        router.delete(`/admin/recipes/${recipeId}`, { preserveScroll: true });
    }

    function recalculate() {
        router.post(`/admin/menus/${menu.id}/recipe/recalculate`, {}, { preserveScroll: true });
    }

    const price = Number(menu.price);
    const margin = price > 0 ? ((price - hpp) / price) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={`Resep - ${menu.name}`} />

            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 border-b border-[#CFC0A4]/40 pb-6">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                        <ChefHat className="size-3.5 text-[#4F6B6A]" />
                        <span>Resep / Bill of Materials</span>
                    </div>
                    <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                {menu.name}
                            </h1>
                            {menu.category && (
                                <Badge className="mt-2 rounded-full bg-secondary/30 text-primary">
                                    {menu.category.name}
                                </Badge>
                            )}
                        </div>
                        <Button
                            onClick={openAdd}
                            disabled={availableIngredients.length === 0}
                        >
                            <Plus className="size-4 text-[#CFC0A4]" />
                            Bahan Baku
                        </Button>
                    </div>
                </div>

                {/* HPP Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Harga Jual
                            </p>
                        </CardHeader>
                        <CardContent>
                            <p className="font-serif text-xl font-bold text-slate-800">
                                Rp {price.toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                HPP Teoritis
                            </p>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <p className="font-serif text-xl font-bold text-[#4F6B6A]">
                                Rp {hpp.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                            </p>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-[#4F6B6A]"
                                onClick={recalculate}
                                title="Hitung ulang HPP"
                            >
                                <RefreshCw className="size-3.5" />
                            </Button>
                        </CardContent>
                    </Card>
                    <Card
                        className={
                            margin >= 60
                                ? 'border-emerald-200 bg-emerald-50/50 shadow-sm'
                                : 'border-amber-200 bg-amber-50/50 shadow-sm'
                        }
                    >
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Margin
                            </p>
                        </CardHeader>
                        <CardContent>
                            <p
                                className={`font-serif text-xl font-bold ${
                                    margin >= 60 ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                            >
                                {margin.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Validation Warnings */}
                {validation.length > 0 && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                            <TriangleAlert className="size-4" />
                            Perhatian Resep
                        </div>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-700">
                            {validation.map((v, i) => (
                                <li key={i}>{v}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recipe List */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Bahan Baku
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Qty / Porsi
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Yield %
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {row.ingredient?.name ?? `#${row.ingredient_id}`}
                                            {row.notes && (
                                                <span className="block text-xs text-slate-400 italic">
                                                    {row.notes}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {Number(row.quantity_per_portion).toLocaleString('id-ID')}{' '}
                                            {row.unit}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {Number(row.yield_percentage)}%
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                                onClick={() => removeRecipe(row.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {recipes.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">
                                Resep Belum Ada
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Tambahkan bahan baku untuk menghitung HPP otomatis.
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Add Ingredient Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Tambah Bahan ke Resep
                        </DialogTitle>
                        <DialogDescription>
                            Pilih bahan baku dan jumlah per porsi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bahan Baku</Label>
                            <Select value={ingredientId} onValueChange={setIngredientId} required>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih bahan baku" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {availableIngredients.map((ing) => (
                                        <SelectItem key={ing.id} value={String(ing.id)}>
                                            {ing.name} ({ing.unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="qty">Qty per Porsi</Label>
                                <Input
                                    id="qty"
                                    type="number"
                                    step="any"
                                    min="0.0001"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="yield">Yield %</Label>
                                <Input
                                    id="yield"
                                    type="number"
                                    step="any"
                                    min="0.01"
                                    max="100"
                                    value={yieldPct}
                                    onChange={(e) => setYieldPct(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan (opsional)</Label>
                            <Input
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="misal: digoreng dulu"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setDialogOpen(false)}
                                className="border border-[#CFC0A4]/40"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={!ingredientId || !qty}>
                                Tambahkan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

MenuRecipe.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
        { title: 'Resep', href: '' },
    ],
};

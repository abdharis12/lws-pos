import { Head, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, Minus, X, ShoppingCart, Search, Wallet, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string;
    is_available: boolean;
}

interface OptionGroup {
    id: number;
    name: string;
    selection_type: string;
    is_required: boolean;
    option_items: OptionItem[];
}

interface MenuItem {
    id: number;
    name: string;
    price: string;
    is_available: boolean;
    photo_path: string | null;
    option_groups: OptionGroup[];
}

interface Category {
    id: number;
    name: string;
    menus: MenuItem[];
}

interface TableData {
    id: number;
    code: string;
    capacity: number;
    status: string;
}

interface ActiveSession {
    id: number;
    table_id: number;
    status: string;
}

interface CartItem {
    menu: MenuItem;
    qty: number;
    notes: string;
    selectedOptions: { itemId: number; name: string; adjustment: number }[];
}

interface Props {
    categories: Category[];
    tables: TableData[];
    activeSessions: ActiveSession[];
}

function MenuCard({ menu, onSelect }: { menu: MenuItem; onSelect: () => void }) {
    return (
        <button
            onClick={onSelect}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md active:scale-95"
        >
            <div className="flex size-12 items-center justify-center rounded-full bg-[#4F6B6A]/10 text-lg font-bold text-[#4F6B6A]">
                {menu.name.charAt(0)}
            </div>
            <span className="line-clamp-1 text-center text-xs font-medium">{menu.name}</span>
            <span className="text-xs font-semibold text-[#4F6B6A]">
                Rp {Number(menu.price).toLocaleString('id-ID')}
            </span>
        </button>
    );
}

function CartPanel({
    items,
    processing,
    onUpdateQty,
    onRemove,
    onOrder,
}: {
    items: CartItem[];
    processing: boolean;
    onUpdateQty: (index: number, qty: number) => void;
    onRemove: (index: number) => void;
    onOrder: (method?: string) => void;
}) {
    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);
            return sum + (Number(item.menu.price) + optAdj) * item.qty;
        }, 0);
    }, [items]);

    return (
        <div className="flex h-full flex-col">
            <div className="border-b p-4">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="size-5" />
                    <span className="font-semibold">Pesanan</span>
                    {items.length > 0 && (
                        <Badge variant="secondary">{items.reduce((s, i) => s + i.qty, 0)}</Badge>
                    )}
                </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Belum ada item</p>
                ) : (
                    items.map((item, i) => {
                        const itemTotal = (Number(item.menu.price) + item.selectedOptions.reduce((s, o) => s + o.adjustment, 0)) * item.qty;
                        return (
                            <div key={i} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between">
                                    <span className="text-sm font-medium">{item.menu.name}</span>
                                    <Button variant="ghost" size="icon" className="size-6" onClick={() => onRemove(i)}>
                                        <X className="size-3" />
                                    </Button>
                                </div>
                                {item.selectedOptions.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {item.selectedOptions.map(o => o.name).join(', ')}
                                    </p>
                                )}
                                {item.notes && (
                                    <p className="text-xs text-muted-foreground">Catatan: {item.notes}</p>
                                )}
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="size-7" onClick={() => onUpdateQty(i, item.qty - 1)}>
                                            <Minus className="size-3" />
                                        </Button>
                                        <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                                        <Button variant="outline" size="icon" className="size-7" onClick={() => onUpdateQty(i, item.qty + 1)}>
                                            <Plus className="size-3" />
                                        </Button>
                                    </div>
                                    <span className="text-sm font-semibold">Rp {itemTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div className="border-t p-4">
                <div className="mb-4 flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex flex-col gap-2">
                    <Button onClick={() => onOrder('cash')} disabled={items.length === 0 || processing} className="w-full" size="lg">
                        <Wallet className="mr-2 size-4" /> Bayar Cash
                    </Button>
                    <Button onClick={() => onOrder('qris')} disabled={items.length === 0 || processing} variant="secondary" className="w-full" size="lg">
                        <QrCode className="mr-2 size-4" /> Bayar QRIS
                    </Button>
                    <Button onClick={() => onOrder()} disabled={items.length === 0 || processing} variant="outline" className="w-full">
                        Simpan
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PosIndex({ categories, tables }: Props) {
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        () => categories.length > 0 ? categories[0].id : null
    );
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [itemDialogMenu, setItemDialogMenu] = useState<MenuItem | null>(null);
    const [itemDialogQty, setItemDialogQty] = useState(1);
    const [itemDialogNotes, setItemDialogNotes] = useState('');
    const [itemDialogOptions, setItemDialogOptions] = useState<Record<number, number[]>>({});

    const { post, processing } = useForm({});

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

    const filteredMenus = useMemo(() => {
        if (!selectedCategory) return [];
        const menus = selectedCategory.menus;
        if (!searchQuery) return menus.filter(m => m.is_available);
        return menus.filter(m => m.is_available && m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [selectedCategory, searchQuery]);

    const allMenus = useMemo(() => categories.flatMap(c => c.menus), [categories]);

    const visibleMenus = useMemo(() => {
        if (!searchQuery) return selectedCategory ? selectedCategory.menus.filter(m => m.is_available) : [];
        const lowered = searchQuery.toLowerCase();
        return allMenus.filter(m => m.is_available && m.name.toLowerCase().includes(lowered));
    }, [searchQuery, selectedCategory, allMenus]);

    function openItemDialog(menu: MenuItem) {
        setItemDialogMenu(menu);
        setItemDialogQty(1);
        setItemDialogNotes('');
        const opts: Record<number, number[]> = {};
        for (const g of menu.option_groups) opts[g.id] = [];
        setItemDialogOptions(opts);
        setItemDialogOpen(true);
    }

    function toggleOption(groupId: number, itemId: number, selectionType: string) {
        setItemDialogOptions(prev => {
            const current = [...(prev[groupId] || [])];
            if (selectionType === 'single') {
                return { ...prev, [groupId]: current.includes(itemId) ? [] : [itemId] };
            }
            const idx = current.indexOf(itemId);
            idx >= 0 ? current.splice(idx, 1) : current.push(itemId);
            return { ...prev, [groupId]: current };
        });
    }

    function addToCart() {
        if (!itemDialogMenu) return;
        const selectedOptions: CartItem['selectedOptions'] = [];
        for (const group of itemDialogMenu.option_groups) {
            for (const id of (itemDialogOptions[group.id] || [])) {
                const opt = group.option_items.find(i => i.id === id);
                if (opt) selectedOptions.push({ itemId: opt.id, name: opt.name, adjustment: Number(opt.price_adjustment) });
            }
        }
        setCartItems(prev => {
            const existing = prev.findIndex(item =>
                item.menu.id === itemDialogMenu.id &&
                item.notes === itemDialogNotes &&
                JSON.stringify(item.selectedOptions.map(o => o.itemId).sort()) === JSON.stringify(selectedOptions.map(o => o.itemId).sort())
            );
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { ...updated[existing], qty: updated[existing].qty + itemDialogQty };
                return updated;
            }
            return [...prev, { menu: itemDialogMenu, qty: itemDialogQty, notes: itemDialogNotes, selectedOptions }];
        });
        setItemDialogOpen(false);
    }

    function handleOrder(paymentMethod?: string) {
        if (cartItems.length === 0) return;
        post('/pos/orders', {
            data: {
                table_id: selectedTableId,
                items: cartItems.map(item => ({
                    menu_id: item.menu.id,
                    qty: item.qty,
                    notes: item.notes || null,
                    option_ids: item.selectedOptions.map(o => o.itemId),
                })),
                payment_method: paymentMethod || null,
            },
            preserveScroll: true,
            onSuccess: () => {
                setCartItems([]);
                setSelectedTableId(null);
                setCartOpen(false);
            },
        });
    }

    const tableColors: Record<string, string> = {
        available: 'bg-emerald-500 hover:bg-emerald-600',
        occupied: 'bg-amber-500 hover:bg-amber-600',
        reserved: 'bg-blue-500 hover:bg-blue-600',
    };

    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex h-screen overflow-hidden bg-background">
                <aside className="hidden w-80 flex-shrink-0 flex-col border-r bg-muted/20 p-4 lg:flex">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Meja</h2>
                        <p className="text-xs text-muted-foreground">Pilih meja untuk order</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {tables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => setSelectedTableId(table.id === selectedTableId ? null : table.id)}
                                className={cn(
                                    'flex flex-col items-center rounded-lg p-3 text-sm font-medium text-white transition-all',
                                    tableColors[table.status] || 'bg-gray-400',
                                    selectedTableId === table.id && 'ring-2 ring-white ring-offset-2 ring-offset-background'
                                )}
                            >
                                <span className="text-lg font-bold">{table.code}</span>
                                <span className="mt-0.5 text-[10px] opacity-80">{table.capacity} org</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto border-b p-3 lg:hidden">
                        {tables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => setSelectedTableId(table.id === selectedTableId ? null : table.id)}
                                className={cn(
                                    'flex-shrink-0 rounded-lg px-4 py-2 text-xs font-medium text-white',
                                    tableColors[table.status] || 'bg-gray-400',
                                    selectedTableId === table.id && 'ring-2 ring-white ring-offset-2'
                                )}
                            >
                                {table.code}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 overflow-x-auto border-b px-4">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={cn(
                                    'flex-shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                                    selectedCategoryId === cat.id
                                        ? 'border-[#4F6B6A] text-[#4F6B6A]'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="border-b px-4 py-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari menu..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {visibleMenus.map(menu => (
                                <MenuCard key={menu.id} menu={menu} onSelect={() => openItemDialog(menu)} />
                            ))}
                            {visibleMenus.length === 0 && (
                                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                                    Menu tidak ditemukan
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="hidden w-96 flex-shrink-0 border-l bg-background lg:flex lg:flex-col">
                    <CartPanel
                        items={cartItems}
                        processing={processing}
                        onUpdateQty={(i, q) => setCartItems(prev => q < 1 ? prev : prev.map((item, idx) => idx === i ? { ...item, qty: q } : item))}
                        onRemove={i => setCartItems(prev => prev.filter((_, idx) => idx !== i))}
                        onOrder={handleOrder}
                    />
                </aside>

                <button
                    onClick={() => setCartOpen(true)}
                    className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#4F6B6A] text-white shadow-lg lg:hidden"
                >
                    <ShoppingCart className="size-6" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {cartCount}
                        </span>
                    )}
                </button>

                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetContent side="bottom" className="h-[85vh]">
                        <SheetHeader>
                            <SheetTitle>Pesanan</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto pt-4">
                            <CartPanel
                                items={cartItems}
                                processing={processing}
                                onUpdateQty={(i, q) => setCartItems(prev => q < 1 ? prev : prev.map((item, idx) => idx === i ? { ...item, qty: q } : item))}
                                onRemove={i => setCartItems(prev => prev.filter((_, idx) => idx !== i))}
                                onOrder={handleOrder}
                            />
                        </div>
                    </SheetContent>
                </Sheet>

                <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{itemDialogMenu?.name}</DialogTitle>
                        </DialogHeader>
                        {itemDialogMenu && (
                            <div className="space-y-4">
                                <div className="text-2xl font-bold text-[#4F6B6A]">
                                    Rp {Number(itemDialogMenu.price).toLocaleString('id-ID')}
                                </div>

                                {itemDialogMenu.option_groups.map(group => (
                                    <div key={group.id}>
                                        <Label className="mb-2 block">
                                            {group.name}
                                            {group.is_required && <span className="ml-1 text-red-500">*</span>}
                                        </Label>
                                        <div className="space-y-1">
                                            {group.option_items.filter(i => i.is_available).map(opt => {
                                                const selected = (itemDialogOptions[group.id] || []).includes(opt.id);
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => toggleOption(group.id, opt.id, group.selection_type)}
                                                        className={cn(
                                                            'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors',
                                                            selected ? 'border-[#4F6B6A] bg-[#4F6B6A]/5' : 'hover:bg-muted'
                                                        )}
                                                    >
                                                        <span>{opt.name}</span>
                                                        {Number(opt.price_adjustment) > 0 && (
                                                            <span className="text-muted-foreground">
                                                                +Rp {Number(opt.price_adjustment).toLocaleString('id-ID')}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div>
                                    <Label>Catatan</Label>
                                    <Input
                                        value={itemDialogNotes}
                                        onChange={e => setItemDialogNotes(e.target.value)}
                                        placeholder="Contoh: tidak pedas"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label>Jumlah</Label>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" size="icon" onClick={() => setItemDialogQty(q => Math.max(1, q - 1))}>
                                            <Minus className="size-4" />
                                        </Button>
                                        <span className="w-8 text-center font-semibold">{itemDialogQty}</span>
                                        <Button variant="outline" size="icon" onClick={() => setItemDialogQty(q => q + 1)}>
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Button onClick={addToCart} className="w-full" size="lg">
                                    Tambah ke Keranjang
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

PosIndex.layout = null;

import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import type { MenuItem, CartItem } from '../types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    menu: MenuItem | null;
    onAdd: (menu: MenuItem, qty: number, notes: string, selectedOptions: CartItem['selectedOptions']) => void;
}

export default function ItemDialog({ open, onOpenChange, menu, onAdd }: Props) {
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');
    const [options, setOptions] = useState<Record<number, number[]>>({});

    function reset(menu: MenuItem | null) {
        setQty(1);
        setNotes('');
        const opts: Record<number, number[]> = {};
        if (menu) for (const g of menu.option_groups) opts[g.id] = [];
        setOptions(opts);
    }

    function toggleOption(groupId: number, itemId: number, selectionType: string) {
        setOptions(prev => {
            const current = [...(prev[groupId] || [])];
            if (selectionType === 'single') {
                return { ...prev, [groupId]: current.includes(itemId) ? [] : [itemId] };
            }
            const idx = current.indexOf(itemId);
            idx >= 0 ? current.splice(idx, 1) : current.push(itemId);
            return { ...prev, [groupId]: current };
        });
    }

    function handleAdd() {
        if (!menu) return;
        const selectedOptions: CartItem['selectedOptions'] = [];
        for (const group of menu.option_groups) {
            for (const id of (options[group.id] || [])) {
                const opt = group.option_items.find(i => i.id === id);
                if (opt) selectedOptions.push({ itemId: opt.id, name: opt.name, adjustment: Number(opt.price_adjustment) });
            }
        }
        onAdd(menu, qty, notes, selectedOptions);
        reset(null);
        onOpenChange(false);
    }

    function handleOpenChange(open: boolean) {
        if (open && menu) reset(menu);
        onOpenChange(open);
    }

    const topAdj = menu ? menu.option_groups.reduce((sum, g) => {
        return sum + (options[g.id] || []).reduce((s, id) => {
            const opt = g.option_items.find(i => i.id === id);
            return s + (opt ? Number(opt.price_adjustment) : 0);
        }, 0);
    }, 0) : 0;
    const itemTotal = menu ? (Number(menu.price) + topAdj) * qty : 0;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>{menu?.name}</DialogTitle>
                </DialogHeader>
                {menu && (
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="size-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#F0EBDF]">
                                {menu.photo_path ? (
                                    <img src={`/storage/${menu.photo_path}`} alt={menu.name} className="size-full object-cover" />
                                ) : (
                                    <div className="flex size-full items-center justify-center">
                                        <span className="text-2xl font-bold" style={{ color: `${PRIMARY}25` }}>{menu.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="text-2xl font-bold" style={{ color: PRIMARY }}>
                                    Rp {Number(menu.price).toLocaleString('id-ID')}
                                </div>
                                {topAdj > 0 && (
                                    <p className="text-xs" style={{ color: MUTED }}>
                                        +Rp {topAdj.toLocaleString('id-ID')} topping
                                    </p>
                                )}
                                {menu.description && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {menu.description.split(',').map((item, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                                style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}
                                            >
                                                {item.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {menu.option_groups.map(group => (
                            <div key={group.id} className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-sm font-semibold" style={{ color: INK }}>{group.name}</span>
                                    {group.is_required && (
                                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>Wajib</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {group.option_items.filter(i => i.is_available).map(opt => {
                                        const selected = (options[group.id] || []).includes(opt.id);
                                        const adj = Number(opt.price_adjustment);
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleOption(group.id, opt.id, group.selection_type)}
                                                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                                                style={{
                                                    backgroundColor: selected ? PRIMARY : CREAM,
                                                    color: selected ? '#fff' : INK,
                                                    border: `1.5px solid ${selected ? PRIMARY : BORDER}`,
                                                }}
                                            >
                                                <div className="flex size-5 items-center justify-center rounded-full border" style={{
                                                    borderColor: selected ? '#fff' : BORDER,
                                                    backgroundColor: selected ? '#fff' : 'transparent',
                                                }}>
                                                    {selected && <Check className="size-3" style={{ color: PRIMARY }} />}
                                                </div>
                                                <div className="flex flex-1 items-center justify-between min-w-0">
                                                    <span className="truncate">{opt.name}</span>
                                                    {adj > 0 && (
                                                        <span className="ml-1 whitespace-nowrap text-xs opacity-80">
                                                            +Rp{adj.toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                            <Label style={{ color: INK }}>Catatan</Label>
                            <Input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Contoh: tidak pedas"
                                className="mt-2 border-0" style={{ backgroundColor: CREAM }}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                            <Label style={{ color: INK }}>Jumlah</Label>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ borderColor: BORDER }}>
                                    <Minus className="size-4" />
                                </Button>
                                <span className="w-8 text-center font-semibold" style={{ color: INK }}>{qty}</span>
                                <Button variant="outline" size="icon" onClick={() => setQty(q => q + 1)} style={{ borderColor: BORDER }}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <Button onClick={handleAdd} className="w-full" size="lg" style={{ backgroundColor: PRIMARY }}>
                            Tambah ke Keranjang — Rp {itemTotal.toLocaleString('id-ID')}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

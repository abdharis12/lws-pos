import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BORDER, INK, MUTED, PRIMARY, SAND, TABLE_COLORS } from '../constants';
import type { TableData } from '../types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tables: TableData[];
    selectedTableIds: number[];
    onApply: (ids: number[]) => void;
}

export default function TablePickerDialog({
    open,
    onOpenChange,
    tables,
    selectedTableIds,
    onApply,
}: Props) {
    const [selection, setSelection] = useState<number[]>([]);
    const [floor, setFloor] = useState<string | null>(null);
    const [prevOpen, setPrevOpen] = useState(open);

    if (open !== prevOpen) {
        setPrevOpen(open);

        if (open) {
            setSelection(selectedTableIds.filter((id) => tables.some((t) => t.id === id)));
        }
    }

    const floors = [...new Set(tables.map((t) => t.floor).filter((f): f is string => f !== null))];
    const visible = floor ? tables.filter((t) => t.floor === floor) : tables;

    function toggle(id: number) {
        setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg" style={{ backgroundColor: '#fff' }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>Pilih Meja</DialogTitle>
                </DialogHeader>

                {tables.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                        <p className="text-sm" style={{ color: MUTED }}>
                            Tidak ada meja tersedia saat ini.
                        </p>
                        <p className="mt-1 text-xs" style={{ color: MUTED }}>
                            Kosongkan meja terlebih dahulu untuk membuat pesanan dine-in.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {floors.length > 1 && (
                            <div className="flex gap-1 overflow-x-auto pb-1">
                                <button
                                    onClick={() => setFloor(null)}
                                    className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
                                    style={{
                                        backgroundColor: floor === null ? PRIMARY : 'oklch(0.48 0.032 195.5 / 0.06)',
                                        color: floor === null ? '#fff' : INK,
                                    }}
                                >
                                    Semua
                                </button>
                                {floors.map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFloor(f)}
                                        className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
                                        style={{
                                            backgroundColor: floor === f ? PRIMARY : 'oklch(0.48 0.032 195.5 / 0.06)',
                                            color: floor === f ? '#fff' : INK,
                                        }}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                            {visible.map((table) => {
                                const selected = selection.includes(table.id);

                                return (
                                    <button
                                        key={table.id}
                                        onClick={() => toggle(table.id)}
                                        className={cn(
                                            'relative flex flex-col items-center rounded-xl border p-3 text-sm font-medium transition-all hover:opacity-90',
                                            selected && 'ring-1',
                                        )}
                                        style={{
                                            backgroundColor: selected ? PRIMARY : (TABLE_COLORS[table.status] || '#fff'),
                                            color: selected ? '#fff' : INK,
                                            borderColor: selected ? PRIMARY : BORDER,
                                        }}
                                    >
                                        <span className="text-base font-bold">{table.code}</span>
                                        <span className="mt-0.5 text-[10px] opacity-80">{table.capacity} org</span>
                                        {selected && (
                                            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: SAND, color: INK }}>
                                                <Check className="size-3" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button
                                disabled={selection.length === 0}
                                onClick={() => onApply(selection)}
                                style={{ backgroundColor: PRIMARY }}
                            >
                                Terapkan{selection.length > 0 ? ` (${selection.length})` : ''}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
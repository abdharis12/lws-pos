import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY, TABLE_COLORS } from '../constants';
import type { TableData } from '../types';

interface Props {
    open: boolean;
    mode: 'move' | 'merge' | null;
    sourceTable: { id: number; code: string };
    tables: TableData[];
    onClose: () => void;
}

export default function MoveMergeDialog({ open, mode, sourceTable, tables, onClose }: Props) {
    const [loading, setLoading] = useState(false);

    const filtered = tables.filter(t => {
        if (t.id === sourceTable.id) {
return false;
}

        if (mode === 'move') {
return t.status === 'available';
}

        if (mode === 'merge') {
return t.status === 'occupied';
}

        return false;
    });

    const label = mode === 'move' ? 'Pindah Meja' : 'Gabung Meja';
    const emptyText = mode === 'move'
        ? 'Tidak ada meja kosong'
        : 'Tidak ada meja terisi lain';

    const handleSelect = (target: TableData) => {
        setLoading(true);
        router.post(`/pos/tables/${sourceTable.id}/${mode}/${target.id}`, {}, {
            onFinish: () => {
                setLoading(false);
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
 if (!v && !loading) {
onClose();
} 
}}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <div className="py-2">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={onClose} className="p-1 -ml-1 rounded-lg hover:opacity-70">
                            <ArrowLeft className="size-5" style={{ color: INK }} />
                        </button>
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: INK }}>
                                {label}
                            </h3>
                            <p className="text-sm" style={{ color: MUTED }}>
                                Meja {sourceTable.code} → pilih meja tujuan
                            </p>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <p className="py-8 text-center text-sm" style={{ color: MUTED }}>
                            {emptyText}
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {filtered.map(t => (
                                <button
                                    key={t.id}
                                    disabled={loading}
                                    onClick={() => handleSelect(t)}
                                    className="relative flex flex-col items-center rounded-xl p-3 text-sm font-medium transition-all hover:opacity-85 disabled:opacity-50"
                                    style={{
                                        backgroundColor: TABLE_COLORS[t.status] || '#9ca3af',
                                        color: t.status === 'available' ? INK : '#fff',
                                    }}
                                >
                                    <span className="text-lg font-bold">{t.code}</span>
                                    <span className="mt-0.5 text-[10px] opacity-80">{t.capacity} org</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

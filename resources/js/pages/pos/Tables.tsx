import { Head, Link, router } from '@inertiajs/react';
import { ArrowRightLeft, ArrowLeft, Lock, Move, Unlock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY, TABLE_COLORS } from './constants';
import MoveMergeDialog from './dialogs/MoveMergeDialog';
import { posFetchJson } from './lib/api';
import type { MejaPageProps, TableData } from './types';

const STATUS_LABELS: Record<string, string> = {
    available: 'Kosong',
    locked: 'Dikunci',
    occupied: 'Terisi',
    reserved: 'Reserved',
};

function statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
}

export default function PosTables({ tables, groupedTables }: MejaPageProps) {
    const [floor, setFloor] = useState<string | null>(null);
    const [releaseTable, setReleaseTable] = useState<TableData | null>(null);
    const [moveMerge, setMoveMerge] = useState<{ mode: 'move' | 'merge'; sourceTable: { id: number; code: string } } | null>(null);

    const floors = useMemo(
        () => [...new Set(tables.map((t) => t.floor).filter((f): f is string => f !== null))],
        [tables],
    );
    const visible = floor ? tables.filter((t) => t.floor === floor) : tables;

    const groupLabelFor = (table: TableData): string | null => {
        const extras = groupedTables?.[table.id];

        if (extras?.length) {
            const codes = tables.filter((t) => extras.includes(t.id)).map((t) => t.code).join(', ');

            return `+${extras.length} ${codes}`;
        }

        const mainId = Object.entries(groupedTables ?? {}).find(([, ids]) => ids.includes(table.id))?.[0];
        const main = mainId ? tables.find((t) => t.id === Number(mainId)) : null;

        return main ? `gabung ${main.code}` : null;
    };

    async function toggleLock(table: TableData) {
        const isLock = table.status === 'available';
        const { ok, data } = await posFetchJson<{ message?: string }>(
            `/pos/tables/${table.id}/${isLock ? 'lock' : 'unlock'}`,
            { method: 'POST' },
        );

        if (!ok) {
            toast.error(data?.message || (isLock ? 'Gagal mengunci meja' : 'Gagal unlock meja'));

            return;
        }

        router.reload();
    }

    function releaseTableNow() {
        if (!releaseTable) {
            return;
        }

        router.post(`/pos/tables/${releaseTable.id}/release`);
    }

    return (
        <>
            <Head title="Meja" />
            <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: CREAM }}>
                <div className="border-b px-5 py-3" style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/pos" className="flex size-9 items-center justify-center rounded-xl transition-all hover:opacity-70" style={{ backgroundColor: `${PRIMARY}0f`, color: INK }}>
                                <ArrowLeft className="size-4" />
                            </Link>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MUTED }}>POS Kasir</p>
                                <h2 className="font-serif text-lg font-bold tracking-tight" style={{ color: INK }}>Meja</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ backgroundColor: TABLE_COLORS.available }} /> Kosong</span>
                            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ backgroundColor: TABLE_COLORS.locked }} /> Dikunci</span>
                            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ backgroundColor: TABLE_COLORS.occupied }} /> Terisi</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                    {floors.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto px-5 pt-4 pb-1">
                            <button
                                onClick={() => setFloor(null)}
                                className="flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium"
                                style={{
                                    backgroundColor: floor === null ? PRIMARY : `${PRIMARY}10`,
                                    color: floor === null ? '#fff' : INK,
                                }}
                            >
                                Semua
                            </button>
                            {floors.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFloor(f)}
                                    className="flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium"
                                    style={{
                                        backgroundColor: floor === f ? PRIMARY : `${PRIMARY}10`,
                                        color: floor === f ? '#fff' : INK,
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                            {visible.map((table) => {
                                const selectedBg = TABLE_COLORS[table.status] || '#9ca3af';
                                const textColor = table.status === 'available' ? INK : '#fff';
                                const groupLabel = groupLabelFor(table);

                                return (
                                    <div
                                        key={table.id}
                                        className="flex flex-col rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                                        style={{ backgroundColor: '#fff', borderColor: BORDER }}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex size-11 items-center justify-center rounded-xl text-lg font-bold" style={{ backgroundColor: selectedBg, color: textColor }}>
                                                {table.code}
                                            </span>
                                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}>
                                                {statusLabel(table.status)}
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-0.5">
                                            <p className="text-sm font-medium" style={{ color: INK }}>{table.capacity} org</p>
                                            {table.floor && <p className="text-xs" style={{ color: MUTED }}>{table.floor}</p>}
                                            {groupLabel && <p className="text-[11px]" style={{ color: PRIMARY }}>{groupLabel}</p>}
                                            {table.status === 'locked' && table.locked_by_user && (
                                                <p className="text-[11px]" style={{ color: MUTED }}>oleh {table.locked_by_user.name}</p>
                                            )}
                                        </div>
                                        <div className="mt-3 flex gap-1.5">
                                            {(table.status === 'available' || table.status === 'locked') && (
                                                <button
                                                    onClick={() => toggleLock(table)}
                                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-all hover:opacity-80"
                                                    style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}
                                                >
                                                    {table.status === 'available' ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                                                    {table.status === 'available' ? 'Kunci' : 'Buka'}
                                                </button>
                                            )}
                                            {table.status === 'occupied' && (
                                                <button
                                                    onClick={() => setReleaseTable(table)}
                                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-white transition-all hover:opacity-80"
                                                    style={{ backgroundColor: PRIMARY }}
                                                >
                                                    <Move className="size-3" /> Kelola
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <MoveMergeDialog
                open={moveMerge !== null}
                mode={moveMerge?.mode ?? null}
                sourceTable={moveMerge?.sourceTable ?? { id: 0, code: '' }}
                tables={tables}
                onClose={() => setMoveMerge(null)}
            />

            <Dialog open={releaseTable !== null} onOpenChange={(v) => {
                if (!v) {
                    setReleaseTable(null);
                }
            }}>
                <DialogContent className="sm:max-w-xs border-0 shadow-lg shadow-slate-900/10" style={{ backgroundColor: '#fff' }}>
                    <div className="flex flex-col items-center py-4 text-center">
                        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${PRIMARY}15` }}>
                            <Move className="size-7" style={{ color: PRIMARY }} />
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: INK }}>Meja {releaseTable?.code}</h3>
                        <p className="mt-1 text-sm" style={{ color: MUTED }}>Meja sedang digunakan</p>
                        <div className="mt-5 flex w-full flex-col gap-2">
                            <button onClick={() => {
                                const t = releaseTable; setReleaseTable(null);

                                if (t) {
                                    setMoveMerge({ mode: 'move', sourceTable: t });
                                }
                            }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                style={{ backgroundColor: PRIMARY }}>
                                <Move className="size-4" /> Pindah Meja
                            </button>
                            {(tables.filter((t) => t.status === 'occupied' && t.id !== releaseTable?.id).length > 0) && (
                                <button onClick={() => {
                                    const t = releaseTable; setReleaseTable(null);

                                    if (t) {
                                        setMoveMerge({ mode: 'merge', sourceTable: t });
                                    }
                                }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                    style={{ backgroundColor: PRIMARY }}>
                                    <ArrowRightLeft className="size-4" /> Gabung Meja
                                </button>
                            )}
                            <button onClick={releaseTableNow}
                                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                style={{ backgroundColor: PRIMARY }}>
                                Kosongkan Meja
                            </button>
                            <button onClick={() => setReleaseTable(null)}
                                className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-70"
                                style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                Batal
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

PosTables.layout = null;
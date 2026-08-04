import { Check, Lock, Link as LinkIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BORDER, INK, MUTED, PRIMARY, SAND, TABLE_COLORS } from '../constants';
import type { TableData } from '../types';
import FloorTabs from './FloorTabs';

interface Props {
    tables: TableData[];
    selectedTableIds: number[];
    groupedTables: Record<number, number[]> | null;
    onTableClick: (table: TableData) => void;
    onLockToggle: (table: TableData) => void;
}

function getGroupLabel(tableId: number, tables: TableData[], groupedBy: Record<number, number>, groupedTables: Record<number, number[]> | null): string | null {
    const mainId = groupedBy[tableId];

    if (mainId) {
        const mainTable = tables.find(t => t.id === mainId);

        return `${mainTable?.code ?? `Meja ${mainId}`}`;
    }

    const extras = groupedTables?.[tableId];

    if (extras?.length) {
        const extraTables = tables.filter(t => extras.includes(t.id));

        return `+${extras.length} ${extraTables.map(t => t.code).join(', ')}`;
    }

    return null;
}

function useGroupedBy(groupedTables: Record<number, number[]> | null): Record<number, number> {
    return useMemo(() => {
        const map: Record<number, number> = {};

        if (groupedTables) {
            for (const [mainId, extras] of Object.entries(groupedTables)) {
                for (const extraId of extras) {
                    map[extraId] = Number(mainId);
                }
            }
        }

        return map;
    }, [groupedTables]);
}

function TableCard({
    table,
    isSelected,
    onSelect,
    onLockToggle,
    groupLabel,
}: {
    table: TableData;
    isSelected: boolean;
    onSelect: () => void;
    onLockToggle: () => void;
    groupLabel: string | null;
}) {
    const bgColor = isSelected ? PRIMARY : (TABLE_COLORS[table.status] || '#9ca3af');
    const textColor = isSelected || table.status !== 'available' ? '#fff' : INK;

    return (
        <div
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
onSelect();
} 
}}
            className={cn(
                'relative flex cursor-pointer flex-col items-center rounded-xl p-3 text-sm font-medium transition-all hover:opacity-90',
                isSelected && 'ring-1',
            )}
            style={{
                backgroundColor: bgColor,
                color: textColor,
                ...(isSelected ? { ringColor: SAND } : {}),
            }}
        >
            <span className="text-lg font-bold">{table.code}</span>
            <span className="mt-0.5 text-[10px] opacity-80">{table.capacity} org</span>
            {(table.status === 'available' || table.status === 'locked') && (
                <button
                    onClick={(e) => {
 e.stopPropagation(); onLockToggle(); 
}}
                    className="mt-0.5 flex items-center gap-0.5 text-[9px] opacity-70 hover:text-black hover:opacity-100"
                    title={table.status === 'locked' ? 'Klik unlock' : 'Klik lock'}
                >
                    <Lock className="size-2.5" />
                    {table.status === 'locked' ? (table.locked_by_user?.name ?? 'Terkunci') : 'Buka'}
                </button>
            )}
            {groupLabel && (
                <span className="mt-0.5 flex items-center gap-0.5 text-[9px] opacity-80">
                    <LinkIcon className="size-2.5" />
                    {groupLabel}
                </span>
            )}
            {isSelected && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: SAND, color: INK }}>
                    <Check className="size-3" />
                </span>
            )}
        </div>
    );
}

function TableCardMobile({
    table,
    isSelected,
    onSelect,
    onLockToggle,
    groupLabel,
}: {
    table: TableData;
    isSelected: boolean;
    onSelect: () => void;
    onLockToggle: () => void;
    groupLabel: string | null;
}) {
    const bgColor = isSelected ? PRIMARY : (TABLE_COLORS[table.status] || '#9ca3af');
    const textColor = isSelected || table.status !== 'available' ? '#fff' : INK;

    return (
        <div className="relative flex flex-col items-center gap-0.5 flex-shrink-0">
            <button
                onClick={onSelect}
                className="rounded-xl px-4 py-2 text-xs font-medium"
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    ...(isSelected ? { outline: `2px solid ${SAND}`, outlineOffset: '2px' } : {}),
                }}
            >
                <span>{table.code}</span>
                {groupLabel && (
                    <span className="ml-1 text-[9px] opacity-80">{groupLabel}</span>
                )}
                {isSelected && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full" style={{ backgroundColor: SAND, color: INK }}>
                        <Check className="size-2.5" />
                    </span>
                )}
            </button>
            {(table.status === 'available' || table.status === 'locked') && (
                <button
                    onClick={onLockToggle}
                    className="flex items-center gap-0.5 text-[9px] opacity-70 hover:opacity-100"
                    title={table.status === 'locked' ? 'Klik unlock' : 'Klik lock'}
                >
                    <Lock className="size-2.5" />
                    {table.status === 'locked' ? (table.locked_by_user?.name ?? 'Terkunci') : 'Buka kunci'}
                </button>
            )}
        </div>
    );
}

export default function TableGrid({
    tables,
    selectedTableIds,
    groupedTables: groupedTablesProp,
    onTableClick,
    onLockToggle,
}: Props) {
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
    const groupedBy = useGroupedBy(groupedTablesProp ?? null);

    const allFloors = useMemo(() => {
        const floors = tables.map(t => t.floor).filter((f): f is string => f !== null);

        return [...new Set(floors)];
    }, [tables]);

    const filteredTables = useMemo(() => {
        if (!selectedFloor) {
return tables;
}

        return tables.filter(t => t.floor === selectedFloor);
    }, [tables, selectedFloor]);

    return (
        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MUTED }}>Pilih Meja</p>
            <h2 className="font-serif text-lg font-bold tracking-tight pb-2" style={{ color: PRIMARY }}>Meja</h2>
            <hr className='pb-2'/>
            {allFloors.length > 0 && (
                <FloorTabs
                    floors={allFloors}
                    selectedFloor={selectedFloor}
                    onSelect={setSelectedFloor}
                    variant="sidebar"
                />
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
                {filteredTables.map(table => {
                    const isSelected = selectedTableIds.includes(table.id);
                    const groupLabel = getGroupLabel(table.id, tables, groupedBy, groupedTablesProp ?? null);

                    return (
                        <TableCard
                            key={table.id}
                            table={table}
                            isSelected={isSelected}
                            onSelect={() => onTableClick(table)}
                            onLockToggle={() => onLockToggle(table)}
                            groupLabel={groupLabel}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export function MobileTableStrip({
    tables,
    selectedTableIds,
    groupedTables: groupedTablesProp,
    onTableClick,
    onLockToggle,
    isDineIn,
}: {
    tables: TableData[];
    selectedTableIds: number[];
    groupedTables: Record<number, number[]> | null;
    onTableClick: (table: TableData) => void;
    onLockToggle: (table: TableData) => void;
    isDineIn: boolean;
}) {
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
    const groupedBy = useGroupedBy(groupedTablesProp ?? null);

    const allFloors = useMemo(() => {
        const floors = tables.map(t => t.floor).filter((f): f is string => f !== null);

        return [...new Set(floors)];
    }, [tables]);

    const filteredTables = useMemo(() => {
        if (!selectedFloor) {
return tables;
}

        return tables.filter(t => t.floor === selectedFloor);
    }, [tables, selectedFloor]);

    if (!isDineIn) {
return null;
}

    return (
        <>
            {allFloors.length > 0 && (
                <FloorTabs
                    floors={allFloors}
                    selectedFloor={selectedFloor}
                    onSelect={setSelectedFloor}
                    variant="mobile"
                />
            )}
            <div className="flex gap-2 overflow-x-auto p-3 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                {filteredTables.map(table => {
                    const isSelected = selectedTableIds.includes(table.id);
                    const groupLabel = getGroupLabel(table.id, tables, groupedBy, groupedTablesProp ?? null);

                    return (
                        <TableCardMobile
                            key={table.id}
                            table={table}
                            isSelected={isSelected}
                            onSelect={() => onTableClick(table)}
                            onLockToggle={() => onLockToggle(table)}
                            groupLabel={groupLabel}
                        />
                    );
                })}
            </div>
        </>
    );
}

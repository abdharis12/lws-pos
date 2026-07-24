import { BORDER, INK, PRIMARY } from '../constants';
import type { MenuItem } from '../types';

export default function MenuCard({ menu, onSelect }: { menu: MenuItem; onSelect: () => void }) {
    return (
        <button
            onClick={onSelect}
            className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md active:scale-[0.98]"
            style={{ borderColor: BORDER }}
        >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#F0EBDF]">
                {menu.photo_path ? (
                    <img
                        src={`/storage/${menu.photo_path}`}
                        alt={menu.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <span className="text-4xl font-bold" style={{ color: `${PRIMARY}25` }}>
                            {menu.name.charAt(0)}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1 p-3 text-left">
                <span className="line-clamp-1 text-sm font-medium" style={{ color: INK }}>
                    {menu.name}
                </span>
                <span className="text-xs font-semibold" style={{ color: PRIMARY }}>
                    Rp {Number(menu.price).toLocaleString('id-ID')}
                </span>
            </div>
        </button>
    );
}

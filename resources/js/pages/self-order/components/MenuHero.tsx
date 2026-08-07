import { Flame, Search, Sparkles } from 'lucide-react'
import { fmt } from '@/lib/currency'
import type { MenuItem } from '@/types/self-order'

interface Props {
    outletName: string
    tableCode: string
    customerName: string
    onCustomerNameChange: (v: string) => void
    totalMenus: number
    spotlightMenu?: MenuItem
    onSpotlightSelect: (menu: MenuItem) => void
}

export function MenuHero({
    outletName,
    tableCode,
    customerName,
    onCustomerNameChange,
    totalMenus,
    spotlightMenu,
    onSpotlightSelect,
}: Props) {
    return (
        <div className="relative">
            <section className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-[#1F3736] via-[#2A4443] to-[#3E5C58] pb-14 pt-11 sm:pt-14">
                {/* subtle spice-dust texture */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                        backgroundImage: 'radial-gradient(#D9A441 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                    }}
                />
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D9A441]/10 blur-3xl"
                    aria-hidden
                />

                <div className="relative mx-auto max-w-2xl px-5">
                    <div className="flex items-center gap-2 text-[#D9A441]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em]">
                            {outletName} <span className="bg-secondary text-primary ml-2 rounded-2xl px-2 py-0.5">Meja {tableCode}</span>
                        </span>
                    </div>

                    <h1 className="font-display mt-3 max-w-xs text-[34px] font-semibold leading-[1.08] text-[#F6F2E9] sm:max-w-sm sm:text-4xl">
                        Lapar? Bubur hangat siap dipesan.
                    </h1>
                    <p className="font-body mt-2 text-sm text-[#CFC0A4]">
                        {totalMenus} menu menunggu dari mejamu, tanpa antre kasir.
                    </p>

                    <div className="relative mt-5">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <input
                            type="text"
                            value={customerName}
                            onChange={e => onCustomerNameChange(e.target.value)}
                            placeholder="Siapa nama kamu?"
                            className="font-body w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-11 pr-4 text-sm text-white placeholder-[#CFC0A4]/70 outline-none backdrop-blur-md transition-all focus:border-[#D9A441]/60 focus:ring-2 focus:ring-[#D9A441]/25"
                        />
                    </div>
                </div>
            </section>

            {spotlightMenu && (
                <div className="relative mx-auto -mt-10 max-w-2xl px-5">
                    <button
                        onClick={() => onSpotlightSelect(spotlightMenu)}
                        className="group flex w-full items-center gap-3.5 rounded-[26px] bg-white p-3 text-left shadow-xl shadow-black/10 ring-1 ring-black/5 transition-transform active:scale-[0.98]"
                    >
                        <div className="relative h-20 w-20 shrink-0">
                            {/* steam wisps rising off the dish */}
                            <svg
                                viewBox="0 0 60 30"
                                className="pointer-events-none absolute -top-6 left-1/2 h-7 w-14 -translate-x-1/2 text-[#CFC0A4]"
                                fill="none"
                                aria-hidden
                            >
                                <path
                                    d="M10 30 C10 15, 20 15, 18 5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    className="animate-steam"
                                    style={{ animationDelay: '0s' }}
                                />
                                <path
                                    d="M30 30 C30 15, 40 15, 38 5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    className="animate-steam"
                                    style={{ animationDelay: '0.6s' }}
                                />
                                <path
                                    d="M50 30 C50 15, 44 15, 46 5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    className="animate-steam"
                                    style={{ animationDelay: '1.2s' }}
                                />
                            </svg>

                            {spotlightMenu.photo_path ? (
                                <img
                                    src={`/storage/${spotlightMenu.photo_path}`}
                                    alt={spotlightMenu.name}
                                    className="h-full w-full rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F6B6A] to-[#2A4443] text-xl font-bold text-white">
                                    {spotlightMenu.name.charAt(0)}
                                </div>
                            )}

                            <span className="absolute -left-2 -top-2 flex items-center gap-1 rounded-full bg-[#D9A441] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                                <Flame className="h-2.5 w-2.5" />
                                Favorit
                            </span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-[#8C9C6E]">
                                Paling dicari hari ini
                            </p>
                            <p className="font-display truncate text-lg font-semibold text-[#2A2620]">
                                {spotlightMenu.name}
                            </p>
                            <p className="font-body text-sm font-bold text-[#4F6B6A]">{fmt(spotlightMenu.price)}</p>
                        </div>

                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2A4443] text-lg font-semibold text-white shadow-sm transition-transform group-hover:scale-105 group-active:scale-95"
                            aria-hidden
                        >
                            +
                        </span>
                    </button>
                </div>
            )}
        </div>
    )
}

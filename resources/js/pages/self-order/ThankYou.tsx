import { Head, router } from '@inertiajs/react';
import { HandHeart, Heart, Sparkles, Store, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderItem {
    id: number;
    menu: { name: string };
    qty: number;
    notes: string | null;
    options: { quantity: number; option_item: { name: string } }[];
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    items: OrderItem[];
    subtotal?: number;
    tax?: number;
    total: number;
    customer_name: string | null;
    served_by?: { name: string } | null;
}

interface Props {
    table: { code: string };
    tableToken: string;
    order: Order;
}

let _fmt: Intl.NumberFormat;

function fmt(price: number) {
    _fmt ??= new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return _fmt.format(price);
}

export default function SelfOrderThankYou({ table, tableToken, order }: Props) {
    const firstParty = order.customer_name?.trim();

    return (
        <div className="font-body min-h-screen bg-[#F6F2E9]">
            <Head title="Terima Kasih">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
                .font-body { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }

                @keyframes steam-rise {
                    0% { transform: translateY(0) scaleY(1); opacity: 0; }
                    15% { opacity: .55; }
                    55% { opacity: .35; }
                    100% { transform: translateY(-14px) scaleY(1.2); opacity: 0; }
                }
                @keyframes celebrate-pop {
                    0% { transform: scale(0.85); opacity: 0; }
                    60% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes heart-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.12); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-steam { animation: steam-rise 3.2s ease-in-out infinite; }
                .animate-celebrate { animation: celebrate-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .animate-heart { animation: heart-pulse 1.6s ease-in-out infinite; }
                .animate-rise { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

                @media (prefers-reduced-motion: reduce) {
                    .animate-steam, .animate-celebrate, .animate-heart, .animate-rise { animation: none; }
                }
            `}</style>

            <section className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-[#1F3736] via-[#2A4443] to-[#3E5C58] pb-16 pt-11 sm:pt-14">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                        backgroundImage:
                            'radial-gradient(#D9A441 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                    }}
                />
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D9A441]/10 blur-3xl"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-[#4F6B6A]/30 blur-3xl"
                    aria-hidden
                />

                <div className="relative mx-auto max-w-2xl px-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-[#D9A441]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em]">
                            Pesanan Selesai
                        </span>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <div className="relative animate-celebrate flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6B6A] to-[#2C4645] shadow-xl shadow-[#4F6B6A]/30">
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
                            <HandHeart className="h-12 w-12 text-white" />
                        </div>
                    </div>

                    <h1 className="font-display mt-5 text-[30px] font-semibold leading-[1.1] text-[#F6F2E9] sm:text-[34px]">
                        Terima Kasih{firstParty ? `, ${firstParty}` : ''}!
                    </h1>
                    <p className="font-body mt-2 text-sm text-[#CFC0A4]">
                        Pesanan kamu sudah diantar. Selamat menikmati!
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6B6A]/15 px-3 py-1 font-body text-xs font-semibold text-[#F6F2E9] ring-1 ring-white/15">
                            <Store className="h-3.5 w-3.5" />
                            Meja {table.code}
                        </span>
                        {order.customer_name && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6B6A]/15 px-3 py-1 font-body text-xs font-semibold text-[#F6F2E9] ring-1 ring-white/15">
                                <User className="h-3.5 w-3.5" />
                                {order.customer_name}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D9A441]/20 px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-[#F6F2E9] ring-1 ring-[#D9A441]/40">
                            # Pesanan {order.id}
                        </span>
                    </div>
                </div>
            </section>

            <div className="animate-rise mx-auto max-w-2xl px-4 pb-2 pt-8">
                <div className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-[#2A2620]">
                            Pesanan Anda
                        </h3>
                        <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-1 font-body text-xs font-semibold text-[#4F6B6A]">
                            {order.items.length} item
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl bg-[#F6F2E9]/60 p-3.5 ring-1 ring-[#CFC0A4]/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-md bg-[#4F6B6A]/10 px-2 py-0.5 font-body text-xs font-semibold text-[#4F6B6A]">
                                                {item.qty}x
                                            </span>
                                            <span className="font-body text-sm font-semibold text-[#2A2620]">
                                                {item.menu.name}
                                            </span>
                                        </div>
                                        {item.options?.length > 0 && (
                                            <p className="font-body mt-1.5 text-xs text-[#8C8577]">
                                                {item.options
                                                    .filter((o) => o.option_item)
                                                    .map((o) =>
                                                        o.quantity > 1
                                                            ? `${o.option_item.name} x${o.quantity}`
                                                            : o.option_item.name,
                                                    )
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {item.notes && (
                                            <p className="font-body mt-1 text-xs italic text-[#8C8577]">
                                                Catatan: {item.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#F6F2E9] pt-4">
                        <span className="font-body text-xs font-semibold uppercase tracking-wide text-[#8C8577]">
                            Total
                        </span>
                        <span className="font-display text-xl font-semibold text-[#4F6B6A]">
                            {fmt(order.total)}
                        </span>
                    </div>

                    {order.served_by?.name && (
                        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#4F6B6A]/5 px-3 py-2.5 ring-1 ring-[#4F6B6A]/10">
                            <Heart className="h-3.5 w-3.5 text-[#AD7E2C]" />
                            <p className="font-body text-xs text-[#8C8577]">
                                Diantar oleh{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {order.served_by.name}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6">
                <Button
                    className="h-12 w-full rounded-2xl bg-[#4F6B6A] font-body text-sm font-semibold text-white shadow-lg shadow-[#4F6B6A]/20 transition-all hover:bg-[#3d5554] active:scale-[0.98]"
                    onClick={() => router.visit(`/t/${tableToken}`)}
                >
                    Pesan Lagi
                </Button>
                <p className="mt-3 text-center font-body text-xs text-[#8C8577]">
                    Sampai jumpa di lain kesempatan!
                </p>
            </div>
        </div>
    );
}
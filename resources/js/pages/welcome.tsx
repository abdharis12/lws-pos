import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import { Hero } from '@/components/template/hero';
import { MenuSection } from '@/components/template/menu';

const CREAM = '#F6F2E9';
const PRIMARY = '#4F6B6A';
const INK = '#25332F';
const SAND = '#CFC0A4';

const features = [
    {
        title: 'Self-Service Ordering',
        description: 'Pelanggan scan QR code di meja, pesan sendiri dari HP. Order langsung masuk sistem.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
        ),
    },
    {
        title: 'Kitchen Display System',
        description: 'Dapur terima order realtime begitu pembayaran sukses. Status masak terpantau otomatis.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
        ),
    },
    {
        title: 'Pembayaran QRIS',
        description: 'Integrasi Midtrans dengan webhook otomatis. Status pembayaran terkonfirmasi real-time.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
        ),
    },
    {
        title: 'Menu Interaktif',
        description: 'Varian & add-on ala POS modern. Tingkatkan upsell dengan opsi topping, level pedas, ukuran porsi.',
        icon: (
            <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
        ),
    },
];

const steps = [
    { label: 'Scan QR', detail: 'Pelanggan scan kode di meja' },
    { label: 'Pilih Menu', detail: 'Order & topping dari HP sendiri' },
    { label: 'Bayar QRIS', detail: 'Konfirmasi otomatis via Midtrans' },
    { label: 'Dapur Masak', detail: 'Order muncul realtime di KDS' },
];

const stats = [
    { value: '40%', label: 'Efisiensi operasional' },
    { value: '<3', label: 'Detik konfirmasi bayar' },
    { value: '100%', label: 'Order tercatat otomatis' },
];

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                @keyframes steamRise {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    18% { opacity: .5; }
                    100% { transform: translateY(-34px) scale(1.2); opacity: 0; }
                }
                .steam-wisp { animation: steamRise 4.2s ease-in-out infinite; }
                .steam-wisp:nth-child(2) { animation-delay: 1.4s; }
                .steam-wisp:nth-child(3) { animation-delay: 2.8s; }
                @media (prefers-reduced-motion: reduce) {
                    .steam-wisp { animation: none; opacity: .3; }
                }
                .ticket-perf { position: relative; }
                .ticket-perf::before,
                .ticket-perf::after {
                    content: '';
                    position: absolute;
                    width: 22px;
                    height: 22px;
                    border-radius: 9999px;
                    background: ${CREAM};
                    top: 178px;
                    transform: translateY(-50%);
                }
                .ticket-perf::before { left: -11px; }
                .ticket-perf::after { right: -11px; }
                .ticket-dashline {
                    position: absolute;
                    left: 24px;
                    right: 24px;
                    top: 178px;
                    transform: translateY(-50%);
                    border-top: 2px dashed rgba(37,51,47,0.2);
                }
                .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
                .font-mono-tix { font-family: 'JetBrains Mono', ui-monospace, monospace; }
            `}</style>

            <div
                className="flex min-h-screen flex-col"
                style={{ backgroundColor: CREAM, color: INK, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
                {/* HEADER */}
                <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: 'rgba(37,51,47,0.08)', backgroundColor: 'rgba(246,242,233,0.85)' }}>
                    <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/img/lws-logo.png" alt="LW's by Bubur Kang LW" className="h-9 w-auto" />
                            <span className="flex flex-col">
                                <span className="font-display text-lg font-semibold leading-tight">LW's</span>
                                <span className="font-mono-tix text-[11px] uppercase tracking-wider" style={{ color: '#6b7a76' }}>
                                    by Bubur Kang LW
                                </span>
                            </span>
                        </Link>

                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link href={dashboard()}>
                                    <Button className="rounded-full font-semibold shadow-sm" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <Link href={login()}>
                                    <Button className="rounded-full font-semibold text-white shadow-sm" style={{ backgroundColor: PRIMARY }}>
                                        Masuk ke POS
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    {/* HERO */}
                    <Hero
                        onOpenReservation={() => {}}
                        onExploreMenu={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                    />

                    {/* ORDER FLOW */}
                    <section className="border-t px-6 py-16" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 max-w-xl">
                                <span className="font-mono-tix text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY }}>
                                    Alur Pemesanan
                                </span>
                                <h2 className="font-display mt-3 text-2xl font-semibold md:text-3xl">
                                    Empat langkah, tanpa antri kasir
                                </h2>
                            </div>

                            {/* CONTAINER UTAMA */}
                            <div className="relative grid gap-8 md:grid-cols-4">

                                {/* Garis Horizontal untuk Desktop/Tablet */}
                                <div
                                    className="absolute top-5 right-0 left-0 hidden h-px md:block"
                                    style={{ backgroundImage: 'repeating-linear-gradient(to right, rgba(37,51,47,0.25) 0 8px, transparent 8px 16px)' }}
                                />

                                {/* Garis Vertikal untuk Mobile (Menghubungkan antar lingkaran nomor) */}
                                <div
                                    className="absolute top-5 bottom-5 left-5 w-px -translate-x-1/2 md:hidden"
                                    style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(37,51,47,0.25) 0 8px, transparent 8px 16px)' }}
                                />

                                {steps.map((step, i) => (
                                    <div key={step.label} className="relative flex items-start gap-4 md:block">
                                        {/* Lingkaran Nomor */}
                                        <div
                                            className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full font-mono-tix text-sm font-semibold text-white shadow-sm md:mb-4"
                                            style={{ backgroundColor: PRIMARY }}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </div>

                                        {/* Teks Deskripsi */}
                                        <div className="pt-1.5 md:pt-0">
                                            <h3 className="font-display text-base font-semibold md:text-lg">{step.label}</h3>
                                            <p className="mt-1 text-sm leading-relaxed" style={{ color: '#5c6a66' }}>{step.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* FEATURES */}
                    <section className="border-t px-6 py-16 md:py-20" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                        <div className="mx-auto max-w-7xl">
                            <div className="mx-auto mb-14 max-w-2xl text-center">
                                <span className="font-mono-tix text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY }}>
                                    Semua dalam satu sistem
                                </span>
                                <h2 className="font-display mt-3 mb-4 text-3xl font-semibold md:text-4xl">
                                    Dari dapur hingga laporan keuangan
                                </h2>
                                <p style={{ color: '#5c6a66' }}>
                                    Dapur, kasir, pelanggan, dan owner — semua terhubung dalam satu platform.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 overflow-x-auto pt-2 pb-4 scrollbar-none">
                                <div className="flex w-max gap-6">
                                    {features.map((feature) => (
                                        <div
                                            key={feature.title}
                                            /* Menggunakan w-[320px] atau md:w-[380px] agar ukuran kartu fix dan lebih besar */
                                            className="group relative w-[320px] md:w-[380px] flex-shrink-0 overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                            style={{ backgroundColor: '#fff', borderColor: 'rgba(37,51,47,0.08)' }}
                                        >
                                            <div
                                                className="mb-6 inline-flex rounded-2xl p-4 text-white transition-transform duration-300 group-hover:scale-110"
                                                style={{ backgroundColor: PRIMARY }}
                                            >
                                                {feature.icon}
                                            </div>
                                            <h3 className="font-display mb-3 text-xl font-bold">{feature.title}</h3>
                                            <p className="text-base leading-relaxed" style={{ color: '#5c6a66' }}>
                                                {feature.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section>
                        <MenuSection />
                    </section>
                </main>

                {/* FOOTER */}
                <footer className="border-t px-6 py-8" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm sm:flex-row" style={{ color: '#8a968f' }}>
                        <span>&copy; {new Date().getFullYear()} LW's by Bubur Kang LW. All rights reserved.</span>
                        <span className="font-mono-tix text-xs">POS System v1.0</span>
                    </div>
                </footer>
            </div>
        </>
    );
}

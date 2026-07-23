import { Head, Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const CREAM = '#F6F2E9';
const PRIMARY = '#4F6B6A';
const INK = '#25332F';
const SAND = '#CFC0A4';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="relative flex min-h-svh flex-col"
                style={{ backgroundColor: CREAM, color: INK, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(37,51,47,0.04) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(37,51,47,0.04) 1px, transparent 1px)
                            `,
                            backgroundSize: '72px 72px',
                        }}
                    />
                    <div
                        className="absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full opacity-[0.08] blur-3xl"
                        style={{ backgroundColor: '#4F6B6A' }}
                    />
                    <div
                        className="absolute -bottom-1/4 -left-1/4 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-3xl"
                        style={{ backgroundColor: '#CFC0A4' }}
                    />
                </div>

                <main className="relative z-10 flex flex-1 items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-md">
                        <div className="relative rounded-2xl border-2 border-[#CFC0A4]/40 bg-[#233433] p-8 shadow-2xl">
                            <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-[#CFC0A4]" />
                            <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-[#CFC0A4]" />
                            <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#CFC0A4]" />
                            <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#CFC0A4]" />

                            <div className="mb-6 space-y-2 text-center">
                                <h1 className="font-display text-2xl font-semibold text-[#FAF8F5] md:text-3xl">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm text-[#CFC0A4]/80">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

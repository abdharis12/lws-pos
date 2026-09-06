import {
    ShoppingBag,
    Sparkles,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Star,
    Clock,
    Flame,
    CheckCircle2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { HERO_DISHES } from './heroData';
import type { DishData } from './heroData';
import type { MenuItem } from './menu';

interface HeroProps {
    onOpenReservation: () => void;
    onExploreMenu: () => void;
    onAddToCart?: (item: MenuItem) => void;
}

const AUTO_SLIDE_MS = 7000;

const useDishCarousel = (count: number) => {
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) {
            return;
        }

        const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), AUTO_SLIDE_MS);

        return () => clearInterval(timer);
    }, [isPaused, count]);

    const prev = () => setIndex((prevIndex) => (prevIndex - 1 + count) % count);
    const next = () => setIndex((prevIndex) => (prevIndex + 1) % count);

    return { index, isPaused, stop: () => setIsPaused(true), resume: () => setIsPaused(false), prev, next, select: setIndex };
};

type Carousel = ReturnType<typeof useDishCarousel>;

const TopStatusBar = ({ current, total }: { current: number; total: number }) => (
    <div className="relative z-30 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-sans text-[#4F6B6A]">
            <span className="w-2 h-2 rounded-full bg-[#4F6B6A] animate-ping"></span>
            <span className="font-semibold uppercase tracking-widest text-[11px]">
                Hidangan Spesial LW's by Bubur Kang LW
            </span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#4F6B6A] bg-white/70 px-2.5 py-0.5 rounded-full border border-[#CFC0A4]/40">
                0{current + 1} / 0{total}
            </span>
        </div>
    </div>
);

const BackgroundShapes = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-28 -left-28 w-[450px] h-[450px] rounded-full bg-[#4F6B6A]/12 blur-3xl transform rotate-12"></div>
        <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] rounded-full bg-[#D4A359]/14 blur-3xl transform -rotate-45"></div>
        <div className="absolute -bottom-24 left-1/4 w-[560px] h-[360px] rounded-full bg-[#8EA89D]/15 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#CFC0A4_1px,transparent_1px)] [background-size:26px_26px] opacity-25"></div>
    </div>
);

const BadgeRow = ({ dish }: { dish: DishData }) => (
    <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-semibold tracking-wide bg-[#4F6B6A]/15 text-[#233433] border border-[#4F6B6A]/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#4F6B6A]" />
            <span>Menu Spesial : {dish.label}</span>
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] font-sans text-[#4F6B6A] bg-white/80 px-2.5 py-1 rounded-full border border-[#CFC0A4]/40">
            <Clock className="w-3 h-3 text-[#4F6B6A]" />
            {dish.prepTime}
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] font-sans text-[#4F6B6A] bg-white/80 px-2.5 py-1 rounded-full border border-[#CFC0A4]/40">
            <Flame className="w-3 h-3 text-[#D4A359]" />
            {dish.calories}
        </span>
    </div>
);

const TagPills = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-wrap gap-2 pt-1">
        {tags.map((tag, idx) => (
            <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/85 border border-[#CFC0A4]/40 text-xs font-sans font-medium text-[#233433] shadow-xs"
            >
                <CheckCircle2 className="w-3 h-3 text-[#4F6B6A]" />
                {tag}
            </span>
        ))}
    </div>
);

const HeroText = ({
    dish,
    onOrder,
    onOpenReservation,
    onExploreMenu,
}: {
    dish: DishData;
    onOrder: () => void;
    onOpenReservation: () => void;
    onExploreMenu: () => void;
}) => (
    <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
        <AnimatePresence mode="wait">
            <motion.div
                key={`hero-text-${dish.id}`}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="space-y-5"
            >
                <BadgeRow dish={dish} />

                <div>
                    <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#233433] tracking-tight leading-[1.14]">
                        {dish.fullTitle}
                    </h1>
                    <p className="mt-1.5 font-serif-classic italic text-lg sm:text-xl text-[#4F6B6A] font-medium">
                        &quot;{dish.subtitle}&quot;
                    </p>
                </div>

                <p className="font-sans text-sm sm:text-base text-[#233433]/85 leading-relaxed max-w-xl">
                    {dish.description}
                </p>

                <TagPills tags={dish.highlightTags} />

                <div className="pt-2 flex items-baseline gap-3">
                    <span className="text-xs font-sans uppercase tracking-widest text-[#4F6B6A]/80 font-semibold">
                        Harga Porsi Spesial
                    </span>
                    <span className="font-serif-display text-2xl sm:text-3xl font-bold text-[#233433]">
                        Rp {dish.price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-sans text-[#4F6B6A]/75">Belum Termasuk Pajak</span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                    <button
                        onClick={onOrder}
                        className="px-7 py-3.5 rounded-xl bg-[#4F6B6A] hover:bg-[#233433] text-[#FAF8F5] font-sans font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 group active:scale-95 cursor-pointer"
                    >
                        <ShoppingBag className="w-4 h-4 text-[#CFC0A4] group-hover:scale-110 transition-transform" />
                        <span>Pesan Sekarang</span>
                    </button>

                    <button
                        onClick={onOpenReservation}
                        className="px-6 py-3.5 rounded-xl bg-white/90 hover:bg-white text-[#4F6B6A] border border-[#CFC0A4] font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-xs hover:shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                        <span>Reservasi Meja</span>
                    </button>

                    <button
                        onClick={onExploreMenu}
                        className="px-3 py-3.5 text-xs font-sans font-semibold text-[#4F6B6A] hover:text-[#233433] flex items-center gap-1 group transition-colors cursor-pointer"
                    >
                        <span>Lihat Seluruh Menu</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="pt-2 flex items-center gap-3 text-xs font-sans text-[#4F6B6A]/80 border-t border-[#4F6B6A]/15">
                    <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                    </div>
                    <span className="font-semibold text-[#233433]">4.9 / 5</span>
                    <span>•</span>
                    <span>Pilihan Santap Favorit Tamu Senopati</span>
                </div>
            </motion.div>
        </AnimatePresence>
    </div>
);

const DishVisual = ({ dish, onOrder }: { dish: DishData; onOrder: () => void }) => (
    <div className="lg:col-span-6 flex justify-center items-center order-1 lg:order-2 py-4 relative">
        <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[470px] aspect-square flex items-center justify-center">
            <div className="absolute inset-x-6 -bottom-6 h-14 bg-[#233433]/15 rounded-[100%] blur-2xl pointer-events-none"></div>
            <div className="absolute inset-x-16 -bottom-2 h-7 bg-[#233433]/25 rounded-[100%] blur-md pointer-events-none"></div>

            <motion.div
                key={`hint-dish-${dish.id}`}
                initial={{ opacity: 0, x: -140, rotate: -40, scale: 0.72 }}
                animate={{ opacity: 0.32, x: -110, rotate: -25, scale: 0.78 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute z-0 w-[210px] sm:w-[270px] aspect-square rounded-full pointer-events-none select-none filter blur-[1px] -left-8 sm:-left-14 -top-3 sm:-top-6"
            >
                <div className="w-full h-full rounded-full p-2 bg-white/60 border border-[#CFC0A4]/40 shadow-sm overflow-hidden">
                    <img
                        src={dish.previousDishImage}
                        alt="Previous Dish Trail Hint"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full filter saturate-90"
                    />
                </div>
                <div className="absolute inset-0 rounded-full border-t-2 border-[#D4A359]/30 -rotate-45"></div>
            </motion.div>

            <motion.div
                key={`trail-dish-${dish.id}`}
                initial={{ opacity: 0, x: -110, rotate: -35, scale: 0.85 }}
                animate={{ opacity: 0.45, x: -65, rotate: -14, scale: 0.92 }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: 0.05 }}
                className="absolute z-10 w-[240px] sm:w-[310px] aspect-square rounded-full pointer-events-none select-none filter blur-[0.6px] -left-3 sm:-left-8"
            >
                <div className="absolute -inset-2 rounded-full border-2 border-dashed border-[#C88A58]/35 animate-spin-slow pointer-events-none"></div>
                <div className="w-full h-full rounded-full p-2 bg-gradient-to-tr from-white/70 to-[#FAF9F5]/70 border-2 border-[#C88A58]/50 shadow-md overflow-hidden">
                    <img
                        src={dish.image}
                        alt="Motion Trail"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FAF9F5]/40 via-transparent to-transparent pointer-events-none"></div>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`main-dish-${dish.id}`}
                    initial={{ scale: 0.88, opacity: 0, rotate: 14 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.94, opacity: 0, rotate: -14 }}
                    transition={{ type: 'spring', stiffness: 70, damping: 18, mass: 0.9 }}
                    className="relative z-20 w-[260px] sm:w-[340px] lg:w-[390px] aspect-square flex items-center justify-center group cursor-pointer"
                    onClick={onOrder}
                >
                    <div
                        className={`relative w-full h-full rounded-full p-2.5 sm:p-3 bg-gradient-to-b from-[#FAF8F5] via-[#EFECE6] to-[#E3DFD5] border-[4.5px] ${dish.copperRimClass} ring-4 shadow-[0_25px_60px_-12px_rgba(35,52,51,0.26)] overflow-hidden transition-transform duration-700 group-hover:scale-[1.02]`}
                    >
                        <div
                            className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#4B3E2D 1px, transparent 1px)', backgroundSize: '8px 8px' }}
                        ></div>
                        <div className="absolute inset-0 rounded-full border border-[#FFDCB0]/60 pointer-events-none"></div>

                        <img
                            src={dish.image}
                            alt={dish.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-full select-none"
                        />

                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none"></div>

                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#233433]/90 backdrop-blur-sm text-white font-sans text-xs font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-[#CFC0A4]" />
                            <span>Pesan Hidangan Ini</span>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    </div>
);

const ThumbnailNav = ({
    dishes,
    activeIndex,
    onSelect,
    carousel,
}: {
    dishes: DishData[];
    activeIndex: number;
    onSelect: (index: number) => void;
    carousel: Carousel;
}) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 order-2 sm:order-1">
            <button
                onClick={carousel.prev}
                className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#4F6B6A] border border-[#CFC0A4]/50 shadow-xs hover:shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                aria-label="Hidangan Sebelumnya"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <button
                onClick={carousel.next}
                className="w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#4F6B6A] border border-[#CFC0A4]/50 shadow-xs hover:shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                aria-label="Hidangan Selanjutnya"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-sans text-[#4F6B6A]/75 ml-1 hidden md:inline">
                Gunakan tombol atau klik thumbnail
            </span>
        </div>

        <nav
            aria-label="Navigasi Menu Hidangan"
            className="inline-flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] order-1 sm:order-2"
        >
            {dishes.map((dish, idx) => {
                const isSelected = idx === activeIndex;

                return (
                    <button
                        key={dish.id}
                        onClick={() => onSelect(idx)}
                        className={`flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-300 text-left focus:outline-none cursor-pointer ${isSelected ? 'bg-[#4F6B6A]/10 border border-[#4F6B6A]/25 shadow-xs' : 'hover:bg-black/5 border border-transparent'
                            }`}
                    >
                        <div
                            className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden transition-all duration-300 ${isSelected
                                ? 'ring-2 ring-[#4F6B6A] ring-offset-2 ring-offset-[#FAF9F5] scale-105 shadow-sm'
                                : 'opacity-70 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={dish.image}
                                alt={dish.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex flex-col">
                            <span
                                className={`font-sans text-xs sm:text-sm font-semibold transition-colors ${isSelected ? 'text-[#233433]' : 'text-[#4F6B6A]/75'
                                    }`}
                            >
                                {dish.label}
                            </span>
                            {isSelected && (
                                <span className="text-[10px] font-sans font-medium text-[#4F6B6A] -mt-0.5">Aktif</span>
                            )}
                        </div>
                    </button>
                );
            })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 text-xs font-sans text-[#4F6B6A]/70 order-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CFC0A4]"></span>
            <span>{carousel.isPaused ? 'Animasi Dijeda (Hover)' : 'Rotasi Otomatis Aktif'}</span>
        </div>
    </div>
);

export const Hero: React.FC<HeroProps> = ({ onOpenReservation, onExploreMenu, onAddToCart }) => {
    const carousel = useDishCarousel(HERO_DISHES.length);
    const currentDish = HERO_DISHES[carousel.index];

    const handleOrder = () => {
        if (onAddToCart) {
            onAddToCart(currentDish.menuItemData);
        } else {
            onExploreMenu();
        }
    };

    return (
        <section
            className="relative overflow-hidden bg-[#FAF9F5] border-b border-[#E8E2D5] min-h-[660px] lg:min-h-[760px] flex flex-col justify-between select-none"
            onMouseEnter={carousel.stop}
            onMouseLeave={carousel.resume}
        >
            <BackgroundShapes />

            <TopStatusBar current={carousel.index} total={HERO_DISHES.length} />

            <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <HeroText
                    dish={currentDish}
                    onOrder={handleOrder}
                    onOpenReservation={onOpenReservation}
                    onExploreMenu={onExploreMenu}
                />

                <DishVisual dish={currentDish} onOrder={handleOrder} />
            </div>

            <footer className="relative z-30 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-2">
                <ThumbnailNav
                    dishes={HERO_DISHES}
                    activeIndex={carousel.index}
                    onSelect={carousel.select}
                    carousel={carousel}
                />
            </footer>
        </section>
    );
};

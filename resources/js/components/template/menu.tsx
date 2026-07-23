import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, Clock, Star, Info, Check, Plus, Utensils, Award } from 'lucide-react';
import { MenuItem } from '../template/types/types';
import { MENU_ITEMS } from '../template/data/mockData';

interface MenuSectionProps {
    onSelectDishForReservation?: (item: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ onSelectDishForReservation }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [dietaryFilter, setDietaryFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');
    const [activeModalItem, setActiveModalItem] = useState<MenuItem | null>(null);

    const categories = [
        { id: 'all', label: 'Semua Menu' },
        { id: 'bubur-signature', label: 'Bubur Signature LW' },
        { id: 'bistro-mains', label: 'Bistro & Fusion' },
        { id: 'pastry-bakery', label: 'Pastry & Croissant' },
        { id: 'artisan-drinks', label: 'Coffee & Artisan Tea' },
        { id: 'desserts', label: 'Desserts & Sweets' },
    ];

    const filteredItems = useMemo(() => {
        return MENU_ITEMS.filter((item) => {
            // Category check
            if (selectedCategory !== 'all' && item.category !== selectedCategory) {
                return false;
            }
            // Search check
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName = item.name.toLowerCase().includes(query);
                const matchesDesc = item.description.toLowerCase().includes(query);
                const matchesIng = item.ingredients.some(ing => ing.toLowerCase().includes(query));
                if (!matchesName && !matchesDesc && !matchesIng) return false;
            }
            // Dietary check
            if (dietaryFilter !== 'all') {
                if (!item.dietary.includes(dietaryFilter as any)) return false;
            }
            return true;
        }).sort((a, b) => {
            if (sortBy === 'price-asc') return a.price - b.price;
            if (sortBy === 'price-desc') return b.price - a.price;
            // Default popular
            return (b.rating * b.reviewCount) - (a.rating * a.reviewCount);
        });
    }, [selectedCategory, searchQuery, dietaryFilter, sortBy]);

    const formatIDR = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <section id="menu" className="py-20 bg-[#1C2625] text-[#FAF8F5] relative border-b border-[#CfC0A4]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#4F6B6A]/50 border border-[#CfC0A4]/40 text-[#CfC0A4] font-semibold text-xs tracking-widest uppercase mb-3">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Semua Menu LW's by Bubur Kang LW</span>
                    </div>
                    <h2 className="font-serif-classic text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FAF8F5] leading-tight">
                        Sajian Mahakarya <span className="text-[#CfC0A4] italic">LW’s</span>
                    </h2>
                    <div className="w-24 h-1 bg-[#CfC0A4] mx-auto mt-4 mb-4 rounded-full" />
                    <p className="text-gray-300 text-sm sm:text-base">
                        Eksplorasi pilihan hidangan bubur gurih berkualitas tinggi yang dibuat dengan cinta.
                    </p>
                </div>

                {/* Filter Controls Bar */}
                <div className="bg-[#273534] p-4 sm:p-6 rounded-2xl border border-[#CfC0A4]/30 shadow-xl mb-10 space-y-4">

                    {/* Top Row: Search & Sort */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Input */}
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari bubur, truffle, croissant, kopi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1C2625] text-white pl-10 pr-4 py-2.5 rounded-lg border border-[#CfC0A4]/30 text-sm focus:outline-none focus:border-[#CfC0A4] transition-all placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-medium tracking-wider transition-all border ${selectedCategory === cat.id
                                    ? 'bg-[#4F6B6A] text-[#FAF8F5] border-[#CfC0A4] font-bold shadow-md'
                                    : 'bg-[#1C2625] text-gray-300 border-gray-700 hover:border-[#CfC0A4]/40 hover:text-[#CfC0A4]'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                </div>

                {/* Menu Items Grid */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 bg-[#273534] rounded-xl border border-gray-700">
                        <Utensils className="w-12 h-12 text-[#CfC0A4] mx-auto mb-3 opacity-50" />
                        <h3 className="font-serif-classic text-xl font-bold text-white">Menu tidak ditemukan</h3>
                        <p className="text-gray-400 text-xs mt-1">Coba kata kunci pencarian lain atau ganti filter kategori.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-[#273534] rounded-2xl border border-[#CfC0A4]/30 overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#CfC0A4] transition-all flex flex-col group"
                            >
                                {/* Image & Badge Header */}
                                <div className="relative h-52 overflow-hidden bg-gray-900">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#273534] via-transparent to-transparent opacity-60" />

                                    {/* Badge */}
                                    {item.badge && (
                                        <span className="absolute top-3 left-3 bg-[#4F6B6A] text-[#FAF8F5] border border-[#CfC0A4] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-[#CfC0A4]" />
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Prep Time */}
                                    <span className="absolute bottom-3 right-3 bg-[#1C2625]/80 backdrop-blur-sm text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-[#CfC0A4]" />
                                        {item.preparationTime}
                                    </span>
                                </div>

                                {/* Content Body */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        {/* Rating & Dietary Tags */}
                                        <div className="flex items-center justify-between mb-2 text-xs">
                                            <div className="flex items-center gap-1 text-amber-400 font-bold">
                                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                <span>{item.rating}</span>
                                                <span className="text-gray-400 font-normal text-[11px]">({item.reviewCount})</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {item.dietary.map((d, i) => (
                                                    <span key={i} className="text-[10px] bg-[#4F6B6A]/30 text-[#CfC0A4] px-1.5 py-0.5 rounded border border-[#CfC0A4]/20">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <h3 className="font-serif-classic text-xl font-bold text-white group-hover:text-[#CfC0A4] transition-colors leading-snug">
                                            {item.name}
                                        </h3>
                                        <p className="text-gray-300 text-xs mt-2 line-clamp-2 font-light leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="pt-4 border-t border-gray-700/60 flex items-center justify-between">
                                        <div>
                                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Harga per Porsi</span>
                                            <span className="font-serif-classic text-lg font-bold text-[#CfC0A4]">
                                                {formatIDR(item.price)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setActiveModalItem(item)}
                                                className="px-3 py-1.5 rounded-md border border-[#CfC0A4]/40 text-xs font-medium text-gray-200 hover:text-[#CfC0A4] hover:bg-[#4F6B6A]/20 transition-all flex items-center gap-1"
                                                title="Lihat Detail Resep"
                                            >
                                                <Info className="w-3.5 h-3.5 text-[#CfC0A4]" />
                                                <span>Detail</span>
                                            </button>

                                            {onSelectDishForReservation && (
                                                <button
                                                    onClick={() => onSelectDishForReservation(item)}
                                                    className="px-3 py-1.5 rounded-md bg-[#4F6B6A] hover:bg-[#374b4a] text-white border border-[#CfC0A4] text-xs font-semibold shadow transition-all flex items-center gap-1"
                                                    title="Pesan Meja dengan Dish Ini"
                                                >
                                                    <Plus className="w-3.5 h-3.5 text-[#CfC0A4]" />
                                                    <span>Pesan Meja</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>

                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Detail Item */}
                {activeModalItem && (
                    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-[#1C2625] text-white max-w-2xl w-full rounded-2xl border-2 border-[#CfC0A4] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                            <div className="relative h-64 bg-black">
                                <img
                                    src={activeModalItem.image}
                                    alt={activeModalItem.name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                                <button
                                    onClick={() => setActiveModalItem(null)}
                                    className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 hover:bg-black transition-colors"
                                >
                                    ✕
                                </button>
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-[#4F6B6A] text-[#FAF8F5] border border-[#CfC0A4] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                        {activeModalItem.badge || 'LW’s Gourmet'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-serif-classic text-2xl font-bold text-[#CfC0A4]">
                                            {activeModalItem.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Estimasi Penyajian: {activeModalItem.preparationTime}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-serif-classic text-2xl font-bold text-[#CfC0A4]">
                                            {formatIDR(activeModalItem.price)}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-200 text-sm leading-relaxed">
                                    {activeModalItem.description}
                                </p>

                                {/* Ingredients List */}
                                <div className="bg-[#273534] p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-xs font-bold text-[#CfC0A4] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Award className="w-4 h-4" />
                                        Bahan-Bahan Utama & Kondimen:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {activeModalItem.ingredients.map((ing, idx) => (
                                            <span key={idx} className="bg-[#1C2625] text-gray-200 text-xs px-2.5 py-1 rounded-md border border-gray-600 flex items-center gap-1">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Pairing Suggestion */}
                                {activeModalItem.pairingSuggestion && (
                                    <div className="p-3 bg-[#4F6B6A]/20 border border-[#CfC0A4]/30 rounded-lg text-xs text-gray-200">
                                        <strong className="text-[#CfC0A4]">Rekomendasi Sommelier Minuman:</strong> Sempurna disajikan bersama <em className="italic">{activeModalItem.pairingSuggestion}</em>.
                                    </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-700">
                                    <button
                                        onClick={() => setActiveModalItem(null)}
                                        className="px-4 py-2 border border-gray-600 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-800"
                                    >
                                        Tutup
                                    </button>
                                    {onSelectDishForReservation && (
                                        <button
                                            onClick={() => {
                                                const item = activeModalItem;
                                                setActiveModalItem(null);
                                                onSelectDishForReservation(item);
                                            }}
                                            className="px-5 py-2 bg-[#4F6B6A] hover:bg-[#374b4a] text-white border border-[#CfC0A4] rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2"
                                        >
                                            <Utensils className="w-4 h-4 text-[#CfC0A4]" />
                                            <span>Reservasi Meja & Sertakan Dish Ini</span>
                                        </button>
                                    )}
                                </div>

                            </div>

                        </div>
                    </div>
                )}

            </div>
        </section>
    );
};

import { Search, Plus, Info, ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';

export interface MenuItem {
    id: string;
    name: string;
    frenchName?: string;
    category: 'Bubur' | 'Makanan' | 'Dessert' | 'Minuman';
    price: number;
    description: string;
    image: string;
    tags: string[];
    isChefSpecial?: boolean;
    calories?: string;
}

interface CatalogMenuItem {
    id: string;
    name: string;
    categoryId: string;
    price: number;
    description: string | null;
    photoPath: string | null;
}

export interface MenuCategory {
    id: number;
    name: string;
    menus: CatalogMenuItem[];
}

interface MenuSectionProps {
    menuCategories?: MenuCategory[];
    onAddToCart?: (item: CatalogMenuItem) => void;
    cartItems?: { item: CatalogMenuItem; quantity: number }[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({
    menuCategories = [],
    onAddToCart = () => { },
    cartItems = [],
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeItemModal, setActiveItemModal] = useState<CatalogMenuItem | null>(null);

    const categories = [
        { id: 'all', label: 'Semua Hidangan' },
        ...menuCategories.map((category) => ({ id: String(category.id), label: category.name })),
    ];
    const menuItems = menuCategories.flatMap((category) => category.menus);

    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

        return matchesCategory && matchesSearch;
    });

    const getItemQuantityInCart = (itemId: string) => {
        const found = cartItems.find((ci) => ci.item.id === itemId);

        return found ? found.quantity : 0;
    };

    return (
        <section id="menu" className="py-20 bg-[#4F6B6A] text-[#FAF8F5] relative border-b border-[#CFC0A4]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Title */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 text-[#CFC0A4] font-serif-classic italic text-lg">
                        <span className="w-8 h-[1px] bg-[#CFC0A4]"></span>
                        <span>Menu Spesialisasi & Citarasa</span>
                        <span className="w-8 h-[1px] bg-[#CFC0A4]"></span>
                    </div>
                    <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#FAF8F5]">
                        Menu Spesial Pilihan untuk Anda
                    </h2>
                    <p className="font-sans-clean text-base text-[#FAF8F5]/90 leading-relaxed">
                        Setiap hidangan diracik dengan resep otentik, memadukan kehangatan bubur artisanal Nusantara.
                    </p>
                </div>

                {/* Search Bar & Category Filters */}
                <div className="mt-10 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 bg-accent/10 p-4 rounded-xl border border-[#CFC0A4]/20 shadow-lg">

                        {/* Category Pills */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 w-full md:w-auto">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-xs font-sans-clean font-semibold tracking-wider transition-all duration-300 ${selectedCategory === cat.id
                                        ? 'bg-[#CFC0A4] text-[#233433] shadow-lg scale-102'
                                        : 'bg-[#233433] text-[#FAF8F5]/90 hover:text-[#CFC0A4] border border-[#CFC0A4]/20'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input Box */}
                        <div className="relative w-full md:w-72">
                            <input
                                type="text"
                                placeholder="Cari menu, rasa, atau bahan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#233433] border border-[#CFC0A4]/30 rounded-full py-2 pl-10 pr-4 text-xs text-[#FAF8F5] placeholder-[#FAF8F5]/40 focus:outline-none focus:border-[#CFC0A4]"
                            />
                            <Search className="w-4 h-4 text-[#CFC0A4] absolute left-3.5 top-2.5" />
                        </div>

                    </div>
                </div>

                {/* Menu Cards Grid */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item) => {
                        const qty = getItemQuantityInCart(item.id);

                        return (
                            <div
                                key={item.id}
                                className="bg-[#233433] border border-[#CFC0A4]/30 rounded-2xl overflow-hidden hover:border-[#CFC0A4] transition-all duration-300 shadow-xl flex flex-col group"
                            >
                                {/* Image & Badges */}
                                <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => setActiveItemModal(item)}>
                                    {item.photoPath ? (
                                        <img
                                            src={`/storage/${item.photoPath}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-[#4F6B6A] text-5xl text-[#CFC0A4]" aria-hidden="true">
                                            {item.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#233433] via-transparent to-transparent opacity-80"></div>

                                    {/* Price Tag */}
                                    <span className="absolute bottom-3 right-3 bg-[#4F6B6A]/90 border border-[#CFC0A4]/40 text-[#CFC0A4] font-serif-display font-bold text-base px-3 py-1 rounded-lg backdrop-blur-md">
                                        Rp {item.price.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h3
                                            onClick={() => setActiveItemModal(item)}
                                            className="font-serif-display text-xl font-medium text-[#FAF8F5] group-hover:text-[#CFC0A4] transition-colors cursor-pointer mt-0.5"
                                        >
                                            {item.name}
                                        </h3>
                                        {item.description && (
                                            <p className="font-sans-clean text-xs text-[#FAF8F5]/80 line-clamp-2 mt-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Bar: Quick Detail & Add to Order */}
                                    <div className="pt-3 border-t border-[#CFC0A4]/20 flex items-center justify-between">
                                        <button
                                            onClick={() => setActiveItemModal(item)}
                                            className="text-xs font-sans-clean text-[#CFC0A4] hover:text-[#FAF8F5] underline flex items-center gap-1"
                                        >
                                            <Info className="w-3.5 h-3.5" /> Detail Rasa
                                        </button>

                                        <button
                                            onClick={() => onAddToCart(item)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#CFC0A4] text-[#233433] font-sans-clean text-xs font-bold hover:bg-[#FAF8F5] transition-all duration-300 shadow-md"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>{qty > 0 ? `Tambah (${qty})` : 'Pesan'}</span>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-16 text-[#FAF8F5]/60 font-sans-clean">
                        <p className="text-lg font-serif-classic italic text-[#CFC0A4]">Tidak menemukan hidangan yang dicari?</p>
                        <p className="text-xs mt-1">Coba kata kunci lain atau pilih kategori di atas.</p>
                    </div>
                )}

            </div>

            {/* Item Detail Modal */}
            {activeItemModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-[#233433] border-2 border-[#CFC0A4] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-[#FAF8F5]">
                        <button
                            onClick={() => setActiveItemModal(null)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#233433]/80 text-[#FAF8F5] flex items-center justify-center border border-[#CFC0A4]/40 hover:bg-[#CFC0A4] hover:text-[#233433] transition-colors"
                        >
                            ✕
                        </button>

                        <div className="relative h-60">
                            {activeItemModal.photoPath ? (
                                <img src={`/storage/${activeItemModal.photoPath}`} alt={activeItemModal.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-[#4F6B6A] text-6xl text-[#CFC0A4]" aria-hidden="true">
                                    {activeItemModal.name.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#233433] via-transparent to-transparent"></div>
                        </div>

                        <div className="p-6 space-y-4">
                            <h3 className="font-serif-display text-2xl font-bold text-[#FAF8F5]">{activeItemModal.name}</h3>

                            {activeItemModal.description && (
                                <p className="font-sans-clean text-sm text-[#FAF8F5]/80 leading-relaxed">
                                    {activeItemModal.description}
                                </p>
                            )}

                            <div className="pt-4 border-t border-[#CFC0A4]/20 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#FAF8F5]/60 font-sans-clean">Harga Satuan</p>
                                    <p className="font-serif-display text-2xl font-bold text-[#CFC0A4]">
                                        Rp {activeItemModal.price.toLocaleString('id-ID')}
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        onAddToCart(activeItemModal);
                                        setActiveItemModal(null);
                                    }}
                                    className="px-6 py-3 rounded-lg bg-[#CFC0A4] text-[#233433] font-sans-clean font-bold text-xs uppercase tracking-wider hover:bg-[#FAF8F5] transition-colors flex items-center gap-2"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Tambah ke Keranjang</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
};

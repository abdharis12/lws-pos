import { Search, Plus, Star, Info, ShoppingBag } from 'lucide-react';
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

const MENU_ITEMS: MenuItem[] = [
    // Haute Porridge (Bubur Kang LW Special Edition)
    {
        id: 'hp-1',
        name: "Bubur Ayam Spesial",
        frenchName: "Bubur Ayam Telur",
        category: 'Bubur',
        price: 18000,
        description: "Bubur organik lembut disiram kuah rempah khas Kang LW dan ayam suwir plus telur.",
        image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80",
        tags: ["Telur Rebus", "Ayam Suwir", "Spesial"],
        isChefSpecial: true,
        calories: "180 kcal"
    },
    {
        id: 'hp-2',
        name: "Bubur Ikan",
        frenchName: "Bubur Ikan Cakalang",
        category: 'Bubur',
        price: 23000,
        description: "Bubur Ikan Cakalang suwir dengan cita rasa bebeda yang meledak dimulut.",
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
        tags: ["Cakalang Rica-Rica", "Pedas"],
        isChefSpecial: true,
        calories: "120 kcal"
    },
    {
        id: 'hp-3',
        name: "Bubur Manado",
        frenchName: "Perpaduan Bubur dengan Sayuran ",
        category: 'Bubur',
        price: 32000,
        description: "Bubur sehat khas Kang LW's berisi sayuran segar, labu kuning, dan jagung manis. Dilengkapi dengan ikan cakalang asap suwir dan sambal roa pedas autentik.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        tags: ["Jagung", "Labu", "Bayam"],
        calories: "150 kcal"
    },
    {
        id: 'hp-4',
        name: "Bubur Daging",
        frenchName: "Risotto Congee aux Champignons Porcini",
        category: 'Bubur',
        price: 32000,
        description: "Kelezatan semangkuk bubur Kang LW's hangat bertekstur lembut yang dipadu dengan empuknya irisan daging sapi pilihan.",
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
        tags: ["Daging", "Kuah Kuning"],
        calories: "320 kcal"
    },

    // Coffee & European Beverages
    {
        id: 'cb-1',
        name: "Nasi Kuning Kang LW",
        frenchName: "Nasi Kuning dengan Rasa Emas",
        category: 'Makanan',
        price: 29000,
        description: "Nasi kuning gurih harum rempah khas Kang LW, disajikan dengan lauk lengkap: ayam suwir, ikan cakalang, mie/bihun, telur, dan sambal pedas nikmat.",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        tags: ["Nasi Kuning", "Ayam Suwir", "Ikan Cakalang"],
        isChefSpecial: true
    },
    {
        id: 'cb-2',
        name: "Coto Makasar",
        frenchName: "Coto Makassar Khas Kang LW",
        category: 'Makanan',
        price: 38000,
        description: "Kelezatan kuah coto yang pekat, kaya rempah pilihan, dan gurih berkaldu asli.",
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
        tags: ["Daging Sapi", "Lontong"]
    },
    {
        id: 'cb-3',
        name: "Lontong Sayur",
        frenchName: "Lontong dengan Sayuran Segar",
        category: 'Makanan',
        price: 28000,
        description: "Lontong lembut disajikan dengan kuah kuning khas Kang LW, sayuran segar dan bumbu rempah khas Kang LW.",
        image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
        tags: ["Aromatic", "Ayam Panggang", "Lontong"]
    },
    {
        id: 'cb-4',
        name: "Nasi Rames LW",
        frenchName: "Nasi Rames Kang LW's Special Ayam dan Ikan Cakalang",
        category: 'Makanan',
        price: 34000,
        description: "Perpaduan sempurna antara gurihnya lauk utama pilihan, kelezatan tumisan sayur segar.",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
        tags: ["Ayam", "Ikan Cakalang", "Tumisan Sayur"]
    },

    // French Bakery & Desserts
    {
        id: 'fb-1',
        name: "Pie Buah",
        frenchName: "Pie Buah Klasik By Rumah Kue Bintang",
        category: 'Dessert',
        price: 22000,
        description: "Kulit pie renyah berpadu dengan vla vanila lembut yang manisnya pas. Disajikan dengan topping buah segar kaya vitamin.",
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        tags: ["Fresh", "Harus Dicoba", "Fla"],
        isChefSpecial: true
    },
    {
        id: 'fb-2',
        name: "Pudding Fruit",
        frenchName: "Pudding Buah Klasik By Rumah Kue Bintang",
        category: 'Dessert',
        price: 15000,
        description: "Pudding lembut dengan rasa buah segar, dilapisi karamel yang manis.",
        image: "https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=800&q=80",
        tags: ["Fresh", "Manis Pas"]
    },
    {
        id: 'fb-3',
        name: "Lalampa",
        frenchName: "Lalampa Khas Ternate By Rumah Kue Bintang",
        category: 'Dessert',
        price: 12000,
        description: "Kuliner tradisional khas Ternate yang mirip lemper, terbuat dari beras ketan pulen yang dimasak bersama santan gurih, diisi dengan suwiran ikan tongkol/cakalang berbumbu rempah pedas yang melimpah.",
        image: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80",
        tags: ["Ikan Cakalang", "Tradisional", "Khas Ternate"]
    },

    // Bistro Main Courses
    {
        id: 'bm-1',
        name: "Refresher Coconut",
        frenchName: "Refresher Coconut Smoothie",
        category: 'Minuman',
        price: 21000,
        description: "Smoothie segar dengan rasa kelapa, disajikan dingin.",
        image: "https://images.unsplash.com/photo-1575596510825-f748919a2bf7?auto=format&fit=crop&w=800&q=80",
        tags: ["Es Kelapa", "Segar", "Smoothie"],
        isChefSpecial: true
    },
    {
        id: 'bm-2',
        name: "Sunrise",
        frenchName: "Sunrise Lemonade",
        category: 'Minuman',
        price: 20000,
        description: "Minuman segar dengan rasa jeruk, disajikan dingin.",
        image: "https://images.unsplash.com/photo-1567671899076-51a64ddb7c5d?auto=format&fit=crop&w=800&q=80",
        tags: ["Es Jeruk", "Segar"],
        isChefSpecial: true
    }
];

interface MenuSectionProps {
    onAddToCart?: (item: MenuItem) => void;
    cartItems?: { item: MenuItem; quantity: number }[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({
    onAddToCart = () => { },
    cartItems = [],
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);

    const categories = [
        { id: 'all', label: 'Semua Hidangan' },
        { id: 'Bubur', label: '🍲 Bubur' },
        { id: 'Makanan', label: '🍚 Makanan' },
        { id: 'Minuman', label: '🍷 Minuman' },
        { id: 'Dessert', label: '🥐 Dessert' },
    ];

    const filteredItems = MENU_ITEMS.filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.frenchName && item.frenchName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

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
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#233433] via-transparent to-transparent opacity-80"></div>

                                    {/* Chef Special Badge */}
                                    {item.isChefSpecial && (
                                        <span className="absolute top-3 left-3 bg-[#CFC0A4] text-[#233433] text-[10px] font-bold font-sans-clean px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-[#233433]" /> Chef's Signature
                                        </span>
                                    )}

                                    {/* Price Tag */}
                                    <span className="absolute bottom-3 right-3 bg-[#4F6B6A]/90 border border-[#CFC0A4]/40 text-[#CFC0A4] font-serif-display font-bold text-base px-3 py-1 rounded-lg backdrop-blur-md">
                                        Rp {item.price.toLocaleString('id-ID')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        {item.frenchName && (
                                            <p className="font-serif-classic italic text-xs text-[#CFC0A4] tracking-wide">
                                                {item.frenchName}
                                            </p>
                                        )}
                                        <h3
                                            onClick={() => setActiveItemModal(item)}
                                            className="font-serif-display text-xl font-medium text-[#FAF8F5] group-hover:text-[#CFC0A4] transition-colors cursor-pointer mt-0.5"
                                        >
                                            {item.name}
                                        </h3>
                                        <p className="font-sans-clean text-xs text-[#FAF8F5]/80 line-clamp-2 mt-2 leading-relaxed">
                                            {item.description}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {item.tags.map((tag) => (
                                                <span key={tag} className="text-[10px] bg-[#4F6B6A] border border-[#CFC0A4]/20 text-[#CFC0A4] px-2 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
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
                            <img src={activeItemModal.image} alt={activeItemModal.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#233433] via-transparent to-transparent"></div>
                        </div>

                        <div className="p-6 space-y-4">
                            {activeItemModal.frenchName && (
                                <p className="font-serif-classic italic text-sm text-[#CFC0A4]">
                                    {activeItemModal.frenchName}
                                </p>
                            )}
                            <h3 className="font-serif-display text-2xl font-bold text-[#FAF8F5]">{activeItemModal.name}</h3>

                            <p className="font-sans-clean text-sm text-[#FAF8F5]/80 leading-relaxed">
                                {activeItemModal.description}
                            </p>

                            {activeItemModal.calories && (
                                <p className="text-xs font-sans-clean text-[#CFC0A4]">
                                    Informasi Nutrisi: <strong>{activeItemModal.calories}</strong>
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

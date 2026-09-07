import React, { useState } from 'react';
import { Search, Plus, Check, Star, Filter, Heart, Info, ChevronRight, ShoppingBag } from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  frenchName?: string;
  category: 'haute-porridge' | 'coffee-beverage' | 'french-bakery' | 'bistro-mains';
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
    name: "Bubur Ayam Royal Truffle LW's",
    frenchName: "Velouté de Riz Poulet au Truffe",
    category: 'haute-porridge',
    price: 68000,
    description: "Bubur organik lembut disiram kaldu kalkun 12 jam, potongan dada ayam asap, telur poached, minyak truffle hitam Perancis, emping emas & minyak wijen artisanal.",
    image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80",
    tags: ["Signature", "Truffle", "Best Seller"],
    isChefSpecial: true,
    calories: "380 kcal"
  },
  {
    id: 'hp-2',
    name: "Bubur Seafood Mediterranean LW's",
    frenchName: "Bouillabaisse de Riz aux Fruits de Mer",
    category: 'haute-porridge',
    price: 85000,
    description: "Bubur rempah saffron disajikan dengan udang galah bakar, cumi tinta hitam, kerang hijau Perancis, & parsley segar khas Riviera.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    tags: ["Seafood", "Saffron", "Chef's Choice"],
    isChefSpecial: true,
    calories: "420 kcal"
  },
  {
    id: 'hp-3',
    name: "Bubur Bebek Peking Five-Spice",
    frenchName: "Congee de Canard Rôti aux Epices",
    category: 'haute-porridge',
    price: 78000,
    description: "Daging bebek panggang Peking empuk dengan saus hoisin madu, telur pitik century, iris jahe muda, & daun bawang segar.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    tags: ["Roast Duck", "Rich Flavor"],
    calories: "450 kcal"
  },
  {
    id: 'hp-4',
    name: "Bubur Jamur Porcini & Parmigiano (V)",
    frenchName: "Risotto Congee aux Champignons Porcini",
    category: 'haute-porridge',
    price: 62000,
    description: "Bubur krem beraroma tumisan jamur wild porcini, keju Parmigiano-Reggiano parut 24 bulan, minyak zaitun ekstra virgin & crouton herb.",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
    tags: ["Vegetarian", "Creamy", "Parmigiano"],
    calories: "320 kcal"
  },

  // Coffee & European Beverages
  {
    id: 'cb-1',
    name: "Espresso Viennese Gold LW's",
    frenchName: "Café Viennois aux Feuillets d'Or",
    category: 'coffee-beverage',
    price: 42000,
    description: "Double shot Arabica Ethiopia & Toraja, ditutup whip cream vanilla Perancis, bubuk kayu manis Ceylon & serpihan emas 24k.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    tags: ["Gold Leaf", "Signature Coffee"],
    isChefSpecial: true
  },
  {
    id: 'cb-2',
    name: "Iced Pistachio Cream Latte",
    frenchName: "Latte Glacé à la Crème de Pistache",
    category: 'coffee-beverage',
    price: 48000,
    description: "Espresso lembut dipadukan dengan susu oat hangat, cold foam krim pistachio buatan sendiri & renyahan pistachio panggang.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    tags: ["Popular", "Pistachio", "Iced"]
  },
  {
    id: 'cb-3',
    name: "Café Au Lait Lavender Paris",
    frenchName: "Café au Lait à la Lavande de Provence",
    category: 'coffee-beverage',
    price: 45000,
    description: "Susu hangat diinfus ekstrak bunga lavender alami dari Provence, Perancis, dipadu espresso sangrai medium beraroma floral.",
    image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80",
    tags: ["Aromatic", "Floral", "Hot"]
  },
  {
    id: 'cb-4',
    name: "Chai Tea Latte Imperial",
    frenchName: "Thé Chai Impérial aux Epices",
    category: 'coffee-beverage',
    price: 40000,
    description: "Seduhan teh hitam Assam pilihan dengan kapulaga, kayu manis, cengkeh, madu hutan murni, & buih susu lembut.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    tags: ["Spiced Tea", "Non-Coffee"]
  },

  // French Bakery & Desserts
  {
    id: 'fb-1',
    name: "Croissant Butter Truffle Honey",
    frenchName: "Croissant au Beurre Truffé & Miel",
    category: 'french-bakery',
    price: 38000,
    description: "Croissant berlapis renyah dipanggang dengan mentega AOP Perancis, disiram madu murni bersentuhan aroma truffle ringan.",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    tags: ["Fresh Baked", "Must Try"],
    isChefSpecial: true
  },
  {
    id: 'fb-2',
    name: "Eclair au Chocolat Valrhona 70%",
    frenchName: "Eclair au Chocolat Noir Valrhona",
    category: 'french-bakery',
    price: 48000,
    description: "Pastry choux Perancis berisi cream chocolate Valrhona dark 70%, dilapisi ganache glossy berkilau & hazelnut caramel.",
    image: "https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=800&q=80",
    tags: ["Valrhona", "Decadent"]
  },
  {
    id: 'fb-3',
    name: "Tarte Tatin Apel Karamelized",
    frenchName: "Tarte Tatin Pommes Caramelisées",
    category: 'french-bakery',
    price: 52000,
    description: "Kue tar apel karamel hangat resep klasik Normandia, disajikan bersama satu scoop gelato vanilla Madagascar segar.",
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80",
    tags: ["Warm Dessert", "Classic French"]
  },

  // Bistro Main Courses
  {
    id: 'bm-1',
    name: "Steak Au Poivre Wagyu LW's",
    frenchName: "Steak au Poivre Vert & Purée Maison",
    category: 'bistro-mains',
    price: 185000,
    description: "Daging Wagyu Sirloin MB5 dipanggang pan-seared, saus krim lada hijau Perancis, kentang tumbuk mentega halus & tumis buncis.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    tags: ["Wagyu MB5", "Premium Dinner"],
    isChefSpecial: true
  },
  {
    id: 'bm-2',
    name: "Duck Confit Cassoulet Perancis",
    frenchName: "Confit de Canard aux Haricots Blancs",
    category: 'bistro-mains',
    price: 145000,
    description: "Paha bebek slow-cooked 8 jam dengan kulit garing keemasan, disajikan di atas rebusan kacang putih bermentega & herba thyme.",
    image: "https://images.unsplash.com/photo-1514944288352-18d7173af518?auto=format&fit=crop&w=800&q=80",
    tags: ["Classic Bistro", "Slow-Cooked"]
  }
];

interface MenuSectionProps {
  onAddToCart?: (item: MenuItem) => void;
  cartItems?: { item: MenuItem; quantity: number }[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  onAddToCart = () => {},
  cartItems = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);

  const categories = [
    { id: 'all', label: 'Semua Hidangan' },
    { id: 'haute-porridge', label: '🍲 Haute Porridge (Bubur Kang LW)' },
    { id: 'coffee-beverage', label: '☕ Kopi & Minuman' },
    { id: 'french-bakery', label: '🥐 Patisserie & Croissant' },
    { id: 'bistro-mains', label: '🍷 Bistro Main Course' },
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
            Carte du Jour — Menu Pilihan
          </h2>
          <p className="font-sans-clean text-base text-[#FAF8F5]/90 leading-relaxed">
            Setiap hidangan diracik dengan resep otentik, memadukan kehangatan bubur artisanal Nusantara dengan teknik boga klasik Eropa.
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
                  className={`px-4 py-2 rounded-full text-xs font-sans-clean font-semibold tracking-wider transition-all duration-300 ${
                    selectedCategory === cat.id
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

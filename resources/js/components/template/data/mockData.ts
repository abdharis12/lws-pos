import { MenuItem, Testimonial, Reservation } from '../types/types';

export const MENU_ITEMS: MenuItem[] = [
    {
        id: 'm1',
        name: 'Bubur Ayam Truffle Royale',
        category: 'bubur-signature',
        price: 85000,
        description: 'Bubur beras pilihan organik Kang LW yang dimasak perlahan 6 jam, diinfusi minyak Truffle Hitam Périgord, potongan dada ayam kampung panggang, telur sous-vide, krupuk pangsit emas, dan emping renyah.',
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=800&auto=format&fit=crop',
        badge: 'Chef Signature',
        ingredients: ['Beras Organik', 'Truffle Oil Périgord', 'Ayam Kampung Panggang', 'Telur Sous-Vide', 'Pangsit Emas', 'Kecap Asin Artisan'],
        dietary: ['Halal'],
        rating: 4.9,
        reviewCount: 142,
        preparationTime: '12-15 min',
        isPopular: true,
        pairingSuggestion: 'Artisan Royal Earl Grey Tea'
    },
    {
        id: 'm2',
        name: 'Bubur Ayam Confit de Volaille',
        category: 'bubur-signature',
        price: 78000,
        description: 'Kreasi unik memadukan tekstur lembut bubur tradisional dengan paha ayam confit gaya Prancis yang garing di luar dan juicy di dalam, ditaburi cakwe iris tipis dan kuah kaldu rempah kuning ala LW.',
        image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=800&auto=format&fit=crop',
        badge: 'Best Seller',
        ingredients: ['Ayam Confit Prancis', 'Kaldu Rempah Kuning', 'Cakwe Crispy', 'Daun Bawang Fresh', 'Minyak Wijen Artisan'],
        dietary: ['Halal'],
        rating: 4.8,
        reviewCount: 98,
        preparationTime: '15 min',
        isPopular: true,
        pairingSuggestion: 'European Espresso Tonic'
    },
    {
        id: 'm3',
        name: 'Bubur Ayam Foie Gras & Sate Artisan',
        category: 'bubur-signature',
        price: 125000,
        description: 'Pengalaman rasa paling mewah. Bubur gurih khas Kang LW disajikan bersama pan-seared Foie Gras impor, sate ati ampela karamelisasi bumbu kecap manis truffle, dan kerupuk udang panggang.',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop',
        badge: 'Mewah Classic',
        ingredients: ['Pan-Seared Foie Gras', 'Sate Ati Karamel', 'Kaldu Ayam Kampung 12 Jam', 'Emping Super'],
        dietary: ['Halal'],
        rating: 5.0,
        reviewCount: 64,
        preparationTime: '18 min',
        isPopular: true,
        pairingSuggestion: 'Château Sparkling Grape Juice'
    },
    {
        id: 'm4',
        name: 'Bubur Ayam Classic Kang LW (Versi Eropa)',
        category: 'bubur-signature',
        price: 48000,
        description: 'Resep asli legendaris Kang LW sejak 1998 yang ditingkatkan standar penyajiannya. Suwiran ayam kampung melimpah, kacang kedelai garing, kuah kuning harum, dan sambal hijau artisan.',
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
        badge: 'Resep Asli 1998',
        ingredients: ['Ayam Kampung Suwir', 'Kuah Yellow Broth', 'Kacang Kedelai', 'Sambal Hijau', 'Cakwe Halus'],
        dietary: ['Halal', 'Pedas Sedang'],
        rating: 4.9,
        reviewCount: 310,
        preparationTime: '8-10 min',
        isPopular: true,
        pairingSuggestion: 'Teh Poci Melati Pandan'
    },
    {
        id: 'm5',
        name: 'Croissant Chicken Confit Sandwich',
        category: 'bistro-mains',
        price: 68000,
        description: 'Butter croissant renyah khas toko roti Eropa diisi suwiran ayam confit bumbu bubur kuning, keju Gruyère leleh, baby spinach, dan mayo tarragon.',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800&auto=format&fit=crop',
        badge: 'Fusion Special',
        ingredients: ['French Butter Croissant', 'Gruyère Cheese', 'Ayam Confit', 'Baby Spinach', 'Tarragon Mayo'],
        dietary: ['Halal'],
        rating: 4.7,
        reviewCount: 52,
        preparationTime: '12 min',
        pairingSuggestion: 'Café au Lait LW'
    },
    {
        id: 'm6',
        name: 'Escargot à la Indonesian Garlic Herb',
        category: 'bistro-mains',
        price: 95000,
        description: 'Escargot khas Prancis dipanggang dengan mentega rempah Nusantara, bawang putih panggang, dan disajikan bersama roti baguette panggang mentega.',
        image: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?q=80&w=800&auto=format&fit=crop',
        badge: 'French Classic',
        ingredients: ['Escargot', 'Garlic Herb Butter', 'Toasted Baguette', 'Parsley'],
        dietary: ['Halal'],
        rating: 4.6,
        reviewCount: 41,
        preparationTime: '15 min',
        pairingSuggestion: 'Sparkling Lemon Water'
    },
    {
        id: 'm7',
        name: 'French Croissant Butter & Artisan Jams',
        category: 'pastry-bakery',
        price: 35000,
        description: 'Croissant mentega Prancis authentic panggang segar setiap pagi, disajikan dengan mentega Anchor dan selai srikaya buatan rumah.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
        badge: 'Fresh Baked Daily',
        ingredients: ['French Normandy Butter', 'Homemade Srikaya Jam', 'Flour'],
        dietary: ['Halal', 'Vegetarian'],
        rating: 4.9,
        reviewCount: 115,
        preparationTime: '5 min',
        pairingSuggestion: 'Cappuccino Double Shot'
    },
    {
        id: 'm8',
        name: 'Café au Lait LW (Kopi Susu Eropa)',
        category: 'artisan-drinks',
        price: 38000,
        description: 'Espresso racikan biji kopi Toraja & Robusta pilihan diseduh bersama susu segar hangat berkrim halus dan sedikit sentuhan sirup gula aren organik.',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop',
        badge: 'Coffee Special',
        ingredients: ['Toraja Arabica Beans', 'Fresh Milk', 'Organic Aren Syrup'],
        dietary: ['Halal', 'Vegetarian'],
        rating: 4.8,
        reviewCount: 204,
        preparationTime: '5 min',
        pairingSuggestion: 'Croissant Classic'
    },
    {
        id: 'm9',
        name: 'Royal Parisian Rose & Lavender Tea',
        category: 'artisan-drinks',
        price: 42000,
        description: 'Seduhan daun teh hitam Assam kualitas terbaik dicampur kelopak mawar Prancis dan lavender, menyegarkan dan menenangkan jiwa.',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop',
        badge: 'Artisan Tea',
        ingredients: ['Assam Black Tea', 'French Rose Petals', 'Dried Lavender', 'Honey'],
        dietary: ['Halal', 'Gluten-Free', 'Vegetarian'],
        rating: 4.9,
        reviewCount: 88,
        preparationTime: '5 min'
    },
    {
        id: 'm10',
        name: 'Pandan Soufflé Velvet & Vanilla Gelato',
        category: 'desserts',
        price: 55000,
        description: 'Soufflé mengembang sempurna berbahan pandan wangi alami, disajikan hangat dengan satu scoop gelato vanila Bourbon Prancis.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
        badge: 'Sweet Finale',
        ingredients: ['Natural Pandan Juice', 'French Bourbon Vanilla Gelato', 'Organic Eggs'],
        dietary: ['Halal', 'Vegetarian'],
        rating: 4.9,
        reviewCount: 76,
        preparationTime: '20 min'
    }
];

export const TESTIMONIALS: Testimonial[] = [
    {
        id: 't1',
        name: 'Anindya Saraswati',
        role: 'Food & Lifestyle Critic',
        comment: 'Perpaduan luar biasa! Bubur Ayam Truffle Royale di LW’s benar-benar menaikkan kelas bubur ayam menjadi hidangan gastronomi kelas dunia tanpa menghilangkan cita rasa kehangatan tradisionalnya.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        date: '18 Juli 2026'
    },
    {
        id: 't2',
        name: 'Chef Julian De' + 'sChamps',
        role: 'Executive Pastry Chef',
        comment: 'Ambiance eropa klasik dengan warna teal slate #4F6B6A dan emas champagne sangat elegan. Pelayanan reservasi meja sangat cepat dan terorganisir rapi.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        date: '12 Juli 2026'
    },
    {
        id: 't3',
        name: 'Bapak Hendra Gunawan',
        role: 'Pencinta Kuliner Nusantara',
        comment: 'Sudah langganan Bubur Ayam Kang LW dari jaman tenda, sekarang di LW’s Bistro rasanya makin mantap dan suasana tempatnya pas sekali untuk sarapan bisnis atau makan malam keluarga.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        date: '02 Juli 2026'
    }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
    {
        id: 'LW-2026-8812',
        customerName: 'Dian Sastrowardoyo',
        phone: '081298765432',
        email: 'dian.sastro@example.com',
        date: '2026-07-24',
        time: '19:00',
        guests: 4,
        seatingArea: 'Salon Utama Eropa',
        tableNumber: 'Table T-04',
        specialRequests: 'Meja dekat jendela dengan penerangan hangat untuk perayaan ulang tahun.',
        status: 'Terkonfirmasi',
        createdAt: '2026-07-22T10:30:00Z'
    },
    {
        id: 'LW-2026-4410',
        customerName: 'Bambang Soeprapto',
        phone: '081122334455',
        email: 'bambang.sp@example.com',
        date: '2026-07-24',
        time: '08:30',
        guests: 2,
        seatingArea: 'Teras Le Petit',
        tableNumber: 'Table P-02',
        specialRequests: 'Sarapan pagi outdoor santai.',
        status: 'Terkonfirmasi',
        createdAt: '2026-07-23T08:15:00Z'
    }
];

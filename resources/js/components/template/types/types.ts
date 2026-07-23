export interface MenuItem {
    id: string;
    name: string;
    category: 'bubur-signature' | 'bistro-mains' | 'pastry-bakery' | 'artisan-drinks' | 'desserts';
    price: number;
    description: string;
    image: string;
    badge?: string;
    ingredients: string[];
    dietary: ('Halal' | 'Gluten-Free' | 'Vegetarian' | 'Pedas Sedang')[];
    rating: number;
    reviewCount: number;
    preparationTime: string;
    isPopular?: boolean;
    pairingSuggestion?: string;
}

export interface Reservation {
    id: string; // Ref e.g. LW-2026-9481
    customerName: string;
    phone: string;
    email: string;
    date: string;
    time: string;
    guests: number;
    seatingArea: 'Salon Utama Eropa' | 'Teras Le Petit' | 'Ruang Private VIP Kang LW';
    tableNumber?: string;
    specialRequests?: string;
    status: 'Terkonfirmasi' | 'Menunggu' | 'Selesai' | 'Dibatalkan';
    createdAt: string;
}

export interface UserSession {
    isLoggedIn: boolean;
    user: {
        name: string;
        email: string;
        role: 'admin' | 'guest';
        avatar?: string;
    } | null;
}

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    comment: string;
    rating: number;
    avatar: string;
    date: string;
}

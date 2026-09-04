import type { MenuItem } from './menu';

export interface DishData {
  id: string;
  name: string;
  fullTitle: string;
  subtitle: string;
  label: string;
  description: string;
  price: number;
  calories: string;
  prepTime: string;
  highlightTags: string[];
  image: string;
  previousDishImage: string;
  copperRimClass: string;
  menuItemData: MenuItem;
}

const sayurBeningImg = '/img/menu/Kuning & Putih Minimalis Promosi Makanan Nasi Kuning Kiriman Instagram (1).png';
const buburAyamImg = '/img/menu/Kuning & Putih Minimalis Promosi Makanan Nasi Kuning Kiriman Instagram (2).png';
const nasiKuningImg = '/img/menu/Kuning & Putih Minimalis Promosi Makanan Nasi Kuning Kiriman Instagram.png';

export const HERO_DISHES: DishData[] = [
  {
    id: 'sayur-bening',
    name: 'Sayur Bening',
    fullTitle: 'Sayur Bening Segar',
    subtitle: 'Nutrisi Harian Penuh Vitamin',
    label: 'Sayur Bening',
    description:
      'Bayam organik segar petikan pagi berpadu manisnya bulir jagung pipil dan kelembutan labu kuning dalam kaldu rempah bening yang ringan, harum temu kunci, serta kaya vitamin untuk menyegarkan hari Anda.',
    price: 45000,
    calories: '185 kkal',
    prepTime: '10-15 Menit',
    highlightTags: ['100% Organik', 'Kaya Vitamin & Zat Besi', 'Bebas MSG', 'Vegan-Friendly'],
    image: sayurBeningImg,
    previousDishImage: nasiKuningImg,
    copperRimClass: 'border-[#C88A58] ring-[#8C5831]/50',
    menuItemData: {
      id: 'sayur-bening-segar',
      name: 'Sayur Bening Segar',
      frenchName: 'Bouillon Clair d’Épinards & Maïs',
      category: 'bistro-mains',
      price: 45000,
      description: 'Bayam segar organik, jagung manis pipil, dan labu kuning dalam kaldu bening menyegarkan.',
      image: sayurBeningImg,
      isChefSpecial: true,
      calories: '185 kkal',
      tags: ['Organik', 'Kaya Vitamin', 'Bebas MSG'],
    },
  },
  {
    id: 'bubur-ayam',
    name: 'Bubur Ayam',
    fullTitle: 'Bubur Ayam Gurih',
    subtitle: 'Pilihan Sarapan Hangat & Lezat',
    label: 'Bubur Ayam',
    description:
      'Bubur beras pandan wangi bertekstur selembut sutra dengan siraman kuah kuning kunyit rempah tradisional. Disajikan berlimpah dengan suwiran ayam kampung organik, kedelai renyah, dan taburan seledri segar.',
    price: 58000,
    calories: '340 kkal',
    prepTime: '8-12 Menit',
    highlightTags: ['Ayam Kampung Asli', 'Kaldu Kuning Tradisi', 'Pandan Wangi', 'Sarapan Favorit'],
    image: buburAyamImg,
    previousDishImage: sayurBeningImg,
    copperRimClass: 'border-[#C88A58] ring-[#8C5831]/50',
    menuItemData: {
      id: 'bubur-ayam-gurih',
      name: 'Bubur Ayam Gurih',
      frenchName: 'Velouté de Riz au Poulet Fermier',
      category: 'haute-porridge',
      price: 58000,
      description: 'Bubur beras pandan wangi dengan kuah kuning rempah, ayam kampung suwir, dan kedelai garing.',
      image: buburAyamImg,
      isChefSpecial: true,
      calories: '340 kkal',
      tags: ['Signature', 'Hangat Gurih', 'Warisan Rasa'],
    },
  },
  {
    id: 'nasi-kuning',
    name: 'Nasi Kuning',
    fullTitle: 'Nasi Kuning Nusantara',
    subtitle: 'Cita Rasa Kaya Rempah',
    label: 'Nasi Kuning',
    description:
      'Nasi kuning harum santan murni dan kunyit alami pegunungan, ditemani ayam goreng kremes renyah keemasan, bihun kampung bumbu gurih, tumisan buncis segar, serta lalapan tomat dan mentimun renyah.',
    price: 65000,
    calories: '495 kkal',
    prepTime: '12-18 Menit',
    highlightTags: ['Ayam Goreng Kremes', 'Bihun Gurih', 'Rempah Otentik', 'Porsi Lengkap'],
    image: nasiKuningImg,
    previousDishImage: buburAyamImg,
    copperRimClass: 'border-[#C88A58] ring-[#8C5831]/50',
    menuItemData: {
      id: 'nasi-kuning-nusantara',
      name: 'Nasi Kuning Nusantara',
      frenchName: 'Riz Jaune Parfumé & Poulet Croustillant',
      category: 'bistro-mains',
      price: 65000,
      description: 'Nasi kuning rempah santan dengan ayam goreng kremes, bihun, tumis sayur, dan lalapan segar.',
      image: nasiKuningImg,
      isChefSpecial: true,
      calories: '495 kkal',
      tags: ['Piring Lengkap', 'Kaya Rempah', 'Menu Favorit'],
    },
  },
];

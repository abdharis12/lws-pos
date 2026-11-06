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

const buburManadoImg = '/img/menu/Kuning & Putih Minimalis Promosi Makanan Nasi Kuning Kiriman Instagram (2).png';
const buburAyamImg = '/img/menu/Kuning & Putih Minimalis Promosi Makanan Nasi Kuning Kiriman Instagram (1).png';
const nasiKuningImg = '/img/menu/Kuning & Putih Minimalis Promosi Makanan Nasi Kuning Kiriman Instagram.png';

export const HERO_DISHES: DishData[] = [
  {
    id: 'bubur-manado',
    name: 'Bubur Manado',
    fullTitle: 'Bubur Manado',
    subtitle: 'Sajian Khas Kang LW yang Menggugah Selera',
    label: 'Bubur Manado',
    description:
      'Bubur sehat khas Kang LWs berisi sayuran segar, labu kuning, dan jagung manis. Dilengkapi dengan ikan cakalang asap suwir dan sambal roa pedas autentik.',
    price: 32000,
    calories: '185 kkal',
    prepTime: '10-15 Menit',
    highlightTags: ['100% Organik', 'Kaya Vitamin & Zat Besi', 'Rasa Khas', 'Hidangan Tradisional'],
    image: buburManadoImg,
    previousDishImage: nasiKuningImg,
    copperRimClass: 'border-[#C88A58] ring-[#8C5831]/50',
    menuItemData: {
      id: 'bubur-manado-lezat',
      name: 'Bubur Manado Lezat',
      frenchName: 'Bubur Manado Khas Kang LW',
      category: 'Makanan',
      price: 32000,
      description: 'Bubur sehat khas Kang LWs berisi sayuran segar, labu kuning, dan jagung manis. Dilengkapi dengan ikan cakalang asap suwir dan sambal roa pedas autentik..',
      image: buburManadoImg,
      isChefSpecial: true,
      calories: '185 kkal',
      tags: ['Rasa Khas', 'Hidangan Tradisional'],
    },
  },
  {
    id: 'bubur-ayam',
    name: 'Bubur Ayam',
    fullTitle: 'Bubur Ayam Spesial',
    subtitle: 'Pilihan Sarapan Hangat & Lezat',
    label: 'Bubur Ayam',
    description:
      'Bubur ayam bertekstur selembut sutra dengan siraman kuah kuning kunyit rempah tradisional. Disajikan berlimpah dengan suwiran ayam, dan taburan seledri segar.',
    price: 18000,
    calories: '340 kkal',
    prepTime: '8-12 Menit',
    highlightTags: ['Kaldu Kuning', 'Ayam Suwir', 'Sarapan Favorit'],
    image: buburAyamImg,
    previousDishImage: buburManadoImg,
    copperRimClass: 'border-[#C88A58] ring-[#8C5831]/50',
    menuItemData: {
      id: 'bubur-ayam-gurih',
      name: 'Bubur Ayam Gurih',
      frenchName: 'Bubur organik lembut disiram kuah rempah khas Kang LW dan ayam suwir plus telur.',
      category: 'Bubur',
      price: 18000,
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
      'Nasi kuning harum santan murni dan kunyit asli, ditemani ayam suwir dan ikan cakalang, bihun tumis, dan telur rebus.',
    price: 29000,
    calories: '495 kkal',
    prepTime: '12-18 Menit',
    highlightTags: ['Ayam Suwir', 'Bihun Tumis', 'Ikan Cakalang', 'Porsi Lengkap'],
    image: nasiKuningImg,
    previousDishImage: buburAyamImg,
    copperRimClass: 'border-[#C88A58] ring-[#8C5831]/50',
    menuItemData: {
      id: 'nasi-kuning-nusantara',
      name: 'Nasi Kuning Nusantara',
      frenchName: 'Nasi Kuning dengan Rasa Emas',
      category: 'Makanan',
      price: 29000,
      description: 'Nasi kuning rempah santan dengan ayam suwir dan ikan cakalang, bihun tumis, dan telur rebus.',
      image: nasiKuningImg,
      isChefSpecial: true,
      calories: '495 kkal',
      tags: ['Lauk Lengkap', 'Kaya Rempah', 'Menu Favorit'],
    },
  },
];

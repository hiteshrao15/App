// =====================================================
// Mobile API Client with Offline Resilience & Mock Data
// =====================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const configuredApiUrl = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL?.trim();
const API_BASE = configuredApiUrl || (
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1'
);

async function request(path: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    return await fetch(`${API_BASE}${path}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export interface StoreItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  isOpenToday: boolean;
  isDryDay: boolean;
  phone: string;
  licenseNumber: string;
  dealsCount: number;
}

export interface DealItem {
  id: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'BOGO';
  discountValue: number;
  minSpend: number;
  validUntil: string;
  category: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  storeDistanceKm: number;
  terms: string[];
}

export interface ClaimedVoucher {
  id: string;
  dealId: string;
  title: string;
  storeName: string;
  storeCity: string;
  tokenCode: string; // e.g. "BB-729104"
  discountLabel: string;
  claimedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
}

const MOCK_STORES: StoreItem[] = [
  {
    id: 's-101',
    name: 'Living Liquidz — Bandra West',
    address: 'Plot 42, Linking Road, Khar/Bandra',
    city: 'Mumbai',
    state: 'Maharashtra',
    rating: 4.8,
    reviewCount: 342,
    distanceKm: 1.2,
    isOpenToday: true,
    isDryDay: false,
    phone: '+91 98201 12345',
    licenseNumber: 'MH-EXC-2024-9841',
    dealsCount: 3,
  },
  {
    id: 's-102',
    name: 'Nature\'s Basket Spirits — Indiranagar',
    address: '100ft Road, 12th Main Junction',
    city: 'Bengaluru',
    state: 'Karnataka',
    rating: 4.7,
    reviewCount: 289,
    distanceKm: 2.8,
    isOpenToday: true,
    isDryDay: false,
    phone: '+91 98450 67890',
    licenseNumber: 'KA-EXC-2024-4112',
    dealsCount: 2,
  },
  {
    id: 's-103',
    name: 'Delhi Duty Free Boutique — Connaught Place',
    address: 'Block C, Radial Road 3',
    city: 'New Delhi',
    state: 'Delhi',
    rating: 4.9,
    reviewCount: 512,
    distanceKm: 3.5,
    isOpenToday: true,
    isDryDay: false,
    phone: '+91 99110 54321',
    licenseNumber: 'DL-EXC-2023-7721',
    dealsCount: 4,
  },
  {
    id: 's-104',
    name: 'Vaz Liquor Superstore — Panaji',
    address: 'Opp. Municipal Garden, 18th June Road',
    city: 'Panaji',
    state: 'Goa',
    rating: 4.6,
    reviewCount: 194,
    distanceKm: 0.8,
    isOpenToday: true,
    isDryDay: false,
    phone: '+91 98221 99887',
    licenseNumber: 'GA-EXC-2024-1189',
    dealsCount: 5,
  },
];

const MOCK_DEALS: DealItem[] = [
  {
    id: 'd-1',
    title: '15% Off Single Malt Whiskies',
    description: 'Instant discount on Glenfiddich, Talisker, Amrut, and Paul John bottles (750ml).',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minSpend: 4000,
    validUntil: 'Nov 30, 2026',
    category: 'Whiskey',
    storeId: 's-101',
    storeName: 'Living Liquidz — Bandra West',
    storeCity: 'Mumbai',
    storeDistanceKm: 1.2,
    terms: ['Valid for in-store physical billing only', 'Cannot be combined with state minimum pricing breaches', 'One voucher per billing transaction'],
  },
  {
    id: 'd-2',
    title: 'Flat ₹300 Off Artisanal Craft Gins',
    description: 'Flat savings on Greater Than, Stranger & Sons, Hapusa & Terai Gins.',
    discountType: 'FLAT',
    discountValue: 300,
    minSpend: 2500,
    validUntil: 'Nov 15, 2026',
    category: 'Gin',
    storeId: 's-101',
    storeName: 'Living Liquidz — Bandra West',
    storeCity: 'Mumbai',
    storeDistanceKm: 1.2,
    terms: ['Valid on 750ml bottles only', 'Show voucher barcode before invoice generation'],
  },
  {
    id: 'd-3',
    title: 'Buy 2 Get 1 Free on Microbrew Cans',
    description: 'Mix & match 500ml craft beer cans from Toit, Bira & Simba.',
    discountType: 'BOGO',
    discountValue: 100,
    minSpend: 600,
    validUntil: 'Dec 05, 2026',
    category: 'Beer',
    storeId: 's-102',
    storeName: 'Nature\'s Basket Spirits — Indiranagar',
    storeCity: 'Bengaluru',
    storeDistanceKm: 2.8,
    terms: ['Free can of equal or lesser value', 'Chilled stock subject to daily store availability'],
  },
  {
    id: 'd-4',
    title: '20% Off Festive Imported Wines',
    description: 'Celebration discount on Tuscan Chianti, Bordeaux Red & Prosecco.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minSpend: 3500,
    validUntil: 'Dec 31, 2026',
    category: 'Wine',
    storeId: 's-103',
    storeName: 'Delhi Duty Free Boutique — Connaught Place',
    storeCity: 'New Delhi',
    storeDistanceKm: 3.5,
    terms: ['Subject to Delhi excise rules', 'Customer must be 25+ years of age'],
  },
];

export const mobileApi = {
  async getStores(): Promise<StoreItem[]> {
    try {
      const res = await request('/stores');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return json.data.map((store: Record<string, unknown>) => ({
            id: String(store.id),
            name: String(store.name),
            address: String(store.address_line1 || 'Address unavailable'),
            city: String(store.city),
            state: String(store.state || store.state_name || ''),
            rating: Number(store.rating || 0),
            reviewCount: Number(store.review_count || 0),
            distanceKm: Number(store.distance_km || 0),
            isOpenToday: true,
            isDryDay: false,
            phone: String(store.phone || ''),
            licenseNumber: String(store.license_number || 'Verification pending'),
            dealsCount: Number(store.active_offers || 0),
          }));
        }
      }
    } catch (_error) {}
    return MOCK_STORES;
  },

  async getDeals(): Promise<DealItem[]> {
    try {
      const res = await request('/offers');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return json.data.map((offer: Record<string, unknown>) => ({
            id: String(offer.id),
            title: String(offer.title),
            description: String(offer.description || ''),
            discountType: offer.offer_type === 'percentage_discount'
              ? 'PERCENTAGE'
              : offer.offer_type === 'fixed_price' ? 'FLAT' : 'BOGO',
            discountValue: Number(offer.discount_percent || offer.offer_price_paise || 0),
            minSpend: Number(offer.min_purchase_paise || 0) / 100,
            validUntil: String(offer.valid_until),
            category: String(offer.category_name || 'Offers'),
            storeId: String(offer.store_id),
            storeName: String(offer.store_name),
            storeCity: String(offer.store_city),
            storeDistanceKm: 0,
            terms: offer.custom_terms ? [String(offer.custom_terms)] : [],
          }));
        }
      }
    } catch (_error) {}
    return MOCK_DEALS;
  },

  async getClaimedVouchers(): Promise<ClaimedVoucher[]> {
    try {
      const saved = await AsyncStorage.getItem('@bottlebazaar_vouchers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Default sample active voucher
    const initial: ClaimedVoucher[] = [
      {
        id: 'vouch-901',
        dealId: 'd-1',
        title: '15% Off Single Malt Whiskies',
        storeName: 'Living Liquidz — Bandra West',
        storeCity: 'Mumbai',
        tokenCode: 'BB-948123',
        discountLabel: '15% OFF',
        claimedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
        status: 'ACTIVE',
      },
    ];
    await AsyncStorage.setItem('@bottlebazaar_vouchers', JSON.stringify(initial));
    return initial;
  },

  async claimDeal(deal: DealItem): Promise<ClaimedVoucher> {
    const randomCode = `BB-${Math.floor(100000 + Math.random() * 900000)}`;
    const newVoucher: ClaimedVoucher = {
      id: `vouch-${Date.now()}`,
      dealId: deal.id,
      title: deal.title,
      storeName: deal.storeName,
      storeCity: deal.storeCity,
      tokenCode: randomCode,
      discountLabel: deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF` : 
                     deal.discountType === 'FLAT' ? `₹${deal.discountValue} OFF` : 'BUY 2 GET 1',
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
    };

    const current = await this.getClaimedVouchers();
    const updated = [newVoucher, ...current];
    await AsyncStorage.setItem('@bottlebazaar_vouchers', JSON.stringify(updated));
    return newVoucher;
  },
};

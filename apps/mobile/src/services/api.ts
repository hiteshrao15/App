import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const configuredApiUrl = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL?.trim();
const API_BASE = (configuredApiUrl || (
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1'
)).replace(/\/+$/, '');
const TOKEN_KEY = '@bottlebazaar_access_token';
const VOUCHER_TOKEN_KEY = '@bottlebazaar_voucher_tokens';

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
  tokenCode: string;
  discountLabel: string;
  claimedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
}

export interface ApiUser {
  id: string;
  phone: string;
  displayName?: string;
  language?: 'en' | 'hi';
  ageDeclared: boolean;
  ageDeclaredAt?: string;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(response.status, typeof body.error === 'string' ? body.error : 'The service is unavailable.');
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

const mapStore = (store: Record<string, unknown>): StoreItem => ({
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
});

const mapOffer = (offer: Record<string, unknown>): DealItem => ({
  id: String(offer.id),
  title: String(offer.title),
  description: String(offer.description || ''),
  discountType: offer.offer_type === 'percentage_discount'
    ? 'PERCENTAGE'
    : offer.offer_type === 'fixed_price' ? 'FLAT' : 'BOGO',
  discountValue: Number(offer.discount_percent || offer.offer_price_paise || 0) / (offer.offer_type === 'fixed_price' ? 100 : 1),
  minSpend: Number(offer.min_purchase_paise || 0) / 100,
  validUntil: String(offer.valid_until),
  category: String(offer.category_name || 'Offers'),
  storeId: String(offer.store_id),
  storeName: String(offer.store_name),
  storeCity: String(offer.store_city),
  storeDistanceKm: 0,
  terms: offer.custom_terms ? [String(offer.custom_terms)] : [],
});

export const mobileApi = {
  async requestOtp(phone: string): Promise<void> {
    await request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: phone.replace(/\s+/g, ''), countryCode: '+91' }),
    });
  },

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: ApiUser }> {
    const body = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: phone.replace(/\s+/g, ''), otp }),
    }) as { token: string; user: Record<string, unknown> };
    await AsyncStorage.setItem(TOKEN_KEY, body.token);
    const user = await this.getProfile();
    return { token: body.token, user };
  },

  async getProfile(): Promise<ApiUser> {
    const body = await request('/users/me') as Record<string, unknown>;
    return {
      id: String(body.id),
      phone: String(body.phone),
      displayName: body.display_name ? String(body.display_name) : undefined,
      language: body.language === 'hi' ? 'hi' : 'en',
      ageDeclared: Boolean(body.age_declared),
      ageDeclaredAt: body.age_declared_at ? String(body.age_declared_at) : undefined,
    };
  },

  async declareAge(): Promise<void> {
    await request('/users/me/declare-age', {
      method: 'POST',
      body: JSON.stringify({ confirmed: true }),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  async getStores(city?: string): Promise<StoreItem[]> {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    const body = await request(`/stores${query}`) as { data?: Record<string, unknown>[] };
    return (body.data || []).map(mapStore);
  },

  async getDeals(city?: string): Promise<DealItem[]> {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    const body = await request(`/offers${query}`) as { data?: Record<string, unknown>[] };
    return (body.data || []).map(mapOffer);
  },

  async getClaimedVouchers(): Promise<ClaimedVoucher[]> {
    const body = await request('/redemptions/history') as { data?: Record<string, unknown>[] };
    const savedTokens = JSON.parse(await AsyncStorage.getItem(VOUCHER_TOKEN_KEY) || '{}') as Record<string, string>;
    return (body.data || []).map((voucher) => ({
      id: String(voucher.id),
      dealId: String(voucher.offer_id),
      title: String(voucher.title),
      storeName: String(voucher.store_name),
      storeCity: String(voucher.store_city || ''),
      tokenCode: savedTokens[String(voucher.offer_id)] || 'Open this voucher on the device used to claim it',
      discountLabel: String(voucher.offer_type || 'Offer'),
      claimedAt: String(voucher.issued_at),
      expiresAt: String(voucher.expires_at),
      status: voucher.status === 'redeemed' ? 'REDEEMED' : voucher.status === 'expired' ? 'EXPIRED' : 'ACTIVE',
    }));
  },

  async claimDeal(deal: DealItem): Promise<ClaimedVoucher> {
    const body = await request('/redemptions/issue', {
      method: 'POST',
      body: JSON.stringify({ offerId: deal.id, storeId: deal.storeId }),
    }) as { token: string; expiresIn: number };
    const voucher = {
      id: `${deal.id}-${Date.now()}`,
      dealId: deal.id,
      title: deal.title,
      storeName: deal.storeName,
      storeCity: deal.storeCity,
      tokenCode: body.token,
      discountLabel: deal.discountType === 'PERCENTAGE' ? `${deal.discountValue}% OFF`
        : deal.discountType === 'FLAT' ? `₹${deal.discountValue} OFF` : 'BUY 2 GET 1',
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + body.expiresIn * 1000).toISOString(),
      status: 'ACTIVE',
    } as ClaimedVoucher;
    const savedTokens = JSON.parse(await AsyncStorage.getItem(VOUCHER_TOKEN_KEY) || '{}') as Record<string, string>;
    savedTokens[deal.id] = body.token;
    await AsyncStorage.setItem(VOUCHER_TOKEN_KEY, JSON.stringify(savedTokens));
    return voucher;
  },
};

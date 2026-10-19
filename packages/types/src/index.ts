// =====================================================
// BottleBazaar Shared TypeScript Types
// =====================================================

export type UserRole = 'USER' | 'STORE_OWNER' | 'ADMIN';

export type IndianState = 
  | 'Maharashtra'
  | 'Delhi'
  | 'Karnataka'
  | 'Goa'
  | 'Tamil Nadu'
  | 'Haryana'
  | 'Uttar Pradesh'
  | 'Telangana'
  | 'West Bengal'
  | 'Rajasthan'
  | 'Punjab'
  | 'Kerala';

export interface User {
  id: string;
  phoneNumber: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  ageDeclared: boolean;
  ageDeclarationDate?: string;
  state?: IndianState;
  city?: string;
  favoriteStoreIds?: string[];
  favoriteProductIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  ownerId?: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: IndianState;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  openingTime: string; // e.g. "10:00"
  closingTime: string; // e.g. "22:30"
  isOpenToday: boolean;
  isDryDay: boolean;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  verified: boolean;
  createdAt: string;
}

export type DiscountType = 'PERCENTAGE' | 'FLAT' | 'BOGO' | 'COMBO';

export interface Offer {
  id: string;
  storeId: string;
  storeName?: string;
  storeCity?: string;
  storeState?: string;
  storeDistanceKm?: number;
  productId?: string;
  productName?: string;
  productCategory?: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // e.g., 15 for 15%, or 200 for ₹200 off
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  termsAndConditions: string[];
  validFrom: string;
  validUntil: string;
  active: boolean;
  isFeatured?: boolean;
  redemptionCount: number;
  maxRedemptionsPerUser?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string; // Whiskey, Rum, Beer, Vodka, Gin, Wine, Tequila, Mixers
  subCategory?: string; // Single Malt, Blended, IPA, Stout, etc.
  abv: number; // e.g. 42.8
  volumeMl: number; // e.g. 750
  mrp: number; // State-regulated Maximum Retail Price
  description?: string;
  tastingNotes?: string[];
  originCountry?: string;
  imageUrl?: string;
  isPopular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export type RedemptionStatus = 'CLAIMED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface Redemption {
  id: string;
  userId: string;
  offerId: string;
  storeId: string;
  offerTitle: string;
  discountSummary: string;
  tokenCode: string; // alphanumeric coupon code e.g. "BB-938214"
  qrPayload: string; // signed verification payload
  status: RedemptionStatus;
  claimedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  billAmount?: number;
  discountAmount?: number;
}

export interface DryDay {
  id: string;
  state: IndianState | 'ALL';
  date: string; // YYYY-MM-DD
  occasion: string; // e.g. "Republic Day", "Mahatma Gandhi Jayanti"
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

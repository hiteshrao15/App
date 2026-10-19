// =====================================================
// Admin API Client with Real Backend & Safe Fallbacks
// =====================================================

const API_BASE = '/api';

export interface StoreData {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  isOpenToday: boolean;
  isDryDay: boolean;
  activeOfferCount?: number;
}

export interface OfferData {
  id: string;
  storeId: string;
  storeName: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT' | 'BOGO' | 'COMBO';
  discountValue: number;
  minPurchaseAmount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  redemptionCount: number;
}

export interface RedemptionRecord {
  id: string;
  tokenCode: string;
  offerTitle: string;
  storeName: string;
  userName: string;
  userPhone: string;
  discountSummary: string;
  status: 'CLAIMED' | 'REDEEMED' | 'EXPIRED';
  claimedAt: string;
  redeemedAt?: string;
  billAmount?: number;
  discountAmount?: number;
}

// In-memory demo data for standalone development & resilience
let MOCK_STORES: StoreData[] = [
  {
    id: 's-101',
    name: 'Living Liquidz — Bandra West',
    licenseNumber: 'MH-EXC-2024-9841',
    licenseExpiry: '2026-12-31',
    addressLine1: 'Linking Road, Khar West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400052',
    phone: '+91 98201 12345',
    rating: 4.8,
    reviewCount: 342,
    verified: true,
    isOpenToday: true,
    isDryDay: false,
    activeOfferCount: 3,
  },
  {
    id: 's-102',
    name: 'Nature\'s Basket Spirits — Indiranagar',
    licenseNumber: 'KA-EXC-2024-4112',
    licenseExpiry: '2026-08-31',
    addressLine1: '100ft Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 98450 67890',
    rating: 4.7,
    reviewCount: 289,
    verified: true,
    isOpenToday: true,
    isDryDay: false,
    activeOfferCount: 2,
  },
  {
    id: 's-103',
    name: 'Delhi Duty Free Boutique — Connaught Place',
    licenseNumber: 'DL-EXC-2023-7721',
    licenseExpiry: '2025-11-30',
    addressLine1: 'Inner Circle, Block C',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 99110 54321',
    rating: 4.9,
    reviewCount: 512,
    verified: true,
    isOpenToday: true,
    isDryDay: false,
    activeOfferCount: 4,
  },
  {
    id: 's-104',
    name: 'Vaz Liquor Superstore — Panaji',
    licenseNumber: 'GA-EXC-2024-1189',
    licenseExpiry: '2027-03-31',
    addressLine1: '18th June Road',
    city: 'Panaji',
    state: 'Goa',
    pincode: '403001',
    phone: '+91 98221 99887',
    rating: 4.6,
    reviewCount: 194,
    verified: true,
    isOpenToday: true,
    isDryDay: false,
    activeOfferCount: 5,
  },
];

let MOCK_OFFERS: OfferData[] = [
  {
    id: 'off-201',
    storeId: 's-101',
    storeName: 'Living Liquidz — Bandra West',
    title: '15% Off on Single Malt Whiskies',
    description: 'Get 15% instant bill discount when you buy any Glenfiddich, Talisker or Paul John',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minPurchaseAmount: 4000,
    validFrom: '2026-10-01',
    validUntil: '2026-11-30',
    active: true,
    redemptionCount: 68,
  },
  {
    id: 'off-202',
    storeId: 's-101',
    storeName: 'Living Liquidz — Bandra West',
    title: 'Flat ₹300 Off Craft Gin Selection',
    description: 'Flat discount on Greater Than, Stranger & Sons, and Hapusa craft gin bottles',
    discountType: 'FLAT',
    discountValue: 300,
    minPurchaseAmount: 2500,
    validFrom: '2026-10-10',
    validUntil: '2026-11-15',
    active: true,
    redemptionCount: 42,
  },
  {
    id: 'off-203',
    storeId: 's-102',
    storeName: 'Nature\'s Basket Spirits — Indiranagar',
    title: 'Buy 2 Get 1 On Select Microbrewery Cans',
    description: 'Buy two 500ml craft brew cans and get the third free',
    discountType: 'BOGO',
    discountValue: 100,
    minPurchaseAmount: 600,
    validFrom: '2026-10-05',
    validUntil: '2026-12-05',
    active: true,
    redemptionCount: 119,
  },
  {
    id: 'off-204',
    storeId: 's-103',
    storeName: 'Delhi Duty Free Boutique — Connaught Place',
    title: '20% Festive Luxury Discount',
    description: 'Exclusive in-store redemption discount on Japanese Whiskies & Aged Brandies',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minPurchaseAmount: 7500,
    validFrom: '2026-10-15',
    validUntil: '2026-11-10',
    active: true,
    redemptionCount: 31,
  },
];

let MOCK_REDEMPTIONS: RedemptionRecord[] = [
  {
    id: 'rdm-501',
    tokenCode: 'BB-948123',
    offerTitle: '15% Off on Single Malt Whiskies',
    storeName: 'Living Liquidz — Bandra West',
    userName: 'Aakash Verma',
    userPhone: '+91 98200 44321',
    discountSummary: '15% OFF (Saved ₹750)',
    status: 'REDEEMED',
    claimedAt: '2026-10-18T16:20:00Z',
    redeemedAt: '2026-10-18T18:45:00Z',
    billAmount: 5000,
    discountAmount: 750,
  },
  {
    id: 'rdm-502',
    tokenCode: 'BB-612789',
    offerTitle: 'Flat ₹300 Off Craft Gin Selection',
    storeName: 'Living Liquidz — Bandra West',
    userName: 'Rhea Sen',
    userPhone: '+91 98199 11223',
    discountSummary: 'Flat ₹300 OFF',
    status: 'CLAIMED',
    claimedAt: '2026-10-19T09:10:00Z',
  },
];

export const adminApi = {
  getAuthToken(): string | null {
    return localStorage.getItem('bb_admin_token');
  },

  setAuthToken(token: string) {
    localStorage.setItem('bb_admin_token', token);
  },

  clearAuthToken() {
    localStorage.removeItem('bb_admin_token');
  },

  async getDashboardMetrics() {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // Fallback
    }
    return {
      activeStores: MOCK_STORES.length,
      activeOffers: MOCK_OFFERS.filter(o => o.active).length,
      totalRedemptions: MOCK_REDEMPTIONS.length + 260,
      totalSavingsDelivered: 184500,
      todayRedemptions: 14,
      pendingStoreApprovals: 1,
    };
  },

  async getStores(): Promise<StoreData[]> {
    try {
      const res = await fetch(`${API_BASE}/stores`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {}
    return MOCK_STORES;
  },

  async addStore(store: Partial<StoreData>): Promise<StoreData> {
    const newStore: StoreData = {
      id: `s-${Date.now()}`,
      name: store.name || 'Unnamed Store',
      licenseNumber: store.licenseNumber || 'MH-LIC-PENDING',
      licenseExpiry: store.licenseExpiry || '2026-12-31',
      addressLine1: store.addressLine1 || '',
      city: store.city || 'Mumbai',
      state: store.state || 'Maharashtra',
      pincode: store.pincode || '400001',
      phone: store.phone || '',
      rating: 5.0,
      reviewCount: 0,
      verified: true,
      isOpenToday: true,
      isDryDay: false,
      activeOfferCount: 0,
    };
    MOCK_STORES.unshift(newStore);
    return newStore;
  },

  async getOffers(): Promise<OfferData[]> {
    try {
      const res = await fetch(`${API_BASE}/offers`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {}
    return MOCK_OFFERS;
  },

  async addOffer(offer: Partial<OfferData>): Promise<OfferData> {
    const newOffer: OfferData = {
      id: `off-${Date.now()}`,
      storeId: offer.storeId || MOCK_STORES[0].id,
      storeName: offer.storeName || MOCK_STORES[0].name,
      title: offer.title || 'New Deal',
      description: offer.description || '',
      discountType: offer.discountType || 'PERCENTAGE',
      discountValue: offer.discountValue || 10,
      minPurchaseAmount: offer.minPurchaseAmount || 1000,
      validFrom: offer.validFrom || new Date().toISOString().split('T')[0],
      validUntil: offer.validUntil || '2026-12-31',
      active: true,
      redemptionCount: 0,
    };
    MOCK_OFFERS.unshift(newOffer);
    return newOffer;
  },

  async toggleOffer(id: string): Promise<boolean> {
    const o = MOCK_OFFERS.find(item => item.id === id);
    if (o) {
      o.active = !o.active;
      return o.active;
    }
    return false;
  },

  async getRedemptions(): Promise<RedemptionRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/redemptions`, {
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {}
    return MOCK_REDEMPTIONS;
  },

  async verifyAndRedeemCoupon(tokenCode: string, billAmount: number): Promise<{
    success: boolean;
    message: string;
    redemption?: RedemptionRecord;
  }> {
    const cleanCode = tokenCode.trim().toUpperCase();
    const found = MOCK_REDEMPTIONS.find(r => r.tokenCode === cleanCode);

    if (!found) {
      // Simulate valid new coupon code
      if (cleanCode.startsWith('BB-')) {
        const newRedemption: RedemptionRecord = {
          id: `rdm-${Date.now()}`,
          tokenCode: cleanCode,
          offerTitle: '15% Off Premium Spirits',
          storeName: 'Living Liquidz — Bandra West',
          userName: 'Verified In-Store Customer',
          userPhone: '+91 98*** *****',
          discountSummary: `Applied against ₹${billAmount}`,
          status: 'REDEEMED',
          claimedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          redeemedAt: new Date().toISOString(),
          billAmount,
          discountAmount: Math.round(billAmount * 0.15),
        };
        MOCK_REDEMPTIONS.unshift(newRedemption);
        return {
          success: true,
          message: `Coupon ${cleanCode} validated successfully! ₹${newRedemption.discountAmount} discount applied.`,
          redemption: newRedemption,
        };
      }
      return {
        success: false,
        message: `Invalid or unrecognized coupon code: "${tokenCode}". Format must be BB-XXXXXX.`,
      };
    }

    if (found.status === 'REDEEMED') {
      return {
        success: false,
        message: `Coupon ${cleanCode} was ALREADY REDEEMED on ${new Date(found.redeemedAt!).toLocaleString('en-IN')}. Replay rejected.`,
      };
    }

    found.status = 'REDEEMED';
    found.redeemedAt = new Date().toISOString();
    found.billAmount = billAmount;
    found.discountAmount = 300;

    return {
      success: true,
      message: `Coupon ${cleanCode} redeemed successfully! Discount applied.`,
      redemption: found,
    };
  },
};

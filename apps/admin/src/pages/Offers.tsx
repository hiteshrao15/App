import React, { useEffect, useState } from 'react';
import { Plus, Tag, Calendar, Store, Percent, Power, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi, OfferData, StoreData } from '../services/api';
import { Modal } from '../components/Modal';

export const Offers: React.FC = () => {
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newOffer, setNewOffer] = useState<Partial<OfferData>>({
    title: '',
    description: '',
    storeId: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minPurchaseAmount: 2000,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '2026-12-31',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [offList, storeList] = await Promise.all([
      adminApi.getOffers(),
      adminApi.getStores(),
    ]);
    setOffers(offList);
    setStores(storeList);
    if (storeList.length > 0 && !newOffer.storeId) {
      setNewOffer(prev => ({ ...prev, storeId: storeList[0].id, storeName: storeList[0].name }));
    }
  };

  const handleToggle = async (id: string) => {
    await adminApi.toggleOffer(id);
    await loadData();
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffer.title || !newOffer.discountValue) return;

    const matchedStore = stores.find(s => s.id === newOffer.storeId);
    await adminApi.addOffer({
      ...newOffer,
      storeName: matchedStore?.name || 'Authorized Store',
    });

    setIsAddModalOpen(false);
    setNewOffer({
      title: '',
      description: '',
      storeId: stores[0]?.id || '',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minPurchaseAmount: 2000,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '2026-12-31',
    });
    await loadData();
  };

  const filteredOffers = offers.filter(o => {
    if (filterType === 'ALL') return true;
    return o.discountType === filterType;
  });

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['ALL', 'PERCENTAGE', 'FLAT', 'BOGO'].map((type) => (
            <button
              key={type}
              className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'ALL' ? 'All Offers' : type}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Launch New Discount Offer</span>
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredOffers.map((o) => (
          <div key={o.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className={`badge ${
                  o.discountType === 'PERCENTAGE' ? 'badge-gold' : 
                  o.discountType === 'BOGO' ? 'badge-info' : 'badge-success'
                }`}>
                  <Tag size={12} />
                  {o.discountType === 'PERCENTAGE' ? `${o.discountValue}% OFF` : 
                   o.discountType === 'FLAT' ? `₹${o.discountValue} OFF` : 'BUY 1 GET 1'}
                </span>

                <span className={`badge ${o.active ? 'badge-success' : 'badge-danger'}`}>
                  {o.active ? 'Active' : 'Paused'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: '#fff' }}>
                {o.title}
              </h3>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '40px' }}>
                {o.description}
              </p>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                  <Store size={14} color="var(--accent-gold)" />
                  <span style={{ fontWeight: 600 }}>{o.storeName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  <span>Valid: {o.validFrom} to {o.validUntil}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Min Bill: <span style={{ color: 'var(--text-primary)' }}>₹{o.minPurchaseAmount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{o.redemptionCount}</span> redemptions
              </div>

              <button 
                className={`btn btn-sm ${o.active ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => handleToggle(o.id)}
              >
                <Power size={14} />
                <span>{o.active ? 'Pause Deal' : 'Activate'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Offer Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Create New In-Store Offer"
      >
        <form onSubmit={handleCreateOffer}>
          <div className="form-group">
            <label className="form-label">Offer Headline *</label>
            <input 
              type="text" 
              className="input" 
              required
              placeholder="e.g. 20% Off on Premium Single Malts"
              value={newOffer.title}
              onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Description & Terms</label>
            <textarea 
              className="textarea" 
              rows={3}
              placeholder="Explain discount criteria, qualifying brands, and any bottle size conditions..."
              value={newOffer.description}
              onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Participating Store *</label>
              <select 
                className="select"
                value={newOffer.storeId}
                onChange={(e) => setNewOffer({ ...newOffer, storeId: e.target.value })}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Discount Type *</label>
              <select 
                className="select"
                value={newOffer.discountType}
                onChange={(e) => setNewOffer({ ...newOffer, discountType: e.target.value as any })}
              >
                <option value="PERCENTAGE">Percentage (%) Off</option>
                <option value="FLAT">Flat Rupee (₹) Off</option>
                <option value="BOGO">Buy One Get One (BOGO)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                {newOffer.discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
              </label>
              <input 
                type="number" 
                className="input" 
                required
                min={1}
                value={newOffer.discountValue}
                onChange={(e) => setNewOffer({ ...newOffer, discountValue: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Purchase Bill (₹) *</label>
              <input 
                type="number" 
                className="input" 
                required
                min={0}
                value={newOffer.minPurchaseAmount}
                onChange={(e) => setNewOffer({ ...newOffer, minPurchaseAmount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input 
                type="date" 
                className="input" 
                required
                value={newOffer.validFrom}
                onChange={(e) => setNewOffer({ ...newOffer, validFrom: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input 
                type="date" 
                className="input" 
                required
                value={newOffer.validUntil}
                onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Publish Offer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

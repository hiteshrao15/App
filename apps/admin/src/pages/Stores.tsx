import React, { useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck, MapPin, Phone, Calendar, AlertCircle } from 'lucide-react';
import { adminApi, StoreData } from '../services/api';
import { Modal } from '../components/Modal';

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New store form state
  const [newStore, setNewStore] = useState<Partial<StoreData>>({
    name: '',
    licenseNumber: '',
    licenseExpiry: '',
    addressLine1: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    phone: '',
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const list = await adminApi.getStores();
    setStores(list);
  };

  const filteredStores = stores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'ALL' || s.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.name || !newStore.licenseNumber) return;

    await adminApi.addStore(newStore);
    setIsAddModalOpen(false);
    setNewStore({
      name: '',
      licenseNumber: '',
      licenseExpiry: '',
      addressLine1: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '',
      phone: '',
    });
    await loadStores();
  };

  return (
    <div>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              style={{ paddingLeft: '2.5rem' }} 
              placeholder="Search by store name, license number, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="select" 
            style={{ width: '180px' }}
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="ALL">All States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Goa">Goa</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Register New Store</span>
        </button>
      </div>

      {/* Stores Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Store Details</th>
                <th>Excise License</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Offers</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--accent-gold)' }}>★ {s.rating}</span> ({s.reviewCount} reviews)
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--accent-gold)' }}>
                      {s.licenseNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Expires: {s.licenseExpiry}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      <span>{s.city}, {s.state}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.addressLine1}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      <span>{s.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gold">
                      {s.activeOfferCount || 2} Active Deals
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <ShieldCheck size={12} />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Store Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Register Licensed Liquor Retailer"
      >
        <form onSubmit={handleCreateStore}>
          <div className="form-group">
            <label className="form-label">Store Trading Name *</label>
            <input 
              type="text" 
              className="input" 
              required
              placeholder="e.g. Royal Wine Mart"
              value={newStore.name}
              onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Excise License Number *</label>
              <input 
                type="text" 
                className="input" 
                required
                placeholder="e.g. MH-EXC-2026-0099"
                value={newStore.licenseNumber}
                onChange={(e) => setNewStore({ ...newStore, licenseNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">License Expiry Date *</label>
              <input 
                type="date" 
                className="input" 
                required
                value={newStore.licenseExpiry}
                onChange={(e) => setNewStore({ ...newStore, licenseExpiry: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input 
              type="text" 
              className="input" 
              required
              placeholder="e.g. Shop 4, Galleria Mall, Powai"
              value={newStore.addressLine1}
              onChange={(e) => setNewStore({ ...newStore, addressLine1: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">State *</label>
              <select 
                className="select"
                value={newStore.state}
                onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Goa">Goa</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input 
                type="text" 
                className="input" 
                required
                placeholder="Mumbai"
                value={newStore.city}
                onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <input 
                type="text" 
                className="input" 
                required
                placeholder="400076"
                value={newStore.pincode}
                onChange={(e) => setNewStore({ ...newStore, pincode: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Contact Phone *</label>
            <input 
              type="tel" 
              className="input" 
              required
              placeholder="+91 98200 00000"
              value={newStore.phone}
              onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Verify & Register Store
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  Store, 
  Tag, 
  QrCode, 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { adminApi, StoreData, OfferData, RedemptionRecord } from '../services/api';
import { NavTab } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any>({
    activeStores: 4,
    activeOffers: 12,
    totalRedemptions: 274,
    totalSavingsDelivered: 184500,
  });
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionRecord[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const m = await adminApi.getDashboardMetrics();
    const r = await adminApi.getRedemptions();
    const s = await adminApi.getStores();
    setMetrics(m);
    setRecentRedemptions(r.slice(0, 5));
    setStores(s);
  };

  return (
    <div className="dashboard-page">
      {/* Metrics Row */}
      <div className="stats-grid">
        <StatCard 
          label="Active Licensed Stores" 
          value={metrics.activeStores} 
          change="100% Excise Verified" 
          isPositive={true} 
          icon={Store} 
        />
        <StatCard 
          label="Live In-Store Offers" 
          value={metrics.activeOffers} 
          change="+4 this week" 
          isPositive={true} 
          icon={Tag} 
        />
        <StatCard 
          label="Total Redemptions" 
          value={metrics.totalRedemptions} 
          change="+18.4% MoM" 
          isPositive={true} 
          icon={QrCode} 
        />
        <StatCard 
          label="Customer Savings" 
          value={`₹${(metrics.totalSavingsDelivered || 184500).toLocaleString('en-IN')}`} 
          change="Average ₹350/bill" 
          isPositive={true} 
          icon={IndianRupee} 
        />
      </div>

      {/* Main Grid: Live Action & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Left Column: Quick In-Store Validator & Redemptions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Scanner Action Card */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(30, 34, 46, 0.8) 0%, rgba(22, 25, 34, 0.9) 100%)',
            border: '1px solid var(--border-accent)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Instant In-Store Coupon Validator</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Cashier desk tool: scan customer QR or type the 6-digit redemption code
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => onNavigate('redemptions')}
              >
                <QrCode size={16} />
                <span>Open Terminal</span>
              </button>
            </div>
          </div>

          {/* Recent Redemptions Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Customer Redemptions</h3>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('redemptions')}
              >
                View All
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Customer</th>
                    <th>Offer Title</th>
                    <th>Store</th>
                    <th>Discount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRedemptions.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-gold)' }}>
                        {r.tokenCode}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.userName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.userPhone}</div>
                      </td>
                      <td>{r.offerTitle}</td>
                      <td>{r.storeName}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{r.discountSummary}</td>
                      <td>
                        <span className={`badge ${r.status === 'REDEEMED' ? 'badge-success' : 'badge-warning'}`}>
                          {r.status === 'REDEEMED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: State Coverage & Compliance Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Compliance Card */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="var(--success)" />
              Regulatory Compliance
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Age Gate Enforced:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active (21+ / 25+)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>In-Store Only Redemption:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Enforced (No Delivery)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dry Days Shield:</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Auto-Lock Enabled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Excise License Validity:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>100% Current</span>
              </div>
            </div>
          </div>

          {/* Regional Hubs Card */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--accent-gold)" />
              Licensed Network Hubs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { state: 'Maharashtra', count: '48 Stores', cities: 'Mumbai, Pune' },
                { state: 'Karnataka', count: '36 Stores', cities: 'Bengaluru' },
                { state: 'Delhi NCR', count: '29 Stores', cities: 'New Delhi, Gurugram' },
                { state: 'Goa', count: '22 Stores', cities: 'Panaji, Candolim' },
                { state: 'Tamil Nadu', count: '14 Stores', cities: 'Chennai' },
              ].map((hub, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{hub.state}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hub.cities}</div>
                  </div>
                  <span className="badge badge-gold">{hub.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

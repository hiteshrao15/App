import React, { useState } from 'react';
import { Shield, Lock, Bell, Smartphone, Save, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    defaultTokenValidityMinutes: 30,
    maxDailyRedemptionsPerUser: 5,
    enforceStateAgeGate: true,
    enableMockOtpForTesting: true,
    requireCashierPinForOverride: true,
    responsibleDrinkingHelpline: '1800-11-0031 (Toll-Free)',
    fssaiLicenseNumber: '10019022009871',
    exciseComplianceMode: 'STRICT',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <form onSubmit={handleSave}>
        {/* Compliance & Age Gate */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-gold)" />
            Legal Drinking Age (LDA) & Excise Safeguards
          </h3>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enforce State-Specific Legal Drinking Age</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Automatically requires 25+ for Delhi/Maharashtra, 21+ for Goa/Karnataka
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={config.enforceStateAgeGate}
              onChange={(e) => setConfig({ ...config, enforceStateAgeGate: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-gold)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">FSSAI Central Food / Beverage License Number</label>
            <input 
              type="text" 
              className="input" 
              value={config.fssaiLicenseNumber}
              onChange={(e) => setConfig({ ...config, fssaiLicenseNumber: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Responsible Drinking National Helpline</label>
            <input 
              type="text" 
              className="input" 
              value={config.responsibleDrinkingHelpline}
              onChange={(e) => setConfig({ ...config, responsibleDrinkingHelpline: e.target.value })}
            />
          </div>
        </div>

        {/* Redemption & Anti-Replay Security */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--accent-gold)" />
            In-Store Voucher & Anti-Fraud Security
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Coupon Token Validity (Minutes)</label>
              <input 
                type="number" 
                className="input" 
                value={config.defaultTokenValidityMinutes}
                onChange={(e) => setConfig({ ...config, defaultTokenValidityMinutes: Number(e.target.value) })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Token auto-expires if not shown at counter</span>
            </div>

            <div className="form-group">
              <label className="form-label">Max Redemptions Per Customer / Day</label>
              <input 
                type="number" 
                className="input" 
                value={config.maxDailyRedemptionsPerUser}
                onChange={(e) => setConfig({ ...config, maxDailyRedemptionsPerUser: Number(e.target.value) })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Limits coupon hoarding</span>
            </div>
          </div>
        </div>

        {/* SMS & Developer Gateway */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} color="var(--accent-gold)" />
            Phone Verification & SMS Gateway
          </h3>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Developer Mock OTP Mode (Default OTP: 123456)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Allows seamless local testing on mobile simulator and web without consuming SMS credits
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={config.enableMockOtpForTesting}
              onChange={(e) => setConfig({ ...config, enableMockOtpForTesting: e.target.checked })}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-gold)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
            <Save size={16} />
            <span>Save Configuration</span>
          </button>

          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
              <CheckCircle size={18} />
              <span>Platform settings updated successfully</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

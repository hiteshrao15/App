import React, { useState } from 'react';
import { CalendarOff, Plus, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { Modal } from '../components/Modal';

interface DryDayItem {
  id: string;
  date: string;
  occasion: string;
  state: string;
  enforcementLevel: 'MANDATORY_EXCISE' | 'STATE_LOCAL';
}

const INITIAL_DRY_DAYS: DryDayItem[] = [
  { id: 'dd-1', date: '2026-01-26', occasion: 'Republic Day', state: 'ALL', enforcementLevel: 'MANDATORY_EXCISE' },
  { id: 'dd-2', date: '2026-08-15', occasion: 'Independence Day', state: 'ALL', enforcementLevel: 'MANDATORY_EXCISE' },
  { id: 'dd-3', date: '2026-10-02', occasion: 'Mahatma Gandhi Jayanti', state: 'ALL', enforcementLevel: 'MANDATORY_EXCISE' },
  { id: 'dd-4', date: '2026-11-08', occasion: 'Diwali (Laxmi Pujan)', state: 'Maharashtra', enforcementLevel: 'STATE_LOCAL' },
  { id: 'dd-5', date: '2026-03-25', occasion: 'Holi', state: 'Delhi', enforcementLevel: 'STATE_LOCAL' },
  { id: 'dd-6', date: '2026-11-01', occasion: 'Kannada Rajyotsava', state: 'Karnataka', enforcementLevel: 'STATE_LOCAL' },
];

export const DryDays: React.FC = () => {
  const [dryDays, setDryDays] = useState<DryDayItem[]>(INITIAL_DRY_DAYS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDay, setNewDay] = useState<Partial<DryDayItem>>({
    date: '',
    occasion: '',
    state: 'ALL',
    enforcementLevel: 'MANDATORY_EXCISE',
  });

  const handleAddDryDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDay.date || !newDay.occasion) return;

    setDryDays([
      {
        id: `dd-${Date.now()}`,
        date: newDay.date,
        occasion: newDay.occasion,
        state: newDay.state || 'ALL',
        enforcementLevel: newDay.enforcementLevel || 'STATE_LOCAL',
      },
      ...dryDays,
    ]);

    setIsModalOpen(false);
    setNewDay({ date: '', occasion: '', state: 'ALL', enforcementLevel: 'MANDATORY_EXCISE' });
  };

  return (
    <div>
      {/* Notice Banner */}
      <div className="card" style={{ 
        background: 'rgba(245, 158, 11, 0.08)', 
        border: '1px solid rgba(245, 158, 11, 0.3)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--warning)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>State Excise Dry Day Compliance Lock</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              On declared dry days, the BottleBazaar consumer app automatically disables coupon redemptions for stores in that state.
            </p>
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} />
          <span>Add Official Dry Day</span>
        </button>
      </div>

      {/* Dry Days Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Occasion</th>
                <th>State Jurisdiction</th>
                <th>Enforcement Rule</th>
                <th>App Status</th>
              </tr>
            </thead>
            <tbody>
              {dryDays.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-gold)' }}>
                    {d.date}
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {d.occasion}
                  </td>
                  <td>
                    <span className={`badge ${d.state === 'ALL' ? 'badge-gold' : 'badge-info'}`}>
                      {d.state === 'ALL' ? 'Pan-India (All States)' : d.state}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {d.enforcementLevel === 'MANDATORY_EXCISE' ? 'Excise Dept National Order' : 'State Gazette Notification'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <Check size={12} />
                      Lock Armed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dry Day Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Schedule Excise Dry Day Lock"
      >
        <form onSubmit={handleAddDryDay}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input 
              type="date" 
              className="input" 
              required
              value={newDay.date}
              onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Occasion / Reason *</label>
            <input 
              type="text" 
              className="input" 
              required
              placeholder="e.g. Gandhi Jayanti, Election Poll Day"
              value={newDay.occasion}
              onChange={(e) => setNewDay({ ...newDay, occasion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Jurisdiction *</label>
            <select 
              className="select"
              value={newDay.state}
              onChange={(e) => setNewDay({ ...newDay, state: e.target.value })}
            >
              <option value="ALL">Pan-India (All States)</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Goa">Goa</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Arm Dry Day Lock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

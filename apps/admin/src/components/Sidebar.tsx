import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Tag, 
  QrCode, 
  CalendarOff, 
  Settings, 
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'stores' | 'offers' | 'redemptions' | 'drydays' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stores', label: 'Stores & Licenses', icon: Store },
    { id: 'offers', label: 'Discounts & Offers', icon: Tag },
    { id: 'redemptions', label: 'Redeem Coupons', icon: QrCode },
    { id: 'drydays', label: 'Dry Days Calendar', icon: CalendarOff },
    { id: 'settings', label: 'Platform & Compliance', icon: Settings },
  ] as const;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">🍾</div>
        <div>
          <div className="brand-title">BottleBazaar</div>
          <div className="brand-badge">Merchant & Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="avatar">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button 
          onClick={logout} 
          title="Logout" 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

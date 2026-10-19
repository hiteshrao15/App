import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, isPositive = true, icon: Icon }) => {
  return (
    <div className="card stat-card">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${isPositive ? 'up' : 'down'}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="stat-icon-bubble">
        <Icon size={24} />
      </div>
    </div>
  );
};

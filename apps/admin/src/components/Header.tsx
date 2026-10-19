import React from 'react';
import { Bell, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="top-bar">
      <div className="page-title-box">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="top-actions">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          color: 'var(--success)',
          fontWeight: 600,
        }}>
          <ShieldCheck size={14} />
          <span>FSSAI & Excise Regulated</span>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => window.open('http://localhost:3000/docs', '_blank')}
          title="Open API Docs"
        >
          <ExternalLink size={14} />
          <span>API Specs</span>
        </button>
      </div>
    </header>
  );
};

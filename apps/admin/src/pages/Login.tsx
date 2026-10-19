import React, { useState } from 'react';
import { Lock, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin@bottlebazaar.in');
  const [otpOrPassword, setOtpOrPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(identifier, otpOrPassword);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(212, 163, 89, 0.08) 0%, transparent 60%), #0a0b0e',
      padding: '1.5rem',
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--accent-glow)',
          }}>
            🍾
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            BottleBazaar Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Merchant Counter & Administrator Sign In
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Phone Number or Admin Email</label>
            <input 
              type="text" 
              className="input" 
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. +91 98200 12345 or admin@..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password / OTP (Dev default: 123456)</label>
            <input 
              type="password" 
              className="input" 
              required
              value={otpOrPassword}
              onChange={(e) => setOtpOrPassword(e.target.value)}
              placeholder="Enter OTP or Password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Access Merchant Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={14} color="var(--success)" />
          <span>FSSAI & State Excise Approved Retail Portal</span>
        </div>
      </div>
    </div>
  );
};

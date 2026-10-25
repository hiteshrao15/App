import React, { useState } from 'react';
import { Lock, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { requestOtp, login } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (!otpRequested) {
        await requestOtp(phone);
        setOtpRequested(true);
        setMessage('OTP sent. Enter the code to continue.');
      } else {
        await login(phone, otp);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
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
            <label className="form-label">Registered phone number</label>
            <input 
              type="text" 
              className="input" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98200 12345"
              disabled={otpRequested}
            />
          </div>

          <div className="form-group">
            <label className="form-label">One-time password</label>
            <input 
              type="text" 
              className="input" 
              required={otpRequested}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={otpRequested ? 'Enter 6-digit OTP' : 'Request an OTP first'}
              disabled={!otpRequested}
            />
          </div>

          {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
          {message && <p role="status" style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{message}</p>}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : otpRequested ? 'Access Merchant Portal' : 'Send OTP'}</span>
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

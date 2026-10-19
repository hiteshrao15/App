import React, { useEffect, useState } from 'react';
import { 
  QrCode, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  History, 
  Sparkles,
  IndianRupee,
  Clock
} from 'lucide-react';
import { adminApi, RedemptionRecord } from '../services/api';

export const Redemptions: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [billAmount, setBillAmount] = useState<number>(2500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: RedemptionRecord;
  }>({ type: null, message: '' });

  const [records, setRecords] = useState<RedemptionRecord[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const list = await adminApi.getRedemptions();
    setRecords(list);
  };

  const handleValidateAndRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsProcessing(true);
    setValidationResult({ type: null, message: '' });

    try {
      const res = await adminApi.verifyAndRedeemCoupon(tokenInput.trim(), billAmount);
      if (res.success) {
        setValidationResult({
          type: 'success',
          message: res.message,
          details: res.redemption,
        });
        setTokenInput('');
        await loadRecords();
      } else {
        setValidationResult({
          type: 'error',
          message: res.message,
        });
      }
    } catch (err: any) {
      setValidationResult({
        type: 'error',
        message: err.message || 'Verification network error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Merchant In-Store Terminal */}
      <div className="card redeem-scanner-box">
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(212, 163, 89, 0.15)', borderRadius: 'var(--radius-full)', color: 'var(--accent-gold)', marginBottom: '1rem' }}>
          <QrCode size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', color: '#fff' }}>
          Store Point-of-Sale Redemption Terminal
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
          Customer presents their 6-character code (e.g. <strong style={{ color: 'var(--accent-gold)' }}>BB-948123</strong>) or QR token from their mobile wallet.
        </p>

        <form onSubmit={handleValidateAndRedeem} style={{ maxWidth: '440px', margin: '0 auto' }}>
          <div className="form-group">
            <input 
              type="text" 
              className="input code-input-large" 
              placeholder="BB-______"
              maxLength={12}
              autoFocus
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bill Amount:</span>
            <div style={{ position: 'relative', width: '160px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹</span>
              <input 
                type="number" 
                className="input" 
                style={{ paddingLeft: '1.8rem', textAlign: 'right' }} 
                value={billAmount}
                onChange={(e) => setBillAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={isProcessing || !tokenInput}
          >
            {isProcessing ? 'Verifying with Ledger...' : 'Validate & Apply Discount'}
          </button>
        </form>

        {/* Validation Result Alert */}
        {validationResult.type === 'success' && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
            maxWidth: '480px',
            margin: '1.5rem auto 0 auto',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, marginBottom: '0.4rem' }}>
              <CheckCircle size={20} />
              <span>Coupon Verified & Redeemed!</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {validationResult.message}
            </p>
            {validationResult.details && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Offer: <strong style={{ color: '#fff' }}>{validationResult.details.offerTitle}</strong> |
                Savings: <strong style={{ color: 'var(--success)' }}>₹{validationResult.details.discountAmount}</strong>
              </div>
            )}
          </div>
        )}

        {validationResult.type === 'error' && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
            maxWidth: '480px',
            margin: '1.5rem auto 0 auto',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.4rem' }}>
              <XCircle size={20} />
              <span>Redemption Denied</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#ffb3b3' }}>
              {validationResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Redemption Audit Log */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>In-Store Redemption Ledger</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Immutable log of all claimed and redeemed discount tokens</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadRecords}>
            <History size={14} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Voucher Code</th>
                <th>Offer Details</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Bill & Discount</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {r.tokenCode}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{r.offerTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.discountSummary}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.userPhone}</div>
                  </td>
                  <td>{r.storeName}</td>
                  <td>
                    {r.billAmount ? (
                      <div>
                        <span style={{ fontSize: '0.85rem' }}>₹{r.billAmount}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginLeft: '6px', fontWeight: 600 }}>
                          (-₹{r.discountAmount})
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending bill</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'REDEEMED' ? 'badge-success' : 'badge-warning'}`}>
                      {r.status === 'REDEEMED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(r.redeemedAt || r.claimedAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

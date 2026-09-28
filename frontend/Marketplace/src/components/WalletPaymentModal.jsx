import React, { useEffect, useState } from 'react';
import { api, formatDate, formatFCFA, PAYMENT_STATUS_LABELS } from '../api';

/**
 * Wallet overview.
 * - Artisans: earnings credited when clients release escrow (paid out automatically
 *   to their Mobile Money number, minus the 2% platform fee).
 * - Clients: money currently held in escrow and their payment history.
 * Payments themselves are made from a booking ("Payer (Séquestre)") in the client dashboard.
 */
export default function WalletPaymentModal({
  isOpen,
  onClose,
  t,
  lang = 'fr',
  currentUser,
  walletBalance,
  onRefresh
}) {
  const isFrench = lang === 'fr';
  const tr = (fr, en) => (isFrench ? fr : en);
  const isArtisan = currentUser?.role === 'PROFESSIONAL';

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setLoading(true);
    setError('');
    api('/payments/history')
      .then((res) => setPayments(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    onRefresh?.();
  }, [isOpen, currentUser, onRefresh]);

  if (!isOpen) return null;

  const myProfessionalId = currentUser?.professionalId;
  const isIncoming = (p) => isArtisan && String(p.professionalId?._id || p.professionalId) === String(myProfessionalId);

  return (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      <div className="wallet-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="wallet-modal-header">
          <div className="wallet-header-title">
            <span className="wallet-title-icon">💳</span>
            <div>
              <h2>{t.walletTitle}</h2>
              <p className="wallet-subtitle">{t.walletSubtitle}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="wallet-balance-banner">
          <div className="balance-content">
            <span className="balance-label">
              {isArtisan ? tr('Gains cumulés', 'Total earnings') : tr('Montant en séquestre', 'Held in escrow')}
            </span>
            <h1 className="balance-figure">
              {Math.round(walletBalance || 0).toLocaleString('fr-FR')} <span className="currency-tag">FCFA</span>
            </h1>
            <span className="currency-sub">
              {isArtisan
                ? tr(
                    'Versés automatiquement sur votre numéro Mobile Money dès que le client valide la fin des travaux (frais Skillora : 2%).',
                    'Paid automatically to your Mobile Money number once the client confirms the job (Skillora fee: 2%).'
                  )
                : tr(
                    "Vos paiements restent bloqués jusqu'à votre validation de fin des travaux.",
                    'Your payments stay locked until you confirm the job is finished.'
                  )}
            </span>
          </div>
          <div className="balance-badges">
            <span className="badge-payment mtn">MTN MoMo</span>
            <span className="badge-payment orange">Orange Money</span>
          </div>
        </div>

        <div className="tx-history-box">
          <h4 className="tx-title">{t.recentTransactions}</h4>
          {loading ? (
            <p className="tx-date">{tr('Chargement…', 'Loading…')}</p>
          ) : error ? (
            <p className="tx-date">⚠️ {error}</p>
          ) : payments.length === 0 ? (
            <p className="tx-date">{tr('Aucune transaction pour le moment.', 'No transactions yet.')}</p>
          ) : (
            <div className="tx-list">
              {payments.map((p) => {
                const incoming = isIncoming(p);
                const amount = incoming ? p.artisanAmount : p.amount;
                const label = PAYMENT_STATUS_LABELS[p.status] || { fr: p.status, en: p.status };
                const client = p.customerId ? `${p.customerId.firstName || ''} ${p.customerId.lastName || ''}`.trim() : '';
                const artisan = p.professionalId?.userId
                  ? `${p.professionalId.userId.firstName || ''} ${p.professionalId.userId.lastName || ''}`.trim()
                  : '';
                return (
                  <div key={p._id} className="tx-row">
                    <div className="tx-left">
                      <span className={`tx-icon ${incoming ? 'deposit' : 'withdraw'}`}>{incoming ? '↓' : '↑'}</span>
                      <div>
                        <span className="tx-desc">
                          {incoming ? tr(`Paiement de ${client}`, `Payment from ${client}`) : tr(`Paiement à ${artisan}`, `Payment to ${artisan}`)}
                          {p.serviceRequestId?.description ? ` • ${p.serviceRequestId.description.slice(0, 40)}` : ''}
                        </span>
                        <span className="tx-date">{formatDate(p.createdAt, lang)}</span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span className={`tx-amount ${incoming ? 'pos' : 'neg'}`}>
                        {incoming ? '+' : '−'}{formatFCFA(amount)}
                      </span>
                      <span className="tx-status">{isFrench ? label.fr : label.en}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export default function WalletPaymentModal({
  isOpen,
  onClose,
  t,
  walletBalance,
  setWalletBalance,
  triggerToast
}) {
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw'
  const [paymentProvider, setPaymentProvider] = useState('MTN'); // 'MTN' | 'ORANGE'
  const [amount, setAmount] = useState('25000');
  const [phone, setPhone] = useState('670000000');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 'TX-8921', type: 'Deposit', provider: 'MTN MoMo', amount: 50000, date: 'Today, 09:15', status: 'Completed' },
    { id: 'TX-8410', type: 'Escrow Release', provider: 'Skillora Escrow', amount: 75000, date: 'Yesterday', status: 'Completed' },
    { id: 'TX-7992', type: 'Withdrawal', provider: 'Orange Money', amount: -30000, date: '25 Aug 2026', status: 'Completed' },
  ]);

  if (!isOpen) return null;

  const quickAmounts = [5000, 10000, 25000, 50000, 100000, 250000];

  const handleTransaction = (e) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      triggerToast('Please enter a valid amount in FCFA.', '⚠️');
      return;
    }

    if (activeTab === 'withdraw' && numAmount > walletBalance) {
      triggerToast('Insufficient funds in your Skillora FCFA wallet.', '⚠️');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const isDeposit = activeTab === 'deposit';
      const newBal = isDeposit ? walletBalance + numAmount : walletBalance - numAmount;
      setWalletBalance(newBal);

      const newTx = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        type: isDeposit ? 'Deposit' : 'Withdrawal',
        provider: paymentProvider === 'MTN' ? 'MTN Mobile Money' : 'Orange Money',
        amount: isDeposit ? numAmount : -numAmount,
        date: 'Just now',
        status: 'Completed'
      };
      setTransactions([newTx, ...transactions]);

      const successMsg = isDeposit
        ? `✓ +${numAmount.toLocaleString()} FCFA successfully added via ${paymentProvider === 'MTN' ? 'MTN MoMo' : 'Orange Money'}!`
        : `✓ -${numAmount.toLocaleString()} FCFA withdrawn to ${paymentProvider === 'MTN' ? 'MTN' : 'Orange'} (${phone})!`;
      
      triggerToast(successMsg, '💰');
    }, 1500);
  };

  return (
    <div className="modal-backdrop-luxury">
      <div className="wallet-modal-card">
        {/* Header */}
        <div className="wallet-modal-header">
          <div className="wallet-header-title">
            <span className="wallet-title-icon">💳</span>
            <div>
              <h2>{t.walletTitle}</h2>
              <p className="wallet-subtitle">{t.walletSubtitle}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Live Balance Card */}
        <div className="wallet-balance-banner">
          <div className="balance-content">
            <span className="balance-label">{t.currentBalance}</span>
            <h1 className="balance-figure">
              {walletBalance.toLocaleString()} <span className="currency-tag">FCFA</span>
            </h1>
            <span className="currency-sub">Central African CFA Franc (XAF)</span>
          </div>
          <div className="balance-badges">
            <span className="badge-payment mtn">MTN MoMo (*126#)</span>
            <span className="badge-payment orange">Orange Money (#150#)</span>
          </div>
        </div>

        {/* Tab Switcher: Deposit vs Withdraw */}
        <div className="wallet-tab-switch">
          <button
            className={`w-tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            📥 {t.depositTab}
          </button>
          <button
            className={`w-tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            📤 {t.withdrawTab}
          </button>
        </div>

        {/* Payment Methods Selection */}
        <div className="payment-providers-section">
          <label className="section-mini-label">{t.selectPaymentMethod}:</label>
          <div className="provider-cards-grid">
            {/* MTN Mobile Money Card */}
            <div
              className={`provider-card mtn-card ${paymentProvider === 'MTN' ? 'selected' : ''}`}
              onClick={() => setPaymentProvider('MTN')}
            >
              <div className="provider-header">
                <div className="provider-logo-badge mtn-bg">MTN</div>
                <span className="provider-check">{paymentProvider === 'MTN' ? '● Selected' : '○'}</span>
              </div>
              <div className="provider-body">
                <h3>{t.mtnMomo}</h3>
                <p>{t.mtnDesc}</p>
              </div>
            </div>

            {/* Orange Money Card */}
            <div
              className={`provider-card orange-card ${paymentProvider === 'ORANGE' ? 'selected' : ''}`}
              onClick={() => setPaymentProvider('ORANGE')}
            >
              <div className="provider-header">
                <div className="provider-logo-badge orange-bg">ORANGE</div>
                <span className="provider-check">{paymentProvider === 'ORANGE' ? '● Selected' : '○'}</span>
              </div>
              <div className="provider-body">
                <h3>{t.orangeMoney}</h3>
                <p>{t.orangeDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleTransaction} className="wallet-form">
          <div className="form-field-group">
            <label className="field-label">{t.enterAmount}</label>
            <div className="amount-input-wrapper">
              <input
                type="number"
                min="500"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="luxury-amount-input"
                placeholder="25000"
                required
              />
              <span className="amount-unit">FCFA</span>
            </div>

            {/* Quick Amount Presets */}
            <div className="preset-amounts">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`preset-btn ${amount === amt.toString() ? 'active' : ''}`}
                  onClick={() => setAmount(amt.toString())}
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field-group">
            <label className="field-label">{t.enterPhone}</label>
            <div className="phone-input-wrapper">
              <span className="phone-prefix">🇨🇲 +237</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="luxury-phone-input"
                placeholder="670 000 000"
                required
              />
            </div>
            <span className="phone-helper">
              {paymentProvider === 'MTN'
                ? 'You will receive an MTN MoMo prompt on your phone to confirm with your PIN.'
                : 'You will receive an Orange Money prompt or generate your authorization OTP via #150#.'}
            </span>
          </div>

          <button
            type="submit"
            className={`btn-process-payment ${paymentProvider.toLowerCase()}`}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span>⏳ Connecting with {paymentProvider === 'MTN' ? 'MTN MoMo' : 'Orange Money'}...</span>
            ) : (
              <span>
                {activeTab === 'deposit' ? t.processDeposit : t.processWithdraw} (
                {parseInt(amount || '0', 10).toLocaleString()} FCFA)
              </span>
            )}
          </button>
        </form>

        {/* Recent Transactions List */}
        <div className="tx-history-box">
          <h4 className="tx-title">{t.recentTransactions}</h4>
          <div className="tx-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="tx-row">
                <div className="tx-left">
                  <span className={`tx-icon ${tx.amount > 0 ? 'deposit' : 'withdraw'}`}>
                    {tx.amount > 0 ? '↓' : '↑'}
                  </span>
                  <div>
                    <span className="tx-desc">{tx.type} • {tx.provider}</span>
                    <span className="tx-date">{tx.date}</span>
                  </div>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${tx.amount > 0 ? 'pos' : 'neg'}`}>
                    {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} FCFA
                  </span>
                  <span className="tx-status">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

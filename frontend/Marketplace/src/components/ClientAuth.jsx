import React, { useState } from 'react';

export default function ClientAuth({ onSwitchToArtisan, onLoginSuccess, triggerToast, t, lang }) {
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const getStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score += 25;
    if (/[A-Z]/.test(val)) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;

    let color = '#d44a4a';
    let text = t.weakPass;
    if (score > 25 && score <= 75) {
      color = '#c8a24e';
      text = t.medPass;
    } else if (score > 75) {
      color = '#4e9a7d';
      text = t.strongPass;
    }
    return { score, color, text };
  };

  const strength = getStrength(password);

  const handleLogin = (e) => {
    e.preventDefault();
    triggerToast(lang === 'fr' ? 'Connexion réussie ! Bienvenue sur votre espace client Skillora.' : 'Welcome back to your Skillora Client Workspace!');
    onLoginSuccess({
      role: 'CLIENT',
      name: name || 'Sarah Connor',
      email: email || 'sarah@skillora.cm',
      phone: phone || '+237 670 11 22 33',
      city: 'Douala (Bonapriso)'
    });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    triggerToast(lang === 'fr' ? 'Compte Client créé avec succès !' : 'Client account created successfully!');
    onLoginSuccess({
      role: 'CLIENT',
      name: name || 'Valerie Mbida',
      email: email || 'valerie@skillora.cm',
      phone: phone || '+237 699 88 77 66',
      city: 'Yaoundé (Bastos)'
    });
  };

  const openWhatsAppHelp = () => {
    window.open('https://wa.me/237670000000?text=Hello%20Skillora%20Support,%20I%20need%20help%20with%20client%20registration', '_blank');
  };

  return (
    <div className="auth-wrapper client-theme">
      <div className="auth-panel">
        <div className="auth-header">
          <div className="auth-label">{t.forClients}</div>
          <h2 className="auth-title">{tab === 'login' ? t.welcomeBack : t.createAccount}</h2>
          <p className="auth-subtitle">
            {tab === 'login'
              ? (lang === 'fr' ? 'Connectez-vous pour réserver des artisans vérifiés au Cameroun.' : 'Sign in to discover & hire top verified artisans in Cameroon.')
              : (lang === 'fr' ? 'Rejoignez les clients qui réalisent leurs projets en toute sérénité.' : 'Join clients hiring elite professionals with escrow protection.')}
          </p>
        </div>

        <div className="tab-bar">
          <button
            className={`tab-item ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            {t.signIn}
          </button>
          <button
            className={`tab-item ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => setTab('signup')}
          >
            {t.createAccount}
          </button>
        </div>

        {/* LOGIN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label">{t.emailOrPhone}</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="client@skillora.cm or +237 6xx xx xx xx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="field-row">
                <label className="field-label">{t.password}</label>
                <span className="forgot-link" onClick={() => triggerToast(lang === 'fr' ? 'Lien de réinitialisation envoyé par SMS/Email' : 'Password reset link dispatched to your contact.')}>
                  {t.forgotPass}
                </span>
              </div>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn">{t.signIn} →</button>
          </form>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignup}>
            <div className="field">
              <label className="field-label">{t.fullName}</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Valerie Mbida"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t.email}</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  className="input-field"
                  placeholder="valerie@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t.phone}</label>
              <div className="input-wrap">
                <span className="input-icon">📞</span>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+237 6xx xx xx xx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t.password}</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="strength-bar-wrap">
              <div className="strength-track">
                <div
                  className="strength-fill"
                  style={{ width: `${strength.score}%`, background: strength.color }}
                ></div>
              </div>
              <span className="strength-text" style={{ color: strength.color }}>
                {strength.text}
              </span>
            </div>

            <button type="submit" className="submit-btn" style={{ marginTop: '1.5rem' }}>
              {t.createAccount} →
            </button>
          </form>
        )}

        {/* WhatsApp direct help pill */}
        <div className="whatsapp-help-box" onClick={openWhatsAppHelp}>
          <span>💬 {lang === 'fr' ? 'Besoin d\'aide ? Discutez directement avec nous sur WhatsApp' : 'Need assistance? Chat directly with Skillora on WhatsApp'}</span>
        </div>

        <div className="switch-role-footer">
          <span>{lang === 'fr' ? 'Vous êtes un professionnel ou une équipe d\'artisans ?' : 'Are you a skilled artisan or workshop group?'}</span>
          <span className="switch-role-link" onClick={onSwitchToArtisan}>
            {lang === 'fr' ? 'Espace Artisan & Collectifs →' : 'Join as Artisan / Group →'}
          </span>
        </div>
      </div>
    </div>
  );
}

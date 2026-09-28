import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { api, normalizeUser, saveSession } from '../api';

export default function ClientAuth({ initialTab, setAuthTab, onSwitchToArtisan, onBackToLanding, onLoginSuccess, triggerToast, t, lang, setLang, theme, setTheme }) {
  const [tab, setTabState] = useState(initialTab || 'login');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const setTab = (newTab) => {
    setTabState(newTab);
    if (setAuthTab) setAuthTab(newTab);
  };

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: email.trim().toLowerCase(), password },
      });
      const user = normalizeUser(data.data.user);
      saveSession(data.data.token, user);

      const welcome = {
        ADMIN: [lang === 'fr' ? 'Connexion administrateur réussie.' : 'Admin login successful.', '🛡️'],
        PROFESSIONAL: [lang === 'fr' ? 'Connexion réussie ! Bienvenue sur votre espace artisan.' : 'Welcome back to your Artisan Workspace!', '🛠️'],
        CUSTOMER: [lang === 'fr' ? 'Connexion réussie ! Bienvenue sur votre espace client Skillora.' : 'Welcome back to your Skillora Client Workspace!', '✓'],
      }[user.role] || ['✓', '✓'];
      triggerToast(welcome[0], welcome[1]);
      onLoginSuccess(user);
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const [firstName, ...rest] = name.trim().split(/\s+/);
    if (!firstName) {
      triggerToast(lang === 'fr' ? 'Veuillez indiquer votre nom complet.' : 'Please enter your full name.', '⚠️');
      return;
    }
    if (password.length < 8) {
      triggerToast(lang === 'fr' ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Password must be at least 8 characters.', '⚠️');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          firstName,
          lastName: rest.join(' ') || '-',
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: 'CUSTOMER',
        },
      });
      const user = normalizeUser(data.data.user);
      saveSession(data.data.token, user);
      triggerToast(lang === 'fr' ? 'Compte Client créé avec succès !' : 'Client account created successfully!', '✓');
      onLoginSuccess(user);
    } catch (err) {
      triggerToast(
        err.status === 409
          ? (lang === 'fr'
              ? 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.'
              : 'An account with this email already exists. Please log in.')
          : err.message,
        '⚠️'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppHelp = () => {
    window.open('https://wa.me/237670000000?text=Hello%20Skillora%20Support,%20I%20need%20help%20with%20client%20registration', '_blank');
  };

  return (
    <div className="onboarding-screen-wrapper client-theme relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ paddingTop: '60px' }}>
      {/* Full-Width Top Header Navbar — Same as Home Page */}
      <header className="fullwidth-top-navbar w-full fixed top-0 left-0 right-0 z-50">
        <div className="navbar-fullwidth-inner w-full flex items-center justify-between px-6 py-3">
          <div className="landing-brand flex items-center gap-2">
            <span className="brand-icon-gem text-2xl" onClick={onBackToLanding} style={{ cursor: 'pointer' }}>💎</span>
            <span className="brand-name text-xl font-extrabold tracking-tight" onClick={onBackToLanding} style={{ cursor: 'pointer' }}>Skillora</span>
            {onBackToLanding && (
              <button className="auth-back-btn ml-2" onClick={onBackToLanding} title="Retour à l'accueil" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'inherit', cursor: 'pointer' }}>
                ← {lang === 'fr' ? 'Accueil' : 'Home'}
              </button>
            )}
          </div>

          <div className="landing-controls flex items-center gap-3">
            {/* Language Switcher */}
            <div className="lang-switcher-pill flex items-center rounded-lg p-1 text-xs">
              <button
                className={`lang-btn px-2 py-1 rounded font-bold transition-all ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang && setLang('en')}
                title="English"
              >
                🇬🇧 EN
              </button>
              <span className="lang-divider px-1 opacity-40">|</span>
              <button
                className={`lang-btn px-2 py-1 rounded font-bold transition-all ${lang === 'fr' ? 'active' : ''}`}
                onClick={() => setLang && setLang('fr')}
                title="Français"
              >
                🇫🇷 FR
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="theme-toggle-pill flex items-center rounded-lg p-1 text-xs">
              <button
                type="button"
                className={`theme-toggle-btn px-2 py-1 rounded font-semibold transition-all ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme && setTheme('light')}
                title="Mode Clair"
              >
                ☀️ <span className="theme-toggle-label ml-1">Clair</span>
              </button>
              <button
                type="button"
                className={`theme-toggle-btn px-2 py-1 rounded font-semibold transition-all ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme && setTheme('dark')}
                title="Mode Sombre"
              >
                🌙 <span className="theme-toggle-label ml-1">Sombre</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Ultra-Compact Auth Card Fits Above the Fold (100vh) */}
      <div className="auth-panel compact-panel login-card-spec w-full p-3 my-auto shadow-2xl rounded-2xl">
        {/* Header (En-tête) */}
        <div className="auth-header-spec text-center mb-2">
          <h2 className="title-main" style={{ fontSize: '1.2rem', margin: '0 0 0.15rem 0' }}>{tab === 'login' ? (lang === 'fr' ? 'Bon retour' : 'Welcome Back') : t.createAccount}</h2>
          <p className="subtitle-spec" style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
            {tab === 'login'
              ? (lang === 'fr' ? 'Veuillez entrer vos identifiants' : 'Please enter your credentials')
              : (lang === 'fr' ? 'Rejoignez les clients qui réalisent leurs projets en toute sérénité.' : 'Join clients hiring elite professionals with escrow protection.')}
          </p>
        </div>

        {/* LOGIN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form-spec space-y-2">
            {/* Champ Adresse e-mail */}
            <div className="field-group-spec">
              <label className="field-label-dark" style={{ fontSize: '0.75rem' }}>Adresse e-mail</label>
              <div className="input-wrap-spec">
                <span className="input-icon-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </span>
                <input
                  type="email"
                  className="input-field-spec"
                  placeholder="Entrez votre e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="field-group-spec">
              <label className="field-label-dark" style={{ fontSize: '0.75rem' }}>Mot de passe</label>
              <div className="input-wrap-spec">
                <span className="input-icon-left">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field-spec"
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.45rem 2.2rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                  required
                />
                <button
                  type="button"
                  className="pass-toggle-btn"
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Options et liens */}
            <div className="login-options-row" style={{ fontSize: '0.75rem' }}>
              <label className="remember-me-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="remember-checkbox"
                />
                <span className="remember-text">Se souvenir de moi</span>
              </label>

              <span
                className="forgot-password-link"
                onClick={() => setIsForgotModalOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                Mot de passe oublié ?
              </span>
            </div>

            {/* Bouton d'action "Connexion" */}
            <button type="submit" className="login-action-btn w-full" style={{ padding: '0.55rem', fontSize: '0.85rem' }} disabled={isSubmitting}>
              {isSubmitting ? (lang === 'fr' ? 'Connexion en cours...' : 'Signing in...') : (lang === 'fr' ? 'Connexion' : 'Sign In')}
            </button>

            {/* Subtle bottom switch link */}
            <div className="auth-bottom-switch" style={{ fontSize: '0.75rem' }}>
              <span>{lang === 'fr' ? 'Pas encore de compte ? ' : "Don't have an account? "}</span>
              <span className="auth-switch-link" onClick={() => setTab('signup')}>
                {lang === 'fr' ? "S'inscrire" : 'Sign up'}
              </span>
            </div>
          </form>
        ) : (
          /* SIGNUP FORM WITH MULTI-COLUMN GRID LAYOUT */
          <form onSubmit={handleSignup}>
            <div className="compact-form-grid">
              <div className="field">
                <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.fullName}</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Valerie Mbida"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.email}</label>
                <div className="input-wrap">
                  <span className="input-icon">✉</span>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="valerie@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.phone}</label>
                <div className="input-wrap">
                  <span className="input-icon">📞</span>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+237 6xx xx xx xx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.password}</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Min 8 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: '0.4rem 2.2rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
                    required
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="strength-bar-wrap" style={{ margin: '0.3rem 0' }}>
              <div className="strength-track">
                <div
                  className="strength-fill"
                  style={{ width: `${strength.score}%`, background: strength.color }}
                ></div>
              </div>
              <span className="strength-text" style={{ color: strength.color, fontSize: '0.7rem' }}>
                {strength.text}
              </span>
            </div>

            <button type="submit" className="submit-btn w-full" style={{ marginTop: '0.4rem', padding: '0.55rem', fontSize: '0.85rem' }} disabled={isSubmitting}>
              {isSubmitting ? (lang === 'fr' ? 'Création du compte...' : 'Creating Account...') : `${t.createAccount} →`}
            </button>

            {/* Subtle bottom switch link */}
            <div className="auth-bottom-switch" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
              <span>{lang === 'fr' ? 'Déjà un compte ? ' : 'Already have an account? '}</span>
              <span className="auth-switch-link" onClick={() => setTab('login')}>
                {lang === 'fr' ? 'Se connecter' : 'Sign in'}
              </span>
            </div>
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        triggerToast={triggerToast}
        lang={lang}
        onPasswordResetSuccess={(resetEmail, resetPass) => {
          setEmail(resetEmail);
          setPassword(resetPass);
        }}
      />
    </div>
  );
}

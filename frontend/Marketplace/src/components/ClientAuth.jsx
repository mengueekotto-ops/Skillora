import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { api, normalizeUser, saveSession } from '../api';
import AuthShell, { AuthField, PasswordInput, StrengthMeter } from './AuthShell';

export default function ClientAuth({ initialTab, setAuthTab, onSwitchToArtisan, onBackToLanding, onLoginSuccess, triggerToast, t, lang, setLang }) {
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

  const tr = (fr, en) => (lang === 'fr' ? fr : en);

  return (
    <AuthShell
      lang={lang}
      setLang={setLang}
      onBack={onBackToLanding}
      tagline={tr('Des artisans vérifiés, un paiement protégé', 'Verified artisans, protected payments')}
    >
      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="auth2-form" noValidate={false}>
          <h1 className="auth2-title">{tr('Connexion', 'Sign in')}</h1>
          <p className="auth2-subtitle">{tr('Accédez à votre espace client Skillora.', 'Access your Skillora client workspace.')}</p>

          <AuthField
            id="client-email"
            label={tr('Votre e-mail ou téléphone', 'Your email or phone')}
            type="text"
            autoComplete="username"
            placeholder="valerie@exemple.cm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <AuthField
            id="client-password"
            label={tr('Mot de passe', 'Password')}
            extra={
              <button type="button" className="auth2-link" onClick={() => setIsForgotModalOpen(true)}>
                {tr('Mot de passe oublié ?', 'Forgot password?')}
              </button>
            }
          >
            <PasswordInput
              id="client-password"
              lang={lang}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPass}
              onToggle={() => setShowPass(!showPass)}
              required
            />
          </AuthField>

          <label className="auth2-remember">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            {tr('Se souvenir de moi', 'Remember me')}
          </label>

          <button type="submit" className="auth2-btn" disabled={isSubmitting}>
            {isSubmitting ? tr('Connexion…', 'Signing in…') : tr('Se connecter', 'Sign in')}
          </button>

          <p className="auth2-bottom">
            {tr("Pas encore de compte ?", "Don't have an account?")}
            <button type="button" className="auth2-link strong" onClick={() => setTab('signup')}>
              {tr("S'inscrire", 'Sign up')}
            </button>
          </p>

          <div className="auth2-divider" />
          <p className="auth2-role-switch">
            {tr('Vous êtes artisan ou un atelier ?', 'Are you an artisan or a workshop?')}
            <button type="button" className="auth2-link strong" onClick={onSwitchToArtisan}>
              {tr('Espace artisan →', 'Artisan space →')}
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="auth2-form">
          <h1 className="auth2-title">{tr('Créer un compte', 'Sign up')}</h1>
          <p className="auth2-subtitle">
            {tr('Trouvez et payez des artisans vérifiés en toute sécurité.', 'Find and safely pay verified artisans.')}
          </p>

          <AuthField
            id="client-name"
            label={tr('Nom complet', 'Full name')}
            type="text"
            autoComplete="name"
            placeholder="Valérie Mbida"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <AuthField
            id="client-signup-email"
            label={tr('Votre e-mail', 'Your email')}
            type="email"
            autoComplete="email"
            placeholder="valerie@exemple.cm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthField
            id="client-phone"
            label={tr('Téléphone (Mobile Money)', 'Phone (Mobile Money)')}
            type="tel"
            autoComplete="tel"
            placeholder="+237 6XX XX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <AuthField id="client-new-password" label={tr('Mot de passe', 'Password')}>
            <PasswordInput
              id="client-new-password"
              lang={lang}
              autoComplete="new-password"
              placeholder={tr('8 caractères minimum', 'At least 8 characters')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPass}
              onToggle={() => setShowPass(!showPass)}
              minLength={8}
              required
            />
          </AuthField>
          <StrengthMeter {...strength} />

          <button type="submit" className="auth2-btn" disabled={isSubmitting}>
            {isSubmitting ? tr('Création du compte…', 'Creating account…') : tr('Créer mon compte', 'Create account')}
          </button>

          <p className="auth2-bottom">
            {tr('Déjà un compte ?', 'Already have an account?')}
            <button type="button" className="auth2-link strong" onClick={() => setTab('login')}>
              {tr('Se connecter', 'Sign in')}
            </button>
          </p>

          <div className="auth2-divider" />
          <p className="auth2-role-switch">
            {tr('Vous êtes artisan ou un atelier ?', 'Are you an artisan or a workshop?')}
            <button type="button" className="auth2-link strong" onClick={onSwitchToArtisan}>
              {tr('Espace artisan →', 'Artisan space →')}
            </button>
          </p>
        </form>
      )}

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
    </AuthShell>
  );
}

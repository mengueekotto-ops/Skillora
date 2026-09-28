import React, { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { api, normalizeUser, saveSession } from '../api';
import AuthShell, { AuthField, PasswordInput } from './AuthShell';

export default function AdminAuth({ onLoginSuccess, onBack, triggerToast, lang, setLang }) {
  const tr = (fr, en) => (lang === 'fr' ? fr : en);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await api('/admin/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: email.trim().toLowerCase(), password },
      });
      const user = normalizeUser(data.data.user);
      saveSession(data.data.token, user);
      setPassword('');
      triggerToast(tr('Connexion administrateur réussie.', 'Admin sign-in successful.'), '🛡️');
      onLoginSuccess(user);
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell lang={lang} setLang={setLang} onBack={onBack} tagline={tr('Console d’administration', 'Admin console')}>
      <form onSubmit={handleAdminLogin} className="auth2-form">
        <h1 className="auth2-title">{tr('Administration', 'Administration')}</h1>
        <p className="auth2-subtitle">
          {tr('Accès réservé aux administrateurs Skillora. Toutes les tentatives sont limitées et la session expire après 2 heures.', 'Restricted to Skillora administrators. Attempts are rate-limited and sessions expire after 2 hours.')}
        </p>

        <AuthField
          id="admin-email"
          label={tr('E-mail administrateur', 'Admin email')}
          type="email"
          autoComplete="username"
          placeholder="admin@votre-domaine.cm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthField
          id="admin-password"
          label={tr('Mot de passe', 'Password')}
          extra={
            <button type="button" className="auth2-link" onClick={() => setIsForgotModalOpen(true)}>
              {tr('Mot de passe oublié ?', 'Forgot password?')}
            </button>
          }
        >
          <PasswordInput
            id="admin-password"
            lang={lang}
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            show={showPass}
            onToggle={() => setShowPass(!showPass)}
            required
          />
        </AuthField>

        <button type="submit" className="auth2-btn" disabled={isSubmitting} style={{ marginTop: '8px' }}>
          {isSubmitting ? tr('Vérification…', 'Checking…') : tr('Accéder à la console', 'Open the console')}
        </button>

        <p className="auth2-bottom">🔒 {tr('Connexion chiffrée · accès journalisé', 'Encrypted connection · access logged')}</p>
      </form>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        triggerToast={triggerToast}
        lang={lang}
        onPasswordResetSuccess={(resetEmail) => setEmail(resetEmail)}
      />
    </AuthShell>
  );
}

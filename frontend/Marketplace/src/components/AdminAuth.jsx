import React, { useState } from 'react';

export default function AdminAuth({ onLoginSuccess, onBack, triggerToast, lang }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const token = data.token || data.data?.token;
        if (token) {
          localStorage.setItem('skillora_admin_token', token);
        }
        triggerToast(
          lang === 'fr'
            ? 'Connexion Administrateur autorisée. Accès sécurisé établi.'
            : 'Super Admin Access Authorized. Secure Session Established.',
          '🛡️'
        );
        onLoginSuccess(data.data?.user || { role: 'ADMIN', email: normalizedEmail });
      } else {
        triggerToast(
          data.message || (lang === 'fr' ? 'Accès refusé. Identifiants administrateur incorrects.' : 'Access Denied. Invalid admin credentials.'),
          '⚠️'
        );
      }
    } catch (err) {
      triggerToast(
        lang === 'fr' ? 'Erreur de connexion au serveur admin.' : 'Cannot connect to Admin API backend.',
        '⚠️'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper admin-theme">
      <div className="auth-panel" style={{ maxWidth: '460px' }}>
        <div className="auth-header">
          <div className="auth-label" style={{ color: '#ffb700', borderColor: 'rgba(255, 183, 0, 0.4)' }}>
            🔒 {lang === 'fr' ? 'PROTOCOLE SUPER ADMIN' : 'SUPER ADMIN PROTOCOL'}
          </div>
          <h2 className="auth-title" style={{ color: '#fff', textShadow: '0 0 15px rgba(255, 183, 0, 0.4)' }}>
            Skillora Admin Gateway
          </h2>
          <p className="auth-subtitle">
            {lang === 'fr'
              ? 'Portail de supervision générale, modération et vérification IA du réseau Skillora.'
              : 'Master administration, moderation, and AI verification oversight portal.'}
          </p>
        </div>

        <form onSubmit={handleAdminLogin}>
          <div className="field">
            <label className="field-label">
              {lang === 'fr' ? 'Identifiant Super Admin (Email)' : 'Super Admin Identifier (Email)'}
            </label>
            <div className="input-wrap">
              <span className="input-icon">🛡️</span>
              <input
                type="email"
                className="input-field"
                placeholder="admin@skillora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">
              {lang === 'fr' ? 'Clé de Sécurité / Mot de Passe' : 'Security Key / Password'}
            </label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            style={{
              background: 'linear-gradient(135deg, #ffb700, #d48800)',
              color: '#0a0d14',
              fontWeight: '700',
              marginTop: '1.5rem',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (lang === 'fr' ? 'Vérification des accréditations...' : 'Verifying clearance...')
              : (lang === 'fr' ? 'DÉVERROUILLER LE TABLEAU DE BORD →' : 'UNLOCK ADMIN CONSOLE →')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-outline"
            style={{ width: '100%', fontSize: '0.85rem' }}
            onClick={onBack}
          >
            ← {lang === 'fr' ? 'Retour au Marché Skillora' : 'Return to Skillora Marketplace'}
          </button>
        </div>
      </div>
    </div>
  );
}

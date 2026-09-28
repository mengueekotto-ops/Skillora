import React, { useState } from 'react';
import { api } from '../api';

export default function ForgotPasswordModal({ isOpen, onClose, triggerToast, lang = 'fr', onPasswordResetSuccess }) {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code & new pass
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receivedCodeMsg, setReceivedCodeMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      triggerToast(lang === 'fr' ? 'Veuillez saisir votre adresse e-mail.' : 'Please enter your email address.', '⚠️');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api('/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: { email: email.trim().toLowerCase() },
      });
      // The code is delivered out-of-band (email/SMS); it is never returned by the API
      setReceivedCodeMsg(data.message);
      setResetCode('');
      setStep(2);
      triggerToast(
        lang === 'fr' ? 'Si ce compte existe, un code à 6 chiffres vous a été envoyé.' : 'If this account exists, a 6-digit code has been sent.',
        '🔑'
      );
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) {
      triggerToast(lang === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please complete all fields.', '⚠️');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerToast(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.', '⚠️');
      return;
    }

    if (newPassword.length < 8) {
      triggerToast(lang === 'fr' ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Password must be at least 8 characters.', '⚠️');
      return;
    }

    setIsSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: { email: normalizedEmail, resetCode: resetCode.trim(), newPassword },
      });
      triggerToast(
        lang === 'fr'
          ? 'Mot de passe réinitialisé avec succès ! Connectez-vous avec vos nouveaux identifiants.'
          : 'Password reset successful! Sign in with your new password.',
        '✓'
      );
      if (onPasswordResetSuccess) onPasswordResetSuccess(normalizedEmail, newPassword);
      onClose();
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
    }}>
      <div style={{
        background: '#13201a',
        border: '1px solid rgba(255, 183, 0, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '460px',
        padding: '1.75rem',
        color: '#fff',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔑</span>
            <div>
              <h3 style={{ margin: 0, color: '#ffb700', fontSize: '1.1rem' }}>
                {lang === 'fr' ? 'Récupération de Mot de Passe' : 'Password Recovery'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {step === 1
                  ? (lang === 'fr' ? 'Saisissez votre e-mail de compte' : 'Enter your account email')
                  : (lang === 'fr' ? 'Entrez le code à 6 chiffres & nouveau passe' : 'Enter 6-digit code & new password')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '1.1rem',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 ? (
          <form onSubmit={handleRequestCode}>
            <div className="field" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label" style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                {lang === 'fr' ? 'Adresse E-mail ou Téléphone Enregistré' : 'Registered Email Address or Phone'}
              </label>
              <div className="input-wrap" style={{ marginTop: '0.4rem' }}>
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="user@skillora.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #ffb700, #d48800)',
                color: '#0a0d14',
                fontWeight: '700',
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.92rem',
              }}
            >
              {isSubmitting
                ? (lang === 'fr' ? 'Génération du code...' : 'Generating code...')
                : (lang === 'fr' ? 'Envoyer le Code de Réinitialisation ✉️' : 'Send Reset Code ✉️')}
            </button>
          </form>
        ) : (
          /* STEP 2: ENTER CODE & NEW PASSWORD */
          <form onSubmit={handleResetPassword}>
            {receivedCodeMsg && (
              <div style={{
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid #34d399',
                color: '#34d399',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                marginBottom: '1rem',
              }}>
                ✓ {receivedCodeMsg}
              </div>
            )}

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label className="field-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                {lang === 'fr' ? 'Code de Réinitialisation à 6 Chiffres' : '6-Digit Reset Code'}
              </label>
              <div className="input-wrap" style={{ marginTop: '0.3rem' }}>
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label className="field-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                {lang === 'fr' ? 'Nouveau Mot de Passe' : 'New Password'}
              </label>
              <div className="input-wrap" style={{ marginTop: '0.3rem' }}>
                <span className="input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="field" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                {lang === 'fr' ? 'Confirmer le Nouveau Mot de Passe' : 'Confirm New Password'}
              </label>
              <div className="input-wrap" style={{ marginTop: '0.3rem' }}>
                <span className="input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  width: '35%',
                }}
              >
                ← {lang === 'fr' ? 'Retour' : 'Back'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  width: '65%',
                }}
              >
                {isSubmitting
                  ? (lang === 'fr' ? 'Réinitialisation...' : 'Resetting...')
                  : (lang === 'fr' ? 'Changer le Mot de Passe 🔒' : 'Reset Password 🔒')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

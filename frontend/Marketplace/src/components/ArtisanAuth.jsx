import React, { useState } from 'react';
import ImageCapturePicker from './ImageCapturePicker';
import VerificationQuiz from './VerificationQuiz';
import VideoCapture from './VideoCapture';
import ForgotPasswordModal from './ForgotPasswordModal';
import { api, normalizeUser, saveSession } from '../api';

const MIN_PASSWORD_LENGTH = 8;

export default function ArtisanAuth({ onSwitchToClient, onBackToLanding, onLoginSuccess, triggerToast, t, lang, setLang, theme, setTheme }) {
  const [tab, setTab] = useState('login');
  const [wizardStep, setWizardStep] = useState(1);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const tr = (fr, en) => (lang === 'fr' ? fr : en);

  // Artisan Structure Type: 'SINGLE' vs 'GROUPED'
  const [artisanType, setArtisanType] = useState('SINGLE');

  // Account state
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [teamSize, setTeamSize] = useState('5');
  const [regNum, setRegNum] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 state
  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState('');
  const [city, setCity] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // The account is created when leaving step 1; later steps act on it
  const [account, setAccount] = useState(null);

  // KYC Verification Photos (server URLs after upload)
  const [idCardPhoto, setIdCardPhoto] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState('');
  const [diplomaPhoto, setDiplomaPhoto] = useState('');

  const [videoUrl, setVideoUrl] = useState('');
  const [quizResult, setQuizResult] = useState(null);
  const isQuizPassed = Boolean(quizResult?.passed);

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
      triggerToast(tr('Connexion réussie à votre Espace Artisan !', 'Welcome back to your Artisan Hub!'), '✓');
      onLoginSuccess(user);
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Create the artisan account once (step 1). Returns the normalized user or null. */
  const ensureAccount = async () => {
    if (account) return account;

    const isSingle = artisanType === 'SINGLE';
    const displayName = isSingle ? name.trim() : groupName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!displayName || !normalizedEmail) {
      triggerToast(tr("Veuillez renseigner le nom et l'email.", 'Please fill in your name and email.'), '⚠️');
      return null;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      triggerToast(
        tr(
          `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        ),
        '⚠️'
      );
      return null;
    }

    const [firstName, ...rest] = displayName.split(/\s+/);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          firstName,
          lastName: rest.join(' ') || (isSingle ? '-' : 'Atelier'),
          email: normalizedEmail,
          phone: phone.trim() || null,
          password,
          role: 'PROFESSIONAL',
          artisanType,
          groupName: isSingle ? undefined : groupName.trim(),
          groupSize: isSingle ? undefined : Number(teamSize) || 1,
          groupRegNum: isSingle ? undefined : regNum.trim(),
          profession: profession.trim() || tr('Artisan Général', 'General Artisan'),
          experience: Number(experience) || 0,
          location: city.trim() || undefined,
        },
      });
      const user = normalizeUser(data.data.user);
      saveSession(data.data.token, user);
      setAccount(user);
      return user;
    } catch (err) {
      triggerToast(
        err.status === 409
          ? tr(
              'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.',
              'An account with this email already exists. Please log in.'
            )
          : err.message,
        '⚠️'
      );
      return null;
    }
  };

  const refreshAndFinish = async (message, icon) => {
    const me = await api('/auth/me');
    const user = normalizeUser(me.data.user);
    triggerToast(message, icon);
    onLoginSuccess(user);
  };

  // Step 1 → 2: create the account, then continue with verification
  const handleStartVerification = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const user = await ensureAccount();
    setIsSubmitting(false);
    if (user) setWizardStep(2);
  };

  // Step 2 → 3: save trade details on the profile before the quiz
  const handleSaveTrade = async () => {
    if (!account?.professionalId) return;
    if (!profession.trim()) {
      triggerToast(tr('Indiquez votre métier.', 'Please enter your trade.'), '⚠️');
      return;
    }
    setIsSubmitting(true);
    try {
      await api(`/professionals/${account.professionalId}`, {
        method: 'PUT',
        body: { profession: profession.trim(), experience: Number(experience) || 0, serviceArea: city.trim() },
      });
      setWizardStep(3);
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unverified artisans can work right away, without the badge
  const handleSkipVerification = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const user = await ensureAccount();
      if (!user) return;
      await refreshAndFinish(
        tr(
          'Compte créé (Statut : Non Vérifié). Vous pouvez proposer vos services et vous faire vérifier à tout moment.',
          'Account created as Unverified. You can offer services right away and verify anytime.'
        ),
        '✓'
      );
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: attach identity documents to the quiz verification, then open the dashboard
  const handleCompleteVerification = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const verificationId = quizResult?.verificationId;
      const documents = [
        { documentType: artisanType === 'SINGLE' ? 'ID_CARD' : 'BUSINESS_REGISTRATION', fileUrl: idCardPhoto },
        { documentType: 'SELFIE', fileUrl: selfiePhoto },
        { documentType: 'CERTIFICATE', fileUrl: diplomaPhoto },
      ].filter((d) => d.fileUrl);

      if (verificationId) {
        for (const doc of documents) {
          await api(`/verifications/${verificationId}/upload-document`, { method: 'POST', body: doc });
        }
      }

      const message = isQuizPassed
        ? tr(
            `🎉 Félicitations ! Quiz réussi avec ${quizResult.scorePercent}%. Badge VÉRIFIÉ attribué !`,
            `🎉 Quiz passed with ${quizResult.scorePercent}%! Verified Badge awarded.`
          )
        : tr(
            'Profil enregistré. Repassez le quiz depuis votre tableau de bord pour obtenir le badge.',
            'Profile saved. Retake the quiz from your dashboard to earn the badge.'
          );
      await refreshAndFinish(message, isQuizPassed ? '🛡️' : '✓');
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-screen-wrapper artisan-theme relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ paddingTop: '60px' }}>
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
        <div className="auth-header text-center mb-2">
          <div className="auth-label" style={{ fontSize: '0.72rem', marginBottom: '0.1rem' }}>{t.forArtisans}</div>
          <h2 className="auth-title" style={{ fontSize: '1.2rem', margin: '0 0 0.15rem 0' }}>
            {tab === 'login'
              ? (lang === 'fr' ? 'Espace Pro & Collectifs' : 'Artisan Sign In')
              : (lang === 'fr' ? 'Rejoindre le Réseau d\'Artisans' : 'Artisan Registration')}
          </h2>
          <p className="auth-subtitle" style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
            {tab === 'login'
              ? (lang === 'fr' ? 'Accédez à votre tableau de bord et vos missions.' : 'Access your dashboard and client jobs.')
              : (lang === 'fr' ? 'Créez votre compte. Vérification IA optionnelle pour le Badge.' : 'Create your account. Optional AI verification for Verified Badge.')}
          </p>
        </div>

        <div className="tab-bar" style={{ marginBottom: '0.5rem', padding: '0.2rem' }}>
          <button
            className={`tab-item ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
          >
            {t.signIn}
          </button>
          <button
            className={`tab-item ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setWizardStep(1); }}
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
          >
            {t.createAccount}
          </button>
        </div>

        {/* LOGIN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-2">
            <div className="field">
              <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.emailOrPhone}</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  type="text"
                  className="input-field"
                  placeholder="pro@skillora.cm or +237 6xx xx xx xx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="field-row">
                <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.password}</label>
                <span className="forgot-link" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => setIsForgotModalOpen(true)}>
                  {t.forgotPass}
                </span>
              </div>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.45rem 2.2rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                  required
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn w-full" style={{ padding: '0.55rem', fontSize: '0.85rem' }} disabled={isSubmitting}>
              {isSubmitting ? (lang === 'fr' ? 'Connexion en cours...' : 'Signing in...') : `${t.signIn} →`}
            </button>
          </form>
        ) : (
          /* MULTI-STEP VERIFICATION WIZARD */
          <div>
            {/* Compact Step Indicators */}
            <div className="wizard-stepper compact-stepper">
              <div className="step-track">
                <div className="step-progress" style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}></div>
              </div>

              {[
                { num: 1, label: '1. Profil' },
                { num: 2, label: '2. Métier' },
                { num: 3, label: '3. Quiz IA' },
                { num: 4, label: '4. Documents' },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`step-node ${wizardStep === s.num ? 'active' : wizardStep > s.num ? 'completed' : ''}`}
                  onClick={() => { if (s.num <= wizardStep) setWizardStep(s.num); }}
                >
                  <div className="step-circle">{s.num}</div>
                  <span className="step-title">{s.label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: STRUCTURE & CREDENTIALS IN 2-COLUMN GRID */}
            {wizardStep === 1 && (
              <div>
                {/* Horizontal Low-Profile Radio Chips for Structure */}
                <div className="artisan-type-chips">
                  <button
                    type="button"
                    className={`type-chip ${artisanType === 'SINGLE' ? 'selected' : ''}`}
                    onClick={() => setArtisanType('SINGLE')}
                  >
                    <span>🧑‍🔧</span>
                    <span>{t.singleArtisan}</span>
                  </button>

                  <button
                    type="button"
                    className={`type-chip ${artisanType === 'GROUPED' ? 'selected' : ''}`}
                    onClick={() => setArtisanType('GROUPED')}
                  >
                    <span>👥🏢</span>
                    <span>{t.groupedArtisan}</span>
                  </button>
                </div>

                {artisanType === 'SINGLE' ? (
                  <div className="compact-form-grid">
                    <div className="field">
                      <label className="field-label" style={{ fontSize: '0.75rem' }}>{t.fullName}</label>
                      <div className="input-wrap">
                        <span className="input-icon">👤</span>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Emmanuel Ngu"
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
                          placeholder="pro@skillora.cm"
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
                ) : (
                  <div className="compact-form-grid">
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                      <label className="field-label" style={{ fontSize: '0.75rem' }}>🏢 {t.groupName}</label>
                      <div className="input-wrap">
                        <span className="input-icon">🏷️</span>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Atelier Élite Bâtiment & Énergie"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label" style={{ fontSize: '0.75rem' }}>👤 {t.leadName}</label>
                      <div className="input-wrap">
                        <span className="input-icon">⭐</span>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Jean-Paul Kamga"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label" style={{ fontSize: '0.75rem' }}>👥 {t.groupSize}</label>
                      <div className="input-wrap">
                        <span className="input-icon">🔢</span>
                        <input
                          type="number"
                          min="2"
                          max="100"
                          className="input-field"
                          value={teamSize}
                          onChange={(e) => setTeamSize(e.target.value)}
                          style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.8rem' }}
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
                          placeholder="pro@skillora.cm"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                )}

                {/* Inline Compact Verification Notice */}
                <div className="compact-notice-banner" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--border-gold)' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--gold-light)', margin: 0 }}>
                    💡 <strong>{lang === 'fr' ? 'Vérification Optionnelle :' : 'Optional Verification:'}</strong> {lang === 'fr' ? 'Passez les étapes pour décrocher le Badge (✓) ou commencez direct.' : 'Complete steps to get Verified Badge (✓) or skip to start right away.'}
                  </p>
                </div>

                {/* Side-by-Side Action Buttons */}
                <div className="compact-action-row">
                  <button type="button" className="btn-outline flex-1" onClick={handleSkipVerification} disabled={isSubmitting}>
                    {isSubmitting ? (lang === 'fr' ? 'Création...' : 'Creating...') : `⏩ ${lang === 'fr' ? 'Ignorer & Commencer' : 'Skip & Start'}`}
                  </button>
                  <button type="button" className="submit-btn flex-1" style={{ marginTop: 0 }} onClick={handleStartVerification} disabled={isSubmitting}>
                    🛡️ {lang === 'fr' ? 'Vérification IA →' : 'Start Verification →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: TRADE SEARCH & BEPC LEVEL AI QUIZ */}
            {wizardStep === 2 && (
              <div>
                <div className="field">
                  <label className="field-label">🔎 Rechercher & Sélectionner votre Métier / Spécialité</label>
                  <div className="input-wrap">
                    <span className="input-icon">🔍</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Tapez pour rechercher (ex: Électricien, Plombier, Menuisier, Climatiseur...)"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                    />
                  </div>
                </div>



                <div className="form-two-col">
                  <div className="field">
                    <label className="field-label">Années d'Expérience</label>
                    <div className="input-wrap">
                      <span className="input-icon">📋</span>
                      <input
                        type="number"
                        className="input-field"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Ville / Région au Cameroun</label>
                    <div className="input-wrap">
                      <span className="input-icon">📍</span>
                      <input
                        type="text"
                        className="input-field"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Douala & Yaoundé"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Presentation Video Capture (Live Camera) */}
                <VideoCapture
                  lang={lang}
                  triggerToast={triggerToast}
                  maxDuration={60}
                  onUploadSuccess={(url) => setVideoUrl(url)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setWizardStep(1)}>
                    {t.backStep}
                  </button>
                  <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={handleSaveTrade} disabled={isSubmitting}>
                    {videoUrl ? '✓ ' : ''}🧠 {tr('Étape 3 : Quiz Technique IA →', 'Step 3: AI Technical Quiz →')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AI TECHNICAL MCQ QUIZ ASSESSMENT (Automated 10 MCQs) */}
            {wizardStep === 3 && (
              <div>
                <VerificationQuiz
                  artisan={account}
                  profession={profession}
                  lang={lang}
                  triggerToast={triggerToast}
                  isModal={false}
                  onResult={(data) => setQuizResult(data)}
                  onComplete={() => setWizardStep(4)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setWizardStep(2)}>
                    {t.backStep}
                  </button>
                  <button
                    type="button"
                    className="submit-btn"
                    style={{ marginTop: 0 }}
                    onClick={() => setWizardStep(4)}
                  >
                    {isQuizPassed
                      ? (lang === 'fr' ? 'Étape 4 : Documents & Coffre-Fort (Quiz Validé ✓) →' : 'Step 4: Documents & Vault (Passed ✓) →')
                      : (lang === 'fr' ? 'Passer à l\'Étape 4 (Sans Badge) →' : 'Skip to Step 4 (No Badge) →')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROFESSIONAL DOCUMENTS & DECISION (Section 4 Step 4 & 5) */}
            {wizardStep === 4 && (
              <div>
                {/* 1. ID Card / Passport (Gallery or Camera) */}
                <div className="kyc-upload-card">
                  <div className="kyc-card-header">
                    <span className="kyc-icon">🪪</span>
                    <div>
                      <h4 className="kyc-title">
                        {artisanType === 'SINGLE' ? '1. CNI / Passeport (Pièce d\'Identité)' : '1. Registre RCCM / NIU de l\'Atelier'}
                      </h4>
                      <p className="kyc-desc">Prenez en photo recto/verso ou sélectionnez depuis vos fichiers</p>
                    </div>
                  </div>
                  <div className="kyc-picker-action-row">
                    <ImageCapturePicker
                      value={idCardPhoto}
                      onChange={(url) => setIdCardPhoto(url)}
                      triggerToast={triggerToast}
                      label="Pièce d'Identité / CNI"
                      aspectRatio="free"
                      buttonText={idCardPhoto ? "🔄 Modifier la photo CNI" : "📁 Galerie ou 📷 Photo CNI"}
                    />
                    {idCardPhoto && (
                      <div className="kyc-thumb-wrap">
                        <img src={idCardPhoto} alt="CNI" className="kyc-preview-img" />
                        <span className="kyc-check-tag">✓ {tr('Envoyé', 'Uploaded')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Live Selfie Camera Face Check */}
                <div className="kyc-upload-card">
                  <div className="kyc-card-header">
                    <span className="kyc-icon">🤳</span>
                    <div>
                      <h4 className="kyc-title">2. Selfie de Contrôle en Direct (Biométrie Faciale)</h4>
                      <p className="kyc-desc">Prenez un selfie net de votre visage pour valider la concordance avec la CNI</p>
                    </div>
                  </div>
                  <div className="kyc-picker-action-row">
                    <ImageCapturePicker
                      value={selfiePhoto}
                      onChange={(url) => setSelfiePhoto(url)}
                      triggerToast={triggerToast}
                      label="Selfie en direct"
                      aspectRatio="square"
                      buttonText={selfiePhoto ? "🔄 Reprendre le Selfie" : "📷 Prendre un Selfie en Direct"}
                    />
                    {selfiePhoto && (
                      <div className="kyc-thumb-wrap">
                        <img src={selfiePhoto} alt="Selfie" className="kyc-preview-img round" />
                        <span className="kyc-check-tag">✓ {tr('Envoyé', 'Uploaded')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Diplomas / Certificates / Portfolio */}
                <div className="kyc-upload-card">
                  <div className="kyc-card-header">
                    <span className="kyc-icon">📄</span>
                    <div>
                      <h4 className="kyc-title">
                        {artisanType === 'SINGLE' ? '3. Diplôme, Attestation ou Certificat de Qualification' : '3. Agréments Techniques & Agréations'}
                      </h4>
                      <p className="kyc-desc">Photo ou scan de vos attestations de formation</p>
                    </div>
                  </div>
                  <div className="kyc-picker-action-row">
                    <ImageCapturePicker
                      value={diplomaPhoto}
                      onChange={(url) => setDiplomaPhoto(url)}
                      triggerToast={triggerToast}
                      label="Certificat / Diplôme"
                      aspectRatio="free"
                      buttonText={diplomaPhoto ? "🔄 Modifier le document" : "📁 Galerie ou 📷 Photo Diplôme"}
                    />
                    {diplomaPhoto && (
                      <div className="kyc-thumb-wrap">
                        <img src={diplomaPhoto} alt="Diplôme" className="kyc-preview-img" />
                        <span className="kyc-check-tag">✓ {tr('Envoyé', 'Uploaded')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Decision Summary Box (Section 4 Step 5) */}
                <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold)', padding: '1.25rem', borderRadius: '12px', margin: '1.25rem 0' }}>
                  <h4 style={{ color: 'var(--gold-light)', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                    📊 {tr('Récapitulatif de votre vérification', 'Your verification summary')}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>
                      • {tr('Quiz technique', 'Technical quiz')} :{' '}
                      <strong style={{ color: isQuizPassed ? 'var(--artisan-accent)' : '#fff' }}>
                        {quizResult ? `${quizResult.scorePercent}% ${isQuizPassed ? '✓' : tr('(échoué)', '(failed)')}` : tr('Non passé', 'Not taken')}
                      </strong>
                    </div>
                    <div>
                      • {tr('Vidéo de présentation', 'Presentation video')} :{' '}
                      <strong style={{ color: '#fff' }}>{videoUrl ? tr('Envoyée', 'Uploaded') : tr('Non fournie', 'Not provided')}</strong>
                    </div>
                    <div>
                      • {tr('Pièce & selfie', 'ID & selfie')} :{' '}
                      <strong style={{ color: '#fff' }}>
                        {idCardPhoto && selfiePhoto ? tr("Envoyés — examen par l'équipe", 'Uploaded — team review') : tr('En attente', 'Pending')}
                      </strong>
                    </div>
                    <div>
                      • {tr('Badge', 'Badge')} :{' '}
                      <strong style={{ color: isQuizPassed ? 'var(--artisan-accent)' : '#fff' }}>
                        {isQuizPassed ? tr('Vérifié ✓', 'Verified ✓') : tr('Non vérifié', 'Not verified')}
                      </strong>
                    </div>
                  </div>
                  {!quizResult?.verificationId && (idCardPhoto || selfiePhoto || diplomaPhoto) && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
                      ℹ️ {tr('Passez le quiz (étape 3) pour joindre ces documents à votre dossier de vérification.', 'Take the quiz (step 3) to attach these documents to your verification file.')}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setWizardStep(3)} disabled={isSubmitting}>
                    {t.backStep}
                  </button>
                  <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={handleCompleteVerification} disabled={isSubmitting}>
                    {isSubmitting ? (lang === 'fr' ? 'Création et validation...' : 'Creating and verifying...') : tr('✓ Terminer & Ouvrir mon Espace Artisan →', '✓ Finish & Open My Artisan Hub →')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="switch-role-footer">
          <span>{lang === 'fr' ? 'Vous cherchez plutôt à embaucher des artisans ?' : 'Looking to hire verified professionals instead?'}</span>
          <span className="switch-role-link" onClick={onSwitchToClient}>
            {lang === 'fr' ? 'Accéder à l\'Espace Client →' : 'Switch to Client Portal →'}
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

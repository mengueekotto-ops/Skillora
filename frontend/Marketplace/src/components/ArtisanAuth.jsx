import React, { useState } from 'react';

export default function ArtisanAuth({ onSwitchToClient, onLoginSuccess, triggerToast, t, lang }) {
  const [tab, setTab] = useState('login');
  const [wizardStep, setWizardStep] = useState(1);
  
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
  
  // Step 2 & 3 state
  const [profession, setProfession] = useState('Master Electrician');
  const [experience, setExperience] = useState('7');
  const [city, setCity] = useState('Douala & Yaoundé');
  const [payoutMethod, setPayoutMethod] = useState('MTN');

  // Step 3: AI Technical Assessment Quiz State
  const [technicalAnswer1, setTechnicalAnswer1] = useState('I turn off the electricity at the main circuit breaker and verify there is no voltage using a calibrated multimeter before starting any work.');
  const [technicalAnswer2, setTechnicalAnswer2] = useState('Grounding provides a low-resistance path to earth for fault currents, while RCD/GFCI breakers instantly disconnect power when leakage is detected to protect human life.');
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [aiEvalResult, setAiEvalResult] = useState(null);

  // Upload status logs
  const [idLog, setIdLog] = useState('');
  const [cvLog, setCvLog] = useState('');
  const [videoLog, setVideoLog] = useState('');

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

  const simulateUpload = (setLog, label) => {
    setLog(lang === 'fr' ? 'Chiffrement et analyse IA en cours... ⏳' : 'Encrypting & AI analyzing document... ⏳');
    setTimeout(() => {
      setLog(lang === 'fr' ? '✓ Document vérifié par IA & stocké dans le coffre' : '✓ Document AI-checked & stored in vault');
      triggerToast(lang === 'fr' ? `${label} téléversé avec succès !` : `${label} uploaded successfully!`, '📄');
    }, 1000);
  };

  // Evaluate Technical Questions with AI (Section 9.1 & 15 of Spec)
  const handleAIEvaluation = async () => {
    setIsEvaluatingAI(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession,
          question: "What should you do before working on an electrical installation?",
          answer: technicalAnswer1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiEvalResult(data.result);
      } else {
        throw new Error('API offline');
      }
    } catch (err) {
      // Local intelligent evaluation simulation
      setAiEvalResult({
        score: 92,
        passed: true,
        feedback: lang === 'fr'
          ? "Excellente réponse : Vous avez correctement identifié l'obligation de consigner l'alimentation et de vérifier l'absence de tension (VAT)."
          : "The answer correctly identifies the need to isolate the electrical supply and verify absence of voltage with safety instruments.",
      });
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    triggerToast(lang === 'fr' ? 'Connexion réussie à votre Espace Artisan !' : 'Welcome back to your Artisan Hub!');
    onLoginSuccess({
      role: 'PROFESSIONAL',
      artisanType: 'Single Artisan (Master Specialist)',
      name: name || 'Emmanuel Ngu',
      email: email || 'emmanuel.pro@skillora.cm',
      phone: phone || '+237 675 42 10 99',
      city: 'Yaoundé (Bastos)',
      verificationStatus: 'verified',
      verifiedBadge: true,
      verificationScore: 92,
    });
  };

  // Skip Verification Handler (Section 2 & 3: Unverified Artisan can work without badge)
  const handleSkipVerification = () => {
    const isSingle = artisanType === 'SINGLE';
    const artisanName = isSingle ? (name || 'Artisan Indépendant') : (groupName || 'Atelier Groupé');
    triggerToast(
      lang === 'fr'
        ? 'Compte créé avec succès (Statut : Non Vérifié). Vous pouvez commencer à proposer vos services.'
        : 'Account created as Unverified. You can offer services right away and verify anytime.',
      '✓'
    );
    onLoginSuccess({
      role: 'PROFESSIONAL',
      artisanType: isSingle ? t.singleArtisan : `${t.groupedArtisan} (${groupName || 'Collectif'})`,
      name: artisanName,
      email: email || 'artisan@skillora.cm',
      phone: phone || '+237 670 99 88 77',
      city: city || 'Douala',
      verificationStatus: 'unverified',
      verifiedBadge: false,
      verificationScore: null,
    });
  };

  // Complete Verification Handler (Section 4 & 5: Passed with Verified Badge)
  const handleCompleteVerification = () => {
    const isSingle = artisanType === 'SINGLE';
    const artisanName = isSingle ? (name || 'Emmanuel Ngu') : (groupName || 'Atelier Élite');
    triggerToast(
      lang === 'fr'
        ? '🎉 Félicitations ! Votre vérification IA est validée avec 88%. Badge VÉRIFIÉ attribué !'
        : '🎉 Verification passed with 88%! Verified Badge (✓) successfully awarded.',
      '🛡️'
    );
    onLoginSuccess({
      role: 'PROFESSIONAL',
      artisanType: isSingle ? t.singleArtisan : `${t.groupedArtisan} (${groupName || 'Atelier'})`,
      name: artisanName,
      email: email || 'pro@skillora.cm',
      phone: phone || '+237 675 42 10 99',
      city: city || 'Yaoundé',
      verificationStatus: 'verified',
      verifiedBadge: true,
      verificationScore: 88,
    });
  };

  return (
    <div className="auth-wrapper artisan-theme wide">
      <div className="auth-panel">
        <div className="auth-header">
          <div className="auth-label">{t.forArtisans}</div>
          <h2 className="auth-title">
            {tab === 'login'
              ? (lang === 'fr' ? 'Espace Pro & Collectifs' : 'Artisan Sign In')
              : (lang === 'fr' ? 'Rejoindre le Réseau d\'Artisans' : 'Artisan Registration')}
          </h2>
          <p className="auth-subtitle">
            {tab === 'login'
              ? (lang === 'fr' ? 'Accédez à votre tableau de bord, vos missions et vos paiements FCFA.' : 'Access your dashboard, client jobs, and FCFA payouts.')
              : (lang === 'fr' ? 'Créez votre compte artisan. La vérification IA est optionnelle pour obtenir le Badge Vérifié.' : 'Create your artisan account. AI verification is optional to earn the Verified Badge.')}
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
            onClick={() => { setTab('signup'); setWizardStep(1); }}
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
                  placeholder="pro@skillora.cm or +237 6xx xx xx xx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="field-row">
                <label className="field-label">{t.password}</label>
                <span className="forgot-link" onClick={() => triggerToast(lang === 'fr' ? 'Lien de réinitialisation envoyé par SMS/Email' : 'Password reset link sent to your phone.')}>
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
          /* MULTI-STEP VERIFICATION WIZARD */
          <div>
            {/* Step Indicators */}
            <div className="wizard-stepper">
              <div className="step-track">
                <div className="step-progress" style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}></div>
              </div>

              {[
                { num: 1, label: '1. Profil & Compte' },
                { num: 2, label: '2. Métier & Vidéo' },
                { num: 3, label: '3. Quiz IA Technique' },
                { num: 4, label: '4. Documents Vault' },
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

            {/* STEP 1: STRUCTURE & CREDENTIALS */}
            {wizardStep === 1 && (
              <div>
                <div className="artisan-type-selector-box">
                  <label className="field-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                    🌟 {t.artisanTypeTitle}:
                  </label>

                  <div className="artisan-type-cards">
                    <div
                      className={`type-card ${artisanType === 'SINGLE' ? 'selected' : ''}`}
                      onClick={() => setArtisanType('SINGLE')}
                    >
                      <div className="type-card-header">
                        <span className="type-icon">🧑‍🔧</span>
                        <span className="type-badge">{artisanType === 'SINGLE' ? '● ' + (lang === 'fr' ? 'Sélectionné' : 'Selected') : '○'}</span>
                      </div>
                      <h4>{t.singleArtisan}</h4>
                      <p>{t.singleArtisanDesc}</p>
                    </div>

                    <div
                      className={`type-card ${artisanType === 'GROUPED' ? 'selected' : ''}`}
                      onClick={() => setArtisanType('GROUPED')}
                    >
                      <div className="type-card-header">
                        <span className="type-icon">👥🏢</span>
                        <span className="type-badge">{artisanType === 'GROUPED' ? '● ' + (lang === 'fr' ? 'Sélectionné' : 'Selected') : '○'}</span>
                      </div>
                      <h4>{t.groupedArtisan}</h4>
                      <p>{t.groupedArtisanDesc}</p>
                    </div>
                  </div>
                </div>

                {artisanType === 'SINGLE' ? (
                  <div className="field">
                    <label className="field-label">{t.fullName}</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Emmanuel Ngu"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="field">
                      <label className="field-label">🏢 {t.groupName}</label>
                      <div className="input-wrap">
                        <span className="input-icon">🏷️</span>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Atelier Élite Bâtiment & Énergie Cameroun"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-two-col">
                      <div className="field">
                        <label className="field-label">👤 {t.leadName}</label>
                        <div className="input-wrap">
                          <span className="input-icon">⭐</span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Jean-Paul Kamga"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="field">
                        <label className="field-label">👥 {t.groupSize}</label>
                        <div className="input-wrap">
                          <span className="input-icon">🔢</span>
                          <input
                            type="number"
                            min="2"
                            max="100"
                            className="input-field"
                            value={teamSize}
                            onChange={(e) => setTeamSize(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label">📋 {t.groupRegNum}</label>
                      <div className="input-wrap">
                        <span className="input-icon">🏛️</span>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. RC/DLA/2022/B/1458 - NIU: M05221458921"
                          value={regNum}
                          onChange={(e) => setRegNum(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-two-col">
                  <div className="field">
                    <label className="field-label">{t.email}</label>
                    <div className="input-wrap">
                      <span className="input-icon">✉</span>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="pro@skillora.cm"
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
                </div>

                <div className="field">
                  <label className="field-label">{t.password}</label>
                  <div className="input-wrap">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Optional Verification Notice Banner (Section 1 & 22) */}
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--border-gold)', padding: '1rem', borderRadius: '10px', margin: '1.25rem 0' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--gold-light)', margin: 0 }}>
                    💡 <strong>{lang === 'fr' ? 'Information de Vérification :' : 'Verification Notice:'}</strong> {lang === 'fr' ? 'La vérification est optionnelle. Vous pouvez continuer les étapes pour décrocher le Badge Vérifié (✓) ou ignorer pour commencer tout de suite.' : 'Verification is optional. Complete it to earn the Verified Badge (✓) and higher trust ranking, or skip to start immediately.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button type="button" className="btn-outline" onClick={handleSkipVerification}>
                    ⏩ {lang === 'fr' ? 'Ignorer & Commencer' : 'Skip & Start Unverified'}
                  </button>
                  <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={() => setWizardStep(2)}>
                    🛡️ {lang === 'fr' ? 'Vérification IA (Étape 2) →' : 'Start Verification (Step 2) →'}
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

                {/* BEPC Level AI Assessment Quiz Block */}
                <div style={{ background: 'rgba(62, 180, 137, 0.08)', border: '1px solid var(--artisan-border)', borderRadius: '12px', padding: '1.25rem', margin: '1.25rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ color: 'var(--artisan-accent)', fontSize: '0.95rem', margin: 0 }}>
                      🤖 Évaluation IA - Niveau Examen BEPC / CAP Technique
                    </h4>
                    <span style={{ background: 'var(--artisan-soft)', color: 'var(--artisan-accent)', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '50px' }}>
                      BEPC CONFORME
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    L'IA va évaluer vos connaissances fondamentales pratiques de niveau BEPC/CAP adaptées au métier "{profession}".
                  </p>

                  <button
                    type="button"
                    className="btn-outline-gold"
                    style={{ width: '100%' }}
                    onClick={handleAIEvaluation}
                    disabled={isEvaluatingAI}
                  >
                    {isEvaluatingAI ? '⏳ Évaluation BEPC par l\'IA en cours...' : `🧪 Démarrer l'Épreuve IA BEPC pour ${profession} →`}
                  </button>

                  {aiEvalResult && (
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-gold)', padding: '1rem', borderRadius: '10px', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                          Score Épreuve BEPC : {aiEvalResult.score}/100
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: aiEvalResult.passed ? 'var(--artisan-accent)' : 'var(--danger)' }}>
                          {aiEvalResult.passed ? '✓ BEPC VALIDÉ' : 'À AMÉLIORER'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-cream)', margin: 0 }}>
                        <strong>Feedback IA :</strong> {aiEvalResult.feedback}
                      </p>
                    </div>
                  )}
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

                {/* Step 2: Presentation Video Upload */}
                <div className="upload-zone" onClick={() => simulateUpload(setVideoLog, 'Vidéo de Présentation')}>
                  <div className="upload-icon">🎥</div>
                  <div className="upload-label">
                    {lang === 'fr' ? 'Vidéo de Présentation (1 minute)' : '1-Minute Video Presentation'}
                  </div>
                  <div className="upload-hint">
                    {lang === 'fr' ? 'Présentez-vous et montrez vos réalisations pour appuyer la vérification' : 'Demonstrate your identity and project expertise'}
                  </div>
                  {videoLog && <div className="upload-success-text">{videoLog}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setWizardStep(1)}>
                    {t.backStep}
                  </button>
                  <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={() => setWizardStep(3)}>
                    🧠 Étape 3 : Quiz Technique IA →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AI TECHNICAL QUESTIONS & EVALUATION (Section 4 Step 3 & Section 9.1) */}
            {wizardStep === 3 && (
              <div>
                <div style={{ background: 'rgba(62, 180, 137, 0.1)', border: '1px solid var(--artisan-border)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                  <h4 style={{ color: 'var(--artisan-accent)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                    🤖 Évaluation Technique Assistée par Gemini AI
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Répondez aux questions pratiques de sécurité et de diagnostic adaptées à votre métier ({profession}). Gemini évalue vos réponses selon notre barème technique.
                  </p>
                </div>

                <div className="field">
                  <label className="field-label">
                    Question 1 : Que devez-vous faire impérativement avant de commencer des travaux sur une installation ?
                  </label>
                  <textarea
                    className="luxury-textarea-full"
                    rows="3"
                    value={technicalAnswer1}
                    onChange={(e) => setTechnicalAnswer1(e.target.value)}
                  ></textarea>
                </div>

                <div className="field">
                  <label className="field-label">
                    Question 2 : Quel est le rôle de la mise à la terre et des disjoncteurs différentiels dans la sécurité ?
                  </label>
                  <textarea
                    className="luxury-textarea-full"
                    rows="3"
                    value={technicalAnswer2}
                    onChange={(e) => setTechnicalAnswer2(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="button"
                  className="btn-outline-gold"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  onClick={handleAIEvaluation}
                  disabled={isEvaluatingAI}
                >
                  {isEvaluatingAI ? '⏳ Évaluation par Gemini AI en cours...' : '🧪 Évaluer mes Réponses avec Gemini AI'}
                </button>

                {aiEvalResult && (
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-gold)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                        Résultat Score IA : {aiEvalResult.score}/100
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: aiEvalResult.passed ? 'var(--artisan-accent)' : 'var(--danger)' }}>
                        {aiEvalResult.passed ? '✓ VALIDÉ' : 'À AMÉLIORER'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-cream)', margin: 0 }}>
                      <strong>Feedback IA :</strong> {aiEvalResult.feedback}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setWizardStep(2)}>
                    {t.backStep}
                  </button>
                  <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={() => setWizardStep(4)}>
                    Étape 4 : Documents & Coffre-Fort →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROFESSIONAL DOCUMENTS & DECISION (Section 4 Step 4 & 5) */}
            {wizardStep === 4 && (
              <div>
                <div className="upload-zone" onClick={() => simulateUpload(setIdLog, 'Pièce d\'Identité / CNI')}>
                  <div className="upload-icon">🪪</div>
                  <div className="upload-label">
                    {artisanType === 'SINGLE' ? '1. CNI / Passeport (Vérification d\'Identité)' : '1. Registre Fiscal / RCCM / NIU de l\'Atelier'}
                  </div>
                  <div className="upload-hint">PDF, PNG, JPG (Chiffré dans le Coffre Skillora)</div>
                  {idLog && <div className="upload-success-text">{idLog}</div>}
                </div>

                <div className="upload-zone" onClick={() => simulateUpload(setCvLog, 'CV / Diplômes & Certifications')}>
                  <div className="upload-icon">📄</div>
                  <div className="upload-label">
                    {artisanType === 'SINGLE' ? '2. CV, Diplômes & Certificats Professionnels' : '2. Portfolio de l\'Équipe & Agréments Techniques'}
                  </div>
                  <div className="upload-hint">PDF format (Analyse de cohérence par IA)</div>
                  {cvLog && <div className="upload-success-text">{cvLog}</div>}
                </div>

                {/* Verification Decision Summary Box (Section 4 Step 5) */}
                <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold)', padding: '1.25rem', borderRadius: '12px', margin: '1.25rem 0' }}>
                  <h4 style={{ color: 'var(--gold-light)', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                    📊 Barème de Décision de Vérification Skillora
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>• Complétude du Profil : <strong style={{ color: '#fff' }}>90%</strong></div>
                    <div>• Évaluation Technique : <strong style={{ color: '#fff' }}>92%</strong></div>
                    <div>• Cohérence Documentaire : <strong style={{ color: '#fff' }}>90%</strong></div>
                    <div>• Score Global de Confiance : <strong style={{ color: 'var(--artisan-accent)' }}>88%</strong></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setWizardStep(3)}>
                    {t.backStep}
                  </button>
                  <button type="button" className="submit-btn" style={{ marginTop: 0 }} onClick={handleCompleteVerification}>
                    ✓ Valider & Décrocher le Badge Vérifié →
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
    </div>
  );
}

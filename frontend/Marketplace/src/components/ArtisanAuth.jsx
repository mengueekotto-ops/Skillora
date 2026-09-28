import React, { useState } from 'react';
import ImageCapturePicker from './ImageCapturePicker';
import VerificationQuiz from './VerificationQuiz';
import VideoCapture from './VideoCapture';
import ForgotPasswordModal from './ForgotPasswordModal';
import { api, normalizeUser, saveSession } from '../api';
import AuthShell, { AuthField, PasswordInput, StrengthMeter } from './AuthShell';

const MIN_PASSWORD_LENGTH = 8;

export default function ArtisanAuth({ initialTab, onSwitchToClient, onBackToLanding, onLoginSuccess, triggerToast, t, lang, setLang }) {
  const [tab, setTab] = useState(initialTab === 'signup' ? 'signup' : 'login');
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

  const TRADES = [
    'Électricien', 'Plombier', 'Menuisier', 'Maçon', 'Peintre', 'Soudeur', 'Carreleur', 'Climatisation & Froid',
    'Mécanicien', 'Technicien électroménager', 'Réparateur téléphones & ordinateurs', 'Couturier', 'Coiffeur',
    'Jardinier', 'Installateur solaire', 'Charpentier', 'Vitrier', 'Serrurier',
  ];

  const STEPS = [
    { num: 1, title: tr('Compte', 'Account'), hint: tr('Vos informations et votre accès', 'Your details and login') },
    { num: 2, title: tr('Métier & vidéo', 'Trade & video'), hint: tr('Spécialité, expérience, présentation de 60 s', 'Specialty, experience, 60 s intro') },
    { num: 3, title: tr('Quiz technique', 'Technical quiz'), hint: tr('10 questions — 60 % pour le badge', '10 questions — 60% for the badge') },
    { num: 4, title: tr('Documents', 'Documents'), hint: tr("Pièce d'identité, selfie, diplôme", 'ID, selfie, certificate') },
  ];

  const isSingle = artisanType === 'SINGLE';
  const locked = Boolean(account); // account already created: step-1 details can no longer change

  const stepAside =
    tab === 'signup' ? (
      <ol className="auth2-steps">
        {STEPS.map((s) => (
          <li key={s.num} className={wizardStep === s.num ? 'active' : wizardStep > s.num ? 'done' : ''}>
            <span className="num">{wizardStep > s.num ? '✓' : s.num}</span>
            <div>
              <strong>{s.title}</strong>
              <small>{s.hint}</small>
            </div>
          </li>
        ))}
      </ol>
    ) : null;

  const progress = (
    <div className="auth2-progress" aria-hidden="true">
      {STEPS.map((s) => (
        <span key={s.num} className={wizardStep >= s.num ? 'done' : ''} />
      ))}
    </div>
  );

  const stepHeader = (title, subtitle) => (
    <>
      {progress}
      <div className="auth2-step-head">
        <h1 className="auth2-title">{title}</h1>
        <span className="auth2-step-count">{tr(`Étape ${wizardStep} sur 4`, `Step ${wizardStep} of 4`)}</span>
      </div>
      <p className="auth2-subtitle">{subtitle}</p>
    </>
  );

  const passwordField = (
    <AuthField id="artisan-new-password" label={tr('Mot de passe', 'Password')}>
      <PasswordInput
        id="artisan-new-password"
        lang={lang}
        autoComplete="new-password"
        placeholder={tr('8 caractères minimum', 'At least 8 characters')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        show={showPass}
        onToggle={() => setShowPass(!showPass)}
        disabled={locked}
        minLength={8}
      />
    </AuthField>
  );

  const kycCard = (title, desc, value, setValue, aspect, label) => (
    <div className={`auth2-kyc-card ${value ? 'done' : ''}`}>
      <h4>{title}</h4>
      <p>{desc}</p>
      {value && <img src={value} alt={title} />}
      <ImageCapturePicker
        value={value}
        onChange={(url) => setValue(url)}
        triggerToast={triggerToast}
        lang={lang}
        label={label}
        aspectRatio={aspect}
        buttonText={value ? tr('🔄 Remplacer', '🔄 Replace') : tr('📁 Galerie ou 📷 Photo', '📁 Gallery or 📷 Photo')}
      />
      {value && <p>✓ {tr('Envoyé — examen par notre équipe', 'Uploaded — reviewed by our team')}</p>}
    </div>
  );

  return (
    <AuthShell
      lang={lang}
      setLang={setLang}
      onBack={onBackToLanding}
      wide={tab === 'signup'}
      aside={stepAside}
      tagline={tr('Espace artisan & ateliers', 'Artisans & workshops')}
    >
      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="auth2-form">
          <h1 className="auth2-title">{tr('Espace artisan', 'Artisan sign in')}</h1>
          <p className="auth2-subtitle">{tr('Gérez vos missions, vos paiements et votre profil.', 'Manage your jobs, payments and profile.')}</p>

          <AuthField
            id="artisan-email"
            label={tr('E-mail ou téléphone', 'Email or phone')}
            type="text"
            autoComplete="username"
            placeholder="pro@exemple.cm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthField
            id="artisan-password"
            label={tr('Mot de passe', 'Password')}
            extra={
              <button type="button" className="auth2-link" onClick={() => setIsForgotModalOpen(true)}>
                {tr('Mot de passe oublié ?', 'Forgot password?')}
              </button>
            }
          >
            <PasswordInput
              id="artisan-password"
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

          <button type="submit" className="auth2-btn" disabled={isSubmitting} style={{ marginTop: '8px' }}>
            {isSubmitting ? tr('Connexion…', 'Signing in…') : tr('Se connecter', 'Sign in')}
          </button>

          <p className="auth2-bottom">
            {tr('Nouveau sur Skillora ?', 'New to Skillora?')}
            <button type="button" className="auth2-link strong" onClick={() => { setTab('signup'); setWizardStep(1); }}>
              {tr('Créer un compte artisan', 'Create an artisan account')}
            </button>
          </p>

          <div className="auth2-divider" />
          <p className="auth2-role-switch">
            {tr('Vous cherchez un artisan ?', 'Looking to hire an artisan?')}
            <button type="button" className="auth2-link strong" onClick={onSwitchToClient}>
              {tr('Espace client →', 'Client space →')}
            </button>
          </p>
        </form>
      ) : (
        <div className="auth2-form">
          {/* STEP 1 — ACCOUNT */}
          {wizardStep === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartVerification();
              }}
            >
              {stepHeader(
                tr('Créer un compte artisan', 'Create an artisan account'),
                tr('Travaillez seul ou en atelier. La vérification est facultative mais vous donne le badge ✓.', 'Work solo or as a workshop. Verification is optional but earns you the ✓ badge.')
              )}

              <div className="auth2-segment" role="group" aria-label={tr("Type d'artisan", 'Artisan type')}>
                <button type="button" className={isSingle ? 'active' : ''} onClick={() => !locked && setArtisanType('SINGLE')} disabled={locked}>
                  🧑‍🔧 {tr('Artisan indépendant', 'Solo artisan')}
                </button>
                <button type="button" className={!isSingle ? 'active' : ''} onClick={() => !locked && setArtisanType('GROUPED')} disabled={locked}>
                  🏢 {tr('Atelier / groupe', 'Workshop / group')}
                </button>
              </div>

              <div className="auth2-grid">
                {isSingle ? (
                  <AuthField
                    id="artisan-name"
                    label={tr('Nom complet', 'Full name')}
                    type="text"
                    autoComplete="name"
                    placeholder="Emmanuel Ngu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={locked}
                    required
                  />
                ) : (
                  <>
                    <AuthField
                      id="artisan-group"
                      label={tr("Nom de l'atelier", 'Workshop name')}
                      type="text"
                      placeholder="Atelier Élite Bâtiment"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      disabled={locked}
                      required
                    />
                    <AuthField
                      id="artisan-lead"
                      label={tr('Responsable', 'Lead contact')}
                      type="text"
                      autoComplete="name"
                      placeholder="Jean-Paul Kamga"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={locked}
                    />
                    <AuthField
                      id="artisan-size"
                      label={tr("Nombre d'artisans", 'Team size')}
                      type="number"
                      min="2"
                      max="500"
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      disabled={locked}
                    />
                    <AuthField
                      id="artisan-reg"
                      label={tr('N° RCCM / NIU (facultatif)', 'Registration no. (optional)')}
                      type="text"
                      placeholder="RC/DLA/2024/B/1234"
                      value={regNum}
                      onChange={(e) => setRegNum(e.target.value)}
                      disabled={locked}
                    />
                  </>
                )}
                <AuthField
                  id="artisan-signup-email"
                  label={tr('E-mail', 'Email')}
                  type="email"
                  autoComplete="email"
                  placeholder="pro@exemple.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={locked}
                  required
                />
                <AuthField
                  id="artisan-phone"
                  label={tr('Téléphone (paiements Mobile Money)', 'Phone (Mobile Money payouts)')}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+237 6XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={locked}
                  required
                />
                <div className={isSingle ? '' : 'full'}>
                  {passwordField}
                  {!locked && <StrengthMeter {...strength} />}
                </div>
              </div>

              {locked ? (
                <p className="auth2-note">✓ {tr('Compte créé. Continuez la vérification ou ouvrez votre espace.', 'Account created. Continue verification or open your workspace.')}</p>
              ) : (
                <p className="auth2-note">
                  <strong>{tr('Vérification facultative :', 'Optional verification:')}</strong>{' '}
                  {tr('commencez tout de suite, ou passez les 3 étapes suivantes pour obtenir le badge vérifié.', 'start right away, or complete the next 3 steps to earn the verified badge.')}
                </p>
              )}

              <div className="auth2-actions">
                <button type="button" className="auth2-btn ghost" onClick={handleSkipVerification} disabled={isSubmitting}>
                  {tr('Commencer sans badge', 'Start without badge')}
                </button>
                <button type="submit" className="auth2-btn" disabled={isSubmitting}>
                  {isSubmitting ? tr('Création…', 'Creating…') : tr('Vérifier mon profil →', 'Verify my profile →')}
                </button>
              </div>

              <p className="auth2-bottom">
                {tr('Déjà inscrit ?', 'Already registered?')}
                <button type="button" className="auth2-link strong" onClick={() => setTab('login')}>
                  {tr('Se connecter', 'Sign in')}
                </button>
              </p>
            </form>
          )}

          {/* STEP 2 — TRADE & VIDEO */}
          {wizardStep === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveTrade();
              }}
            >
              {stepHeader(tr('Votre métier', 'Your trade'), tr('Ces informations apparaissent sur votre profil public.', 'This appears on your public profile.'))}

              <AuthField
                id="artisan-trade"
                label={tr('Métier / spécialité', 'Trade / specialty')}
                type="text"
                list="artisan-trades"
                placeholder={tr('ex : Électricien, Plombier, Menuisier…', 'e.g. Electrician, Plumber, Carpenter…')}
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
              />
              <datalist id="artisan-trades">
                {TRADES.map((trade) => (
                  <option key={trade} value={trade} />
                ))}
              </datalist>

              <div className="auth2-grid">
                <AuthField
                  id="artisan-exp"
                  label={tr("Années d'expérience", 'Years of experience')}
                  type="number"
                  min="0"
                  max="60"
                  placeholder="5"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
                <AuthField
                  id="artisan-city"
                  label={tr("Ville / zone d'intervention", 'City / service area')}
                  type="text"
                  placeholder="Douala, Akwa"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="auth2-label-row"><label>{tr('Vidéo de présentation (facultatif, 60 s max)', 'Presentation video (optional, 60 s max)')}</label></div>
              <div className="auth2-embed">
                <VideoCapture lang={lang} triggerToast={triggerToast} maxDuration={60} onUploadSuccess={(url) => setVideoUrl(url)} />
              </div>

              <div className="auth2-actions">
                <button type="button" className="auth2-btn ghost" onClick={() => setWizardStep(1)}>
                  ← {tr('Retour', 'Back')}
                </button>
                <button type="submit" className="auth2-btn" disabled={isSubmitting}>
                  {isSubmitting ? tr('Enregistrement…', 'Saving…') : tr('Continuer vers le quiz →', 'Continue to quiz →')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 — QUIZ */}
          {wizardStep === 3 && (
            <div>
              {stepHeader(tr('Quiz technique', 'Technical quiz'), tr('10 questions sur votre métier, 30 secondes chacune. 60 % pour obtenir le badge.', '10 questions about your trade, 30 seconds each. 60% earns the badge.'))}
              <div className="auth2-embed">
                <VerificationQuiz
                  artisan={account}
                  profession={profession}
                  lang={lang}
                  triggerToast={triggerToast}
                  isModal={false}
                  onResult={(data) => setQuizResult(data)}
                  onComplete={() => setWizardStep(4)}
                />
              </div>
              <div className="auth2-actions">
                <button type="button" className="auth2-btn ghost" onClick={() => setWizardStep(2)}>
                  ← {tr('Retour', 'Back')}
                </button>
                <button type="button" className="auth2-btn" onClick={() => setWizardStep(4)}>
                  {isQuizPassed ? tr('Continuer vers les documents →', 'Continue to documents →') : tr('Passer cette étape →', 'Skip this step →')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — DOCUMENTS */}
          {wizardStep === 4 && (
            <div>
              {stepHeader(tr('Vos documents', 'Your documents'), tr('Ils sont examinés par notre équipe et ne sont jamais affichés publiquement.', 'They are reviewed by our team and never shown publicly.'))}

              <div className="auth2-kyc">
                {kycCard(
                  isSingle ? tr("Pièce d'identité", 'ID card / passport') : tr('Registre RCCM / NIU', 'Business registration'),
                  tr('Recto verso, bien lisible', 'Front and back, clearly readable'),
                  idCardPhoto, setIdCardPhoto, 'free', tr("Pièce d'identité", 'ID document')
                )}
                {kycCard(
                  tr('Selfie', 'Selfie'),
                  tr('Visage bien visible, pour comparer avec la pièce', 'Face clearly visible, to match your ID'),
                  selfiePhoto, setSelfiePhoto, 'square', tr('Selfie', 'Selfie')
                )}
                {kycCard(
                  isSingle ? tr('Diplôme / certificat', 'Diploma / certificate') : tr('Agréments', 'Approvals'),
                  tr('Formation, attestation ou certification', 'Training, attestation or certification'),
                  diplomaPhoto, setDiplomaPhoto, 'free', tr('Diplôme', 'Certificate')
                )}
              </div>

              <div className="auth2-summary">
                <div>{tr('Quiz technique', 'Technical quiz')} : <strong>{quizResult ? `${quizResult.scorePercent} % ${isQuizPassed ? '✓' : tr('(non réussi)', '(not passed)')}` : tr('non passé', 'not taken')}</strong></div>
                <div>{tr('Vidéo', 'Video')} : <strong>{videoUrl ? tr('envoyée', 'uploaded') : tr('non fournie', 'not provided')}</strong></div>
                <div>{tr('Documents', 'Documents')} : <strong>{[idCardPhoto, selfiePhoto, diplomaPhoto].filter(Boolean).length} / 3</strong></div>
                <div>{tr('Badge', 'Badge')} : <strong>{isQuizPassed ? tr('vérifié ✓', 'verified ✓') : tr('non vérifié', 'not verified')}</strong></div>
              </div>

              {!quizResult?.verificationId && (idCardPhoto || selfiePhoto || diplomaPhoto) && (
                <p className="auth2-note">ℹ️ {tr('Passez le quiz (étape 3) pour joindre ces documents à votre dossier de vérification.', 'Take the quiz (step 3) to attach these documents to your verification file.')}</p>
              )}

              <div className="auth2-actions">
                <button type="button" className="auth2-btn ghost" onClick={() => setWizardStep(3)} disabled={isSubmitting}>
                  ← {tr('Retour', 'Back')}
                </button>
                <button type="button" className="auth2-btn" onClick={handleCompleteVerification} disabled={isSubmitting}>
                  {isSubmitting ? tr('Finalisation…', 'Finishing…') : tr('Terminer et ouvrir mon espace →', 'Finish & open my workspace →')}
                </button>
              </div>
            </div>
          )}
        </div>
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

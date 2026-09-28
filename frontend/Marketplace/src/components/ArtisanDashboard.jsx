import React, { useState, useEffect, useCallback } from 'react';
import ImageCapturePicker from './ImageCapturePicker';
import VerificationQuiz from './VerificationQuiz';
import { BookingDialog } from './JobDialogs';
import { api, avatarFor, formatDate, formatFCFA, mapProfessional, mapRequest } from '../api';

const JOB_ACTIONS = {
  PENDING: [
    { status: 'ACCEPTED', fr: '✓ Accepter', en: '✓ Accept', cls: 'btn-primary-gold' },
    { status: 'REJECTED', fr: '✕ Refuser', en: '✕ Decline', cls: 'btn-cancel-action' },
  ],
  ACCEPTED: [
    { status: 'IN_PROGRESS', fr: '🛠️ Démarrer les travaux', en: '🛠️ Start work', cls: 'btn-primary-gold' },
    { status: 'CANCELLED', fr: '✕ Annuler', en: '✕ Cancel', cls: 'btn-cancel-action' },
  ],
};

const STATUS_LABELS = {
  PENDING: { fr: '🟡 Nouvelle demande', en: '🟡 New request' },
  ACCEPTED: { fr: '🟢 Acceptée', en: '🟢 Accepted' },
  IN_PROGRESS: { fr: '🛠️ En cours', en: '🛠️ In progress' },
  COMPLETED: { fr: '✓ Terminée', en: '✓ Completed' },
  REJECTED: { fr: '✕ Refusée', en: '✕ Declined' },
  CANCELLED: { fr: '✕ Annulée', en: '✕ Cancelled' },
};

export default function ArtisanDashboard({
  artisan,
  artisanId,
  isReadOnly = false,
  currentUser,
  userRole,
  onBack,
  walletBalance,
  onOpenWallet,
  onOpenSettings,
  triggerToast,
  t,
  lang
}) {
  const isFrench = lang === 'fr';
  const tr = (fr, en) => (isFrench ? fr : en);
  const profileId = artisanId || artisan?.id || currentUser?.professionalId || null;

  // The artisan viewing their own profile (never true for the client read-only view)
  const isOwnProfile =
    !isReadOnly &&
    currentUser?.role === 'PROFESSIONAL' &&
    Boolean(profileId) &&
    String(profileId) === String(currentUser.professionalId);
  const effectiveReadOnly = !isOwnProfile;
  const isCustomer = currentUser?.role === 'CUSTOMER';

  // Show the card data we already have immediately, then refresh from the API
  const [profile, setProfile] = useState(() => (artisan ? artisan : null));
  const [loadError, setLoadError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!profileId) return;
    try {
      const res = await api(`/professionals/${profileId}`, { auth: false });
      setProfile(mapProfessional(res.data));
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    }
  }, [profileId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Owner: incoming jobs
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [busyJobId, setBusyJobId] = useState(null);

  const loadJobs = useCallback(async () => {
    if (!isOwnProfile) return;
    setJobsLoading(true);
    try {
      const [reqRes, payRes] = await Promise.all([api('/requests'), api('/payments/history')]);
      const mine = (reqRes.data || []).filter(
        (r) => String(r.professionalId?._id || r.professionalId) === String(profileId)
      );
      setJobs(mine.map((r) => mapRequest(r, payRes.data || [])));
    } catch (err) {
      triggerToast?.(err.message, '⚠️');
    } finally {
      setJobsLoading(false);
    }
  }, [isOwnProfile, profileId, triggerToast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Client: bookmark state
  const [isFavorite, setIsFavorite] = useState(false);
  useEffect(() => {
    if (!isCustomer || !profileId) return;
    api('/bookmarks')
      .then((res) =>
        setIsFavorite((res.data || []).some((b) => String(b.professionalId?._id || b.professionalId) === String(profileId)))
      )
      .catch(() => {});
  }, [isCustomer, profileId]);

  // Scroll detection for collapsible solid header
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioImg, setNewPortfolioImg] = useState('');

  // New review form state
  const [newRating, setNewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 180);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const data = profile || {};
  const artisanName = data.name || currentUser?.name || '';
  const businessName = data.businessName || '';
  const primaryService = data.profession || tr('Artisan', 'Artisan');
  const locationText = data.city || tr('Localisation non précisée', 'Location not set');
  const yearsExperience = data.experience || '—';
  const phoneContact = data.phone || '';
  const whatsappNumber = data.whatsapp || '';
  const artisanRating = data.rating ? Number(data.rating).toFixed(1) : '—';
  const artisanReviewsCount = data.reviews || 0;
  const artisanBadge = data.verified ? tr('ARTISAN VÉRIFIÉ', 'VERIFIED ARTISAN') : tr('NON VÉRIFIÉ', 'NOT VERIFIED');
  const artisanStructure = data.isGrouped ? tr('Atelier Groupé', 'Workshop') : tr('Artisan Indépendant', 'Independent Artisan');
  const coverPhoto = data.coverPhoto;
  const galleryItems = data.gallery || [];
  const skills = data.skills || [];
  const reviews = (data.reviewList || []).map((r) => {
    const reviewer = r.customerId && typeof r.customerId === 'object' ? r.customerId : {};
    const reviewerName = `${reviewer.firstName || ''} ${reviewer.lastName ? `${reviewer.lastName[0]}.` : ''}`.trim() || tr('Client', 'Client');
    return {
      id: r._id,
      name: reviewerName,
      avatar: reviewer.profileImage || avatarFor(reviewerName),
      date: formatDate(r.createdAt, lang),
      rating: Math.round(r.rating || 0),
      comment: r.comment || '',
    };
  });

  const toggleFavorite = async () => {
    if (!isCustomer) {
      triggerToast?.(tr('Connectez-vous en tant que client pour ajouter des favoris.', 'Log in as a client to bookmark artisans.'), 'ℹ️');
      return;
    }
    try {
      const res = await api('/bookmarks/toggle', { method: 'POST', body: { professionalId: profileId } });
      setIsFavorite(res.isBookmarked);
      triggerToast?.(
        res.isBookmarked ? tr(`${artisanName} ajouté à vos favoris ❤️`, `${artisanName} added to favorites ❤️`) : tr('Retiré de vos favoris', 'Removed from favorites'),
        res.isBookmarked ? '❤️' : '🤍'
      );
    } catch (err) {
      triggerToast?.(err.message, '⚠️');
    }
  };

  const handleCall = () => {
    if (!phoneContact) return;
    window.location.href = `tel:${phoneContact.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      triggerToast?.(tr("Cet artisan n'a pas encore de numéro WhatsApp.", 'This artisan has no WhatsApp number yet.'), 'ℹ️');
      return;
    }
    const msg = encodeURIComponent(
      tr(
        `Bonjour ${artisanName}, je vous contacte depuis votre profil Skillora au sujet de vos prestations.`,
        `Hello ${artisanName}, I am contacting you from your Skillora profile regarding your services.`
      )
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank', 'noopener');
  };

  const handleShare = () => {
    const text = tr(`Découvrez le profil de ${artisanName} (${primaryService}) sur Skillora.`, `Check out ${artisanName} (${primaryService}) on Skillora.`);
    if (navigator.share) {
      navigator.share({ title: `${artisanName} - ${primaryService}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      triggerToast?.(tr('Présentation du profil copiée !', 'Profile summary copied!'), '🔗');
    }
  };

  const handleBookNow = () => {
    if (!isCustomer) {
      triggerToast?.(tr('Connectez-vous en tant que client pour réserver.', 'Log in as a client to book.'), 'ℹ️');
      return;
    }
    setShowBooking(true);
  };

  const saveProfile = async (changes, successMsg) => {
    try {
      const res = await api(`/professionals/${profileId}`, { method: 'PUT', body: changes });
      setProfile(mapProfessional({ ...res.data, userId: profile?.userId && typeof profile.userId === 'object' ? profile.userId : res.data.userId }));
      await loadProfile();
      if (successMsg) triggerToast?.(successMsg, '✓');
      return true;
    } catch (err) {
      triggerToast?.(err.message, '⚠️');
      return false;
    }
  };

  // The picker uploads through /upload/artisan-cover, which saves it on the profile
  const handleCoverPhotoChange = () => {
    if (effectiveReadOnly) return;
    loadProfile();
  };

  const toPortfolio = (items) => items.map(({ title, img }) => ({ title, img }));

  const handleAddPortfolioItem = async (e) => {
    e.preventDefault();
    if (effectiveReadOnly) return;
    if (!newPortfolioImg) {
      triggerToast?.(tr('Veuillez choisir ou prendre une photo', 'Please select or capture a photo'), '⚠️');
      return;
    }
    const item = { title: newPortfolioTitle.trim() || tr('Nouvelle réalisation', 'New project'), img: newPortfolioImg };
    const ok = await saveProfile(
      { portfolio: [item, ...toPortfolio(galleryItems)] },
      tr('Nouvelle photo ajoutée à votre galerie !', 'New project photo added to portfolio!')
    );
    if (ok) {
      setShowAddPortfolioModal(false);
      setNewPortfolioTitle('');
      setNewPortfolioImg('');
    }
  };

  const handleRemovePortfolioItem = async (id) => {
    if (effectiveReadOnly) return;
    if (!window.confirm(tr('Supprimer cette photo de votre galerie ?', 'Remove this photo from your portfolio?'))) return;
    await saveProfile(
      { portfolio: toPortfolio(galleryItems.filter((item) => item.id !== id)) },
      tr('Photo supprimée de la galerie', 'Photo removed from gallery')
    );
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) {
      triggerToast?.(tr('Veuillez écrire votre avis', 'Please write your review'), '⚠️');
      return;
    }
    setIsSending(true);
    try {
      await api('/reviews', {
        method: 'POST',
        body: { professionalId: profileId, rating: newRating, comment: newReviewComment.trim() },
      });
      setShowReviewModal(false);
      setNewReviewComment('');
      setNewRating(5);
      triggerToast?.(tr('Votre avis a été publié avec succès !', 'Review published successfully!'), '✓');
      loadProfile();
    } catch (err) {
      triggerToast?.(err.message, '⚠️');
    } finally {
      setIsSending(false);
    }
  };

  const handleJobAction = async (job, status) => {
    setBusyJobId(job.id);
    try {
      await api(`/requests/${job.id}`, { method: 'PUT', body: { status } });
      triggerToast?.(tr('Mission mise à jour.', 'Job updated.'), '✓');
      await loadJobs();
    } catch (err) {
      triggerToast?.(err.message, '⚠️');
    } finally {
      setBusyJobId(null);
    }
  };

  const activeJobs = jobs.filter((j) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status));
  const pastJobs = jobs.filter((j) => !['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(j.status)).slice(0, 10);

  if (!profile) {
    return (
      <div className="artisan-dashboard-container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)' }}>
          {loadError ? `⚠️ ${loadError}` : tr('Chargement du profil…', 'Loading profile…')}
        </p>
        {onBack && (
          <button type="button" className="btn-outline" onClick={onBack} style={{ marginTop: '1rem' }}>
            ← {tr('Retour', 'Back')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="artisan-dashboard-container">
      {/* 1. Header Navigation Bar (Floating & Collapsible into Solid App Bar) */}
      <header className={`artisan-custom-navbar ${isScrolled ? 'scrolled-solid' : 'floating-transparent'}`}>
        <div className="nav-action-left">
          <button
            type="button"
            className="round-nav-btn"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
            title={isFrench ? 'Retour au catalogue' : 'Back to search'}
          >
            ←
          </button>
        </div>

        {/* Collapsed Header Details (shown on scroll) */}
        {isScrolled && (
          <div className="scrolled-artisan-title-bar">
            <span className="scrolled-artisan-name">{artisanName}</span>
            <span className="scrolled-artisan-service">
              ★ {artisanRating} • {primaryService}
            </span>
          </div>
        )}

        <div className="nav-action-right">
          <button
            type="button"
            className={`round-nav-btn favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            title={isFrench ? 'Ajouter aux favoris' : 'Add to favorites'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </header>

      {/* READ-ONLY CLIENT BADGE BANNER */}
      {effectiveReadOnly && (
        <div className="read-only-client-banner">
          <div className="read-only-banner-content">
            <span className="read-only-badge-icon">{data.verified ? '🛡️' : '👤'}</span>
            <div>
              <strong>
                {data.verified
                  ? tr('PROFIL VÉRIFIÉ PAR SKILLORA', 'SKILLORA VERIFIED ARTISAN')
                  : tr('ARTISAN INDÉPENDANT', 'INDEPENDENT ARTISAN')}
              </strong>
              <span> • {tr('Paiement protégé par séquestre Skillora', 'Payment protected by Skillora escrow')}</span>
            </div>
          </div>
          <button type="button" className="btn-book-header-compact" onClick={handleBookNow}>
            📅 {isFrench ? 'Réserver' : 'Book Now'}
          </button>
        </div>
      )}

      {/* 2. Hero Media Section with Watermark Overlay */}
      <section className="artisan-hero-media">
        <img
          src={coverPhoto}
          alt={artisanName}
          className="artisan-cover-photo"
        />

        {/* STRICT READ-ONLY CHECK: Cover Photo Edit button ONLY for logged-in artisan on their own profile */}
        {!effectiveReadOnly && (
          <div className="cover-photo-edit-badge">
            <ImageCapturePicker
              value={coverPhoto}
              onChange={handleCoverPhotoChange}
              uploadPath="/upload/artisan-cover"
              triggerToast={triggerToast}
              label={isFrench ? "Photo de couverture de l'artisan" : "Artisan Cover Photo"}
              aspectRatio="banner"
              buttonText={isFrench ? "📷 Modifier Bannière" : "📷 Edit Cover"}
            />
          </div>
        )}

        {/* Verified Watermark Tag (Static & read-only for clients) */}
        {showWatermark && data.verified && (
          <div className="hero-watermark-tag">
            <span className="watermark-shield">🛡️</span>
            <span className="watermark-text">SKILLORA VERIFIED EXPERT • CAMEROON</span>
          </div>
        )}

        {/* Watermark toggle button ONLY for owner artisan */}
        {!effectiveReadOnly && data.verified && (
          <button
            type="button"
            className="watermark-toggle-btn"
            onClick={() => setShowWatermark(!showWatermark)}
            title="Toggle watermark overlay"
          >
            {showWatermark ? '👁️ Watermark: ON' : '👁️ Watermark: OFF'}
          </button>
        )}
      </section>

      {/* Main Content Body */}
      <div className="artisan-profile-layout">
        {/* 3. Profile Summary Card */}
        <div className="artisan-summary-card">
          <div className="summary-top-row">
            <div>
              <div className="lang-and-ratings-row">
                <div className="badge-lang-group">
                  <span className="lang-badge">EN</span>
                  <span className="lang-badge">FR</span>
                </div>
                <div className="star-rating-badge">
                  ★ {artisanRating} ({artisanReviewsCount} {isFrench ? 'Avis' : 'Reviews'})
                </div>
              </div>
              <h1 className="artisan-service-title">{primaryService}</h1>
              {businessName && businessName !== artisanName && (
                <p className="artisan-business-sub">{businessName}</p>
              )}
            </div>

            {/* STRICT READ-ONLY CHECK: Escrow Balance shortcut is ONLY displayed for the artisan themselves */}
            {!effectiveReadOnly ? (
              <div className="wallet-shortcut-box" onClick={onOpenWallet} title={isFrench ? 'Ouvrir portefeuille' : 'Open Wallet'}>
                <span className="wallet-mini-lbl">{tr('Gains cumulés', 'Total earnings')}</span>
                <span className="wallet-mini-val">{formatFCFA(walletBalance)}</span>
              </div>
            ) : (
              <div className="client-booking-shortcut-box">
                <span className="booking-status-tag">
                  {data.isAvailable ? `✓ ${tr('Disponible', 'Available')}` : `⏸ ${tr('Indisponible pour le moment', 'Currently unavailable')}`}
                </span>
                <button type="button" className="btn-primary-gold-book" onClick={handleBookNow}>
                  ⚡ {isFrench ? 'Demander un Devis' : 'Request Quote'}
                </button>
              </div>
            )}
          </div>

          <div className="artisan-subinfo-row">
            <span className="artisan-author-name">👤 {artisanName}</span>
            <span className="artisan-location-pin">📍 {locationText}</span>
            <span className="artisan-verified-pill">{data.verified ? '✓ ' : ''}{artisanBadge}</span>
            <span className="artisan-type-pill">🏢 {artisanStructure}</span>
          </div>
        </div>

        {/* OWNER: verification call-to-action */}
        {isOwnProfile && !data.verified && (
          <section className="dashboard-section-block">
            <div className="payment-security-banner">
              <div>
                <h2>🛡️ {tr('Obtenez le Badge Vérifié', 'Earn the Verified Badge')}</h2>
                <p>
                  {tr(
                    'Répondez à 10 questions sur votre métier (60% pour réussir). Les artisans vérifiés apparaissent dans le filtre « Vérifié » et inspirent davantage confiance.',
                    'Answer 10 questions about your trade (60% to pass). Verified artisans appear in the "Verified" filter and earn more trust.'
                  )}
                </p>
              </div>
              <button type="button" className="btn-primary-gold" onClick={() => setShowQuiz(true)}>
                {tr('Passer le quiz →', 'Take the quiz →')}
              </button>
            </div>
          </section>
        )}

        {/* OWNER: incoming jobs */}
        {isOwnProfile && (
          <section className="dashboard-section-block">
            <div className="section-header-flex">
              <div>
                <h2 className="section-title-sm">📋 {tr('Mes Missions', 'My Jobs')} ({activeJobs.length})</h2>
                <p className="section-subtitle-hint">
                  {tr('Acceptez les demandes, démarrez les travaux ; le client valide la fin et le paiement vous est versé.', 'Accept requests and start work; the client confirms completion and you get paid.')}
                </p>
              </div>
              <button type="button" className="btn-outline" onClick={loadJobs} disabled={jobsLoading}>
                🔄 {tr('Actualiser', 'Refresh')}
              </button>
            </div>

            {jobsLoading && jobs.length === 0 ? (
              <p className="section-subtitle-hint">{tr('Chargement…', 'Loading…')}</p>
            ) : activeJobs.length === 0 ? (
              <p className="section-subtitle-hint">{tr('Aucune mission en cours pour le moment.', 'No active jobs right now.')}</p>
            ) : (
              <div className="orders-stack-list">
                {activeJobs.map((job) => (
                  <div key={job.id} className="client-order-card">
                    <div className="order-header-row">
                      <div>
                        <span className="order-id-pill">{job.ref} • {tr(STATUS_LABELS[job.status].fr, STATUS_LABELS[job.status].en)}</span>
                        <h3 className="order-service-title">{job.description}</h3>
                        <p className="order-meta-info">
                          👤 <strong>{job.customerName || tr('Client', 'Client')}</strong> • 📍 {job.location || '—'} • 🕒 {formatDate(job.date, lang)}
                        </p>
                      </div>
                      <div className="order-amount-box">
                        {job.payment ? (
                          <>
                            <span className="amount-num">{formatFCFA(job.payment.artisanAmount)}</span>
                            <span className="escrow-locked-badge">
                              {job.escrowLocked ? `🔒 ${tr('Payé — en séquestre', 'Paid — in escrow')}` : `⏳ ${tr('Paiement en attente', 'Payment pending')}`}
                            </span>
                          </>
                        ) : (
                          <span className="escrow-locked-badge">{tr('Non payé', 'Not paid yet')}</span>
                        )}
                      </div>
                    </div>
                    <div className="order-actions-bar">
                      {job.customerWhatsapp && (
                        <button type="button" className="btn-whatsapp-action" onClick={() => window.open(`https://wa.me/${job.customerWhatsapp}`, '_blank', 'noopener')}>
                          💬 WhatsApp
                        </button>
                      )}
                      {(JOB_ACTIONS[job.status] || []).map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          className={action.cls}
                          disabled={busyJobId === job.id}
                          onClick={() => handleJobAction(job, action.status)}
                        >
                          {tr(action.fr, action.en)}
                        </button>
                      ))}
                      {job.status === 'IN_PROGRESS' && (
                        <span className="order-meta-info">⏳ {tr('En attente de la validation du client', 'Waiting for client confirmation')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pastJobs.length > 0 && (
              <details style={{ marginTop: '1rem' }}>
                <summary className="section-subtitle-hint" style={{ cursor: 'pointer' }}>
                  {tr('Historique', 'History')} ({pastJobs.length})
                </summary>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  {pastJobs.map((job) => (
                    <li key={job.id} className="order-meta-info">
                      {job.ref} — {job.description.slice(0, 60)} — {tr(STATUS_LABELS[job.status].fr, STATUS_LABELS[job.status].en)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        {/* 4. Skill Tags Section (Strictly Read-Only) */}
        <section className="dashboard-section-block">
          <h2 className="section-title-sm">{tr('Compétences & Spécialités', 'Skills & Specializations')}</h2>
          <div className="skill-pills-container">
            {skills.length === 0 ? (
              <span className="section-subtitle-hint">{tr('Aucune compétence renseignée.', 'No skills listed yet.')}</span>
            ) : (
              skills.map((skill, idx) => (
                <span key={idx} className="skill-pill-tag">
                  {skill}
                </span>
              ))
            )}
          </div>
        </section>

        {/* 5. About Section with Dynamic Description (Read-Only) */}
        <section className="dashboard-section-block">
          <h2 className="section-title-sm">{isFrench ? 'À Propos de l’Artisan' : 'About the Professional'}</h2>
          <div className="about-text-container">
            {data.bio ? (
              <p>{data.bio}</p>
            ) : (
              <p className="section-subtitle-hint">
                {isOwnProfile
                  ? tr('Ajoutez une présentation depuis ⚙️ Paramètres pour rassurer vos clients.', 'Add a bio from ⚙️ Settings to reassure your clients.')
                  : tr(`${artisanName} n'a pas encore rédigé de présentation.`, `${artisanName} has not written a bio yet.`)}
              </p>
            )}
          </div>
        </section>

        {/* 6. Experience & Contact Quick Action Bar (Strictly Read-Only Contact Options) */}
        <section className="dashboard-section-block">
          <div className="experience-display-bar">
            <span className="exp-label">{isFrench ? 'Expérience du Métier :' : 'Trade Experience:'}</span>
            <span className="exp-highlight">{yearsExperience}</span>
          </div>

          <div className="quick-action-row">
            {phoneContact && (
              <button type="button" className="quick-action-card-btn call-action" onClick={handleCall}>
                <span className="btn-action-icon">📞</span>
                <span className="btn-action-label">{isFrench ? 'Appeler' : 'Call'}</span>
                <span className="btn-action-sub">{phoneContact}</span>
              </button>
            )}

            <button type="button" className="quick-action-card-btn whatsapp-action" onClick={handleWhatsApp}>
              <span className="btn-action-icon">💬</span>
              <span className="btn-action-label">WhatsApp</span>
              <span className="btn-action-sub">{isFrench ? 'Chat Direct' : 'Direct Chat'}</span>
            </button>

            <button type="button" className="quick-action-card-btn share-action" onClick={handleShare}>
              <span className="btn-action-icon">📤</span>
              <span className="btn-action-label">{isFrench ? 'Partager' : 'Share'}</span>
              <span className="btn-action-sub">{isFrench ? 'Envoyer Profil' : 'Send Profile'}</span>
            </button>
          </div>
        </section>

        {/* 7. Gallery Grid (Read-Only for Clients; Edit & Delete strictly restricted to Artisan Owner) */}
        <section className="dashboard-section-block">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title-sm">
                {isFrench ? 'Galerie de Réalisations' : 'Portfolio Gallery'} <span className="gallery-counter">({galleryItems.length} photos)</span>
              </h2>
              <p className="section-subtitle-hint">
                {isFrench ? 'Photos réelles des chantiers et interventions de cet artisan' : 'Real project photos from this artisan’s worksites'}
              </p>
            </div>

            {/* STRICT READ-ONLY CHECK: Add Photo button is ONLY visible to the artisan owner */}
            {!effectiveReadOnly && (
              <button
                type="button"
                className="btn-add-portfolio-trigger"
                onClick={() => setShowAddPortfolioModal(true)}
              >
                ➕ {isFrench ? 'Ajouter une Réalisation' : 'Add Project Photo'}
              </button>
            )}
          </div>

          {galleryItems.length === 0 && (
            <p className="section-subtitle-hint">
              {isOwnProfile
                ? tr('Ajoutez des photos de vos chantiers pour convaincre vos futurs clients.', 'Add photos of your work to win new clients.')
                : tr('Aucune réalisation publiée pour le moment.', 'No portfolio photos yet.')}
            </p>
          )}

          <div className="gallery-two-col-grid">
            {galleryItems.map((item) => (
              <div key={item.id} className="gallery-item-card">
                <div className="gallery-img-wrapper">
                  <img src={item.img} alt={item.title} loading="lazy" />

                  {/* STRICT READ-ONLY CHECK: Delete button is ONLY visible to the artisan owner */}
                  {!effectiveReadOnly && (
                    <button
                      type="button"
                      className="gallery-delete-btn"
                      onClick={() => handleRemovePortfolioItem(item.id, item.title)}
                      title={isFrench ? "Supprimer cette photo" : "Delete photo"}
                    >
                      🗑️
                    </button>
                  )}

                  <div className="gallery-item-overlay">
                    <span className="gallery-item-title">{item.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Reviews List & Review Submission for Clients */}
        <section className="dashboard-section-block">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title-sm">{isFrench ? 'Avis & Témoignages Clients' : 'Client Reviews'}</h2>
              <p className="reviews-sub-count">
                ★ {artisanRating} • {reviews.length} {tr('avis de clients ayant réservé', 'reviews from booked clients')}
              </p>
            </div>

            {isCustomer && (
              <button
                type="button"
                className="btn-write-review"
                onClick={() => setShowReviewModal(true)}
              >
                ✍️ {isFrench ? 'Rédiger un Avis' : 'Write a Review'}
              </button>
            )}
          </div>

          {reviews.length === 0 && (
            <p className="section-subtitle-hint">{tr('Pas encore d’avis.', 'No reviews yet.')}</p>
          )}

          <div className="reviews-vertical-list">
            {reviews.map((rev) => (
              <div key={rev.id} className="review-card-item">
                <div className="review-header">
                  <img src={rev.avatar} alt={rev.name} className="reviewer-avatar" />
                  <div className="reviewer-info">
                    <h4 className="reviewer-name">{rev.name}</h4>
                    <span className="review-date">{rev.date}</span>
                  </div>
                  <div className="reviewer-stars">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>
                <p className="review-comment-text">{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Client Floating Action CTA (Sticky at bottom for clients) */}
        {effectiveReadOnly && (
          <div className="client-sticky-cta-bar">
            <div className="cta-artisan-info">
              <span className="cta-name">{artisanName}</span>
              <span className="cta-price">{data.priceRate || tr('Sur devis', 'On quote')}</span>
            </div>
            <div className="cta-actions-group">
              <button type="button" className="btn-cta-whatsapp" onClick={handleWhatsApp}>
                💬 WhatsApp
              </button>
              <button type="button" className="btn-cta-book" onClick={handleBookNow}>
                📅 {isFrench ? 'Réserver cette prestation' : 'Book Service'} →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Submission Modal (Client Interaction) */}
      {showReviewModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>{isFrench ? `Donner votre avis sur ${artisanName}` : `Review ${artisanName}`}</h3>
              <button type="button" className="close-btn" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddReview}>
              <p className="modal-subtext">
                {tr(
                  'Seuls les clients ayant une mission terminée avec cet artisan peuvent laisser un avis (un avis par mission).',
                  'Only clients with a completed job with this artisan can review (one review per job).'
                )}
              </p>

              <div className="form-group-item">
                <label>{isFrench ? 'Note d’évaluation' : 'Rating Score'}</label>
                <div className="stars-picker-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star-choice ${star <= newRating ? 'active' : ''}`}
                      onClick={() => setNewRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group-item">
                <label>{isFrench ? 'Votre commentaire détaillé' : 'Your Detailed Feedback'}</label>
                <textarea
                  rows="4"
                  placeholder={isFrench ? 'Qualité du travail, ponctualité, propreté...' : 'Work quality, punctuality, cleanliness...'}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="modal-text-input"
                  required
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowReviewModal(false)}
                >
                  {isFrench ? 'Annuler' : 'Cancel'}
                </button>
                <button type="submit" className="submit-review-action-btn" disabled={isSending}>
                  {isSending ? tr('Envoi…', 'Sending…') : `${tr('Publier mon avis', 'Submit Review')} ✓`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Portfolio Realization Modal (ONLY FOR ARTISAN OWNER) */}
      {!effectiveReadOnly && showAddPortfolioModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowAddPortfolioModal(false)}>
          <div className="portfolio-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-title-with-icon">
                <span className="modal-icon-badge">📸</span>
                <div>
                  <h3>{isFrench ? 'Ajouter une Réalisation' : 'Add Project Work'}</h3>
                  <p className="modal-subtext">
                    {isFrench ? 'Sélectionnez depuis votre galerie ou prenez une photo en direct du chantier' : 'Pick from your device gallery or snap a photo directly from your worksite'}
                  </p>
                </div>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowAddPortfolioModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddPortfolioItem}>
              <div className="form-group-item">
                <label>{isFrench ? 'Titre de la Réalisation / Intervention' : 'Project / Job Title'}</label>
                <input
                  type="text"
                  placeholder={isFrench ? 'ex: Pose Tuyauterie Inox & Ballon Solaire Bastos' : 'e.g. Copper Piping Installation'}
                  value={newPortfolioTitle}
                  onChange={(e) => setNewPortfolioTitle(e.target.value)}
                  className="modal-text-input"
                  required
                />
              </div>

              <div className="form-group-item">
                <label>{isFrench ? 'Photo de la Réalisation (Galerie ou Caméra)' : 'Work Photo (Gallery or Camera)'}</label>
                <ImageCapturePicker
                  value={newPortfolioImg}
                  onChange={(url) => setNewPortfolioImg(url)}
                  triggerToast={triggerToast}
                  label={isFrench ? "Photo de réalisation" : "Project Photo"}
                  aspectRatio="free"
                  buttonText={isFrench ? "📁 Galerie ou 📷 Caméra" : "📁 Gallery or 📷 Camera"}
                />
              </div>

              {newPortfolioImg && (
                <div className="portfolio-modal-preview-card">
                  <img src={newPortfolioImg} alt="Preview" className="portfolio-preview-thumb" />
                  <span className="portfolio-preview-ok">✓ {isFrench ? 'Photo sélectionnée' : 'Photo ready'}</span>
                </div>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddPortfolioModal(false)}
                >
                  {isFrench ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="submit-portfolio-action-btn"
                  disabled={!newPortfolioImg}
                >
                  {isFrench ? 'Ajouter au Portfolio' : 'Add to Portfolio'} ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBooking && (
        <BookingDialog
          artisan={data}
          defaultLocation={currentUser?.city || ''}
          tr={tr}
          onClose={() => setShowBooking(false)}
          onBooked={() => {
            setShowBooking(false);
            triggerToast?.(tr('Suivez votre demande dans « Mes Réservations ».', 'Track your request in "My Orders".'), '📋');
          }}
          triggerToast={triggerToast}
        />
      )}

      {showQuiz && (
        <VerificationQuiz
          artisan={{ professionalId: profileId }}
          profession={data.profession}
          lang={lang}
          triggerToast={triggerToast}
          isModal
          onClose={() => {
            setShowQuiz(false);
            loadProfile();
          }}
        />
      )}
    </div>
  );
}

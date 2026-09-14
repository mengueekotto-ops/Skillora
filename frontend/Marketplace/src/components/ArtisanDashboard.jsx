import React, { useState, useEffect } from 'react';
import ImageCapturePicker from './ImageCapturePicker';

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

  // Determine if this is the artisan viewing their own profile or a client viewing read-only
  const isOwnProfile =
    !isReadOnly &&
    currentUser &&
    (currentUser.role === 'PROFESSIONAL' || userRole === 'PROFESSIONAL') &&
    (!artisan || !artisan.id || artisan.id === currentUser.id || artisan.userId === currentUser.id);

  // Strict read-only mode for client view
  const effectiveReadOnly = isReadOnly || !isOwnProfile;

  // Local state for dynamically fetched artisan data if artisanId is provided
  const [loadedArtisan, setLoadedArtisan] = useState(artisan || null);

  // Fetch dynamic artisan data if ID is passed
  useEffect(() => {
    if (artisan) {
      setLoadedArtisan(artisan);
    } else if (artisanId) {
      fetch(`/api/professionals/${artisanId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.data) {
            setLoadedArtisan(data.data);
          }
        })
        .catch(() => {});
    }
  }, [artisan, artisanId]);

  const effectiveData = loadedArtisan || currentUser || {};

  // Scroll detection for collapsible solid header
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);

  // Default fallback gallery
  const defaultGallery = [
    { id: 1, title: isFrench ? 'Rénovation Salle de Bain de Luxe' : 'Luxury Bathroom Renovation', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: isFrench ? 'Centrale de Chauffage Villa Bastos' : 'Villa Heating Central System', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: isFrench ? 'Installation Tuyauterie Inox Industrielle' : 'Industrial Stainless Steel Piping', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
    { id: 4, title: isFrench ? 'Raccordement Chauffe-eau Solaire' : 'Solar Water Heater Installation', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' },
    { id: 5, title: isFrench ? 'Système de Pompage et Filtration' : 'Water Pumping & Filtration Unit', img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80' },
    { id: 6, title: isFrench ? 'Pose Colonne de Douche Italienne' : 'Walk-in Shower Fixture Mounting', img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80' },
    { id: 7, title: isFrench ? 'Diagnostic Caméra Réseau Enterré' : 'Underground Pipe Inspection Camera', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80' },
    { id: 8, title: isFrench ? 'Réseau Incendie Armé (RIA)' : 'Fire Hydrant & Safety Hose Line', img: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80' },
    { id: 9, title: isFrench ? 'Adoucisseur d’Eau Résidentiel' : 'Residential Water Softener Tank', img: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80' },
    { id: 10, title: isFrench ? 'Robinetterie encastrée design' : 'Concealed Designer Wall Taps', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80' }
  ];

  // Cover photo & Portfolio state
  const [coverPhoto, setCoverPhoto] = useState(
    effectiveData?.coverPhoto ||
      effectiveData?.image ||
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=85'
  );
  const [galleryItems, setGalleryItems] = useState(
    effectiveData?.gallery && effectiveData.gallery.length > 0 ? effectiveData.gallery : defaultGallery
  );

  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioImg, setNewPortfolioImg] = useState('');

  // New review form state
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Update cover and gallery when effectiveData updates
  useEffect(() => {
    if (effectiveData?.coverPhoto || effectiveData?.image) {
      setCoverPhoto(effectiveData.coverPhoto || effectiveData.image);
    }
    if (effectiveData?.gallery && effectiveData.gallery.length > 0) {
      setGalleryItems(effectiveData.gallery);
    }
  }, [effectiveData]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 180) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Profile data computed dynamically
  const artisanName = effectiveData?.name || effectiveData?.fullName || (effectiveData?.firstName ? `${effectiveData.firstName} ${effectiveData.lastName || ''}` : 'Derreck plomb');
  const businessName = effectiveData?.businessName || (effectiveData?.profession ? `${effectiveData.profession} • ${artisanName}` : `${artisanName} Pro Services`);
  const primaryService = effectiveData?.profession || (isFrench ? 'Plomberie Sanitaire & Chauffage Industriel' : 'Sanitary Plumbing & Industrial Heating');
  const locationText = effectiveData?.city || effectiveData?.location || 'Yaoundé (Bastos)';
  const yearsExperience = effectiveData?.experience ? (typeof effectiveData.experience === 'number' ? `${effectiveData.experience} ans` : effectiveData.experience) : '05 ans';
  const phoneContact = effectiveData?.phone || '+237 699 88 77 66';
  const whatsappNumber = effectiveData?.whatsapp ? String(effectiveData.whatsapp).replace(/\+/g, '') : '237699887766';
  const artisanRating = effectiveData?.rating || 5.0;
  const artisanReviewsCount = effectiveData?.reviews || effectiveData?.reviewCount || 38;
  const artisanBadge = effectiveData?.badge || (effectiveData?.verified !== false ? 'PRO MASTER VÉRIFIÉ' : 'NOUVEAU PRO');
  const artisanStructure = effectiveData?.type || (effectiveData?.isWorkshop ? 'Atelier Groupé' : 'Single Artisan (Master Specialist)');

  // Skills
  const defaultSkills = isFrench
    ? ['Tuyauterie Cuivre & Multicouche', 'Dépannage Fuite d’Urgence', 'Chauffe-eau Solaire', 'Assainissement & Vidange', 'Robinetterie Luxe', 'Raccordement Haute Pression']
    : ['Copper & Multilayer Piping', 'Emergency Leak Repair', 'Solar Water Heaters', 'Sanitation & Drainage', 'Luxury Faucets & Fixtures', 'High Pressure Fitting'];
  const skills = Array.isArray(effectiveData?.skills) && effectiveData.skills.length > 0 ? effectiveData.skills : defaultSkills;

  // Reviews list
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Dr. Sophie Mbianda',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'Il y a 2 jours' : '2 days ago',
      rating: 5,
      comment: isFrench
        ? `Travail exceptionnel pour le raccordement complet de ma villa. ${artisanName} est ponctuel, méticuleux et très propre sur le chantier. Je recommande vivement !`
        : `Exceptional workmanship on the complete installation. ${artisanName} was punctual, meticulous, and kept the site clean. Highly recommended!`
    },
    {
      id: 2,
      name: 'Christian Kamga',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'Il y a 1 semaine' : '1 week ago',
      rating: 5,
      comment: isFrench
        ? 'Dépannage d’urgence un dimanche soir pour une grosse fuite sous dalle. Arrivé en 30 minutes, réparation impeccable avec garantie séquestre Skillora respectée.'
        : 'Emergency repair on a Sunday evening for a severe underground leak. Arrived within 30 minutes, flawless fix with Skillora escrow respected.'
    },
    {
      id: 3,
      name: 'Mireille Tchinda',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'Il y a 2 semaines' : '2 weeks ago',
      rating: 5,
      comment: isFrench
        ? 'Installation impeccable de notre chauffe-eau solaire et des mitigeurs thermostatiques. Excellent rapport qualité-prix en FCFA.'
        : 'Flawless setup of our solar water heater and thermostatic mixers. Great value for money in FCFA.'
    }
  ]);

  const toggleFavorite = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    if (triggerToast) {
      triggerToast(
        nextState
          ? (isFrench ? `${artisanName} ajouté à vos favoris ❤️` : `${artisanName} added to favorites ❤️`)
          : (isFrench ? 'Retiré de vos favoris' : 'Removed from favorites'),
        nextState ? '❤️' : '🤍'
      );
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${phoneContact.replace(/\s+/g, '')}`;
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      isFrench
        ? `Bonjour ${artisanName}, je vous contacte depuis votre profil certifié Skillora au sujet de vos prestations.`
        : `Hello ${artisanName}, I am contacting you from your certified Skillora profile regarding your services.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${artisanName} - ${primaryService}`,
        text: `Découvrez le profil certifié de ${artisanName} sur Skillora.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      if (triggerToast) {
        triggerToast(
          isFrench ? 'Lien du profil copié dans le presse-papiers !' : 'Profile link copied to clipboard!',
          '🔗'
        );
      }
    }
  };

  const handleBookNow = () => {
    if (triggerToast) {
      triggerToast(
        isFrench
          ? `Demande d'intervention envoyée à ${artisanName} !`
          : `Service booking request sent to ${artisanName}!`,
        '⭐'
      );
    }
  };

  const handleCoverPhotoChange = (newUrl) => {
    if (effectiveReadOnly) return;
    setCoverPhoto(newUrl);
    if (triggerToast) {
      triggerToast(isFrench ? 'Photo de couverture mise à jour !' : 'Cover photo updated!', '✓');
    }
  };

  const handleAddPortfolioItem = (e) => {
    e.preventDefault();
    if (effectiveReadOnly) return;
    if (!newPortfolioImg) {
      if (triggerToast) triggerToast(isFrench ? 'Veuillez choisir ou prendre une photo' : 'Please select or capture a photo', '⚠️');
      return;
    }

    const newItem = {
      id: Date.now(),
      title: newPortfolioTitle.trim() || (isFrench ? 'Nouvelle réalisation' : 'New Project Work'),
      img: newPortfolioImg
    };

    setGalleryItems([newItem, ...galleryItems]);
    setShowAddPortfolioModal(false);
    setNewPortfolioTitle('');
    setNewPortfolioImg('');
    if (triggerToast) triggerToast(isFrench ? 'Nouvelle photo ajoutée à votre galerie !' : 'New project photo added to portfolio!', '✓');
  };

  const handleRemovePortfolioItem = (id, title) => {
    if (effectiveReadOnly) return;
    setGalleryItems(galleryItems.filter((item) => item.id !== id));
    if (triggerToast) triggerToast(isFrench ? `Photo supprimée de la galerie` : `Photo removed from gallery`, '🗑️');
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newReviewComment.trim()) {
      if (triggerToast) triggerToast(isFrench ? 'Veuillez renseigner votre nom et votre avis' : 'Please provide your name and review', '⚠️');
      return;
    }

    const newRev = {
      id: Date.now(),
      name: newReviewerName.trim(),
      avatar: currentUser?.profileImage || currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'À l’instant' : 'Just now',
      rating: newRating,
      comment: newReviewComment.trim()
    };

    setReviews([newRev, ...reviews]);
    setShowReviewModal(false);
    setNewReviewerName('');
    setNewReviewComment('');
    if (triggerToast) triggerToast(isFrench ? 'Votre avis a été publié avec succès !' : 'Review published successfully!', '✓');
  };

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
            <span className="read-only-badge-icon">🛡️</span>
            <div>
              <strong>{isFrench ? 'PROFIL VÉRIFIÉ PAR SKILLORA' : 'SKILLORA VERIFIED ARTISAN PROFILE'}</strong>
              <span> • {isFrench ? 'Accès Client en Lecture Seule (Identité, Compétences & Séquestre Certifiés)' : 'Read-Only Client Access (Certified Identity & Escrow)'}</span>
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
              triggerToast={triggerToast}
              label={isFrench ? "Photo de couverture de l'artisan" : "Artisan Cover Photo"}
              aspectRatio="banner"
              buttonText={isFrench ? "📷 Modifier Bannière" : "📷 Edit Cover"}
            />
          </div>
        )}

        {/* Verified Watermark Tag (Static & read-only for clients) */}
        {showWatermark && (
          <div className="hero-watermark-tag">
            <span className="watermark-shield">🛡️</span>
            <span className="watermark-text">SKILLORA VERIFIED EXPERT • CAMEROON</span>
          </div>
        )}

        {/* Watermark toggle button ONLY for owner artisan */}
        {!effectiveReadOnly && (
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
                <span className="wallet-mini-lbl">{isFrench ? 'Solde Escrow' : 'Escrow Balance'}</span>
                <span className="wallet-mini-val">{(walletBalance || 0).toLocaleString()} FCFA</span>
              </div>
            ) : (
              <div className="client-booking-shortcut-box">
                <span className="booking-status-tag">✓ {isFrench ? 'Disponible Immédiatement' : 'Available Now'}</span>
                <button type="button" className="btn-primary-gold-book" onClick={handleBookNow}>
                  ⚡ {isFrench ? 'Demander un Devis' : 'Request Quote'}
                </button>
              </div>
            )}
          </div>

          <div className="artisan-subinfo-row">
            <span className="artisan-author-name">👤 {artisanName}</span>
            <span className="artisan-location-pin">📍 {locationText}</span>
            <span className="artisan-verified-pill">✓ {artisanBadge}</span>
            <span className="artisan-type-pill">🏢 {artisanStructure}</span>
          </div>
        </div>

        {/* 4. Skill Tags Section (Strictly Read-Only) */}
        <section className="dashboard-section-block">
          <h2 className="section-title-sm">{isFrench ? 'Compétences & Spécialités Certifiées' : 'Certified Skills & Specializations'}</h2>
          <div className="skill-pills-container">
            {skills.map((skill, idx) => (
              <span key={idx} className="skill-pill-tag">
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* 5. About Section with Dynamic Description (Read-Only) */}
        <section className="dashboard-section-block">
          <h2 className="section-title-sm">{isFrench ? 'À Propos de l’Artisan' : 'About the Professional'}</h2>
          <div className="about-text-container">
            {effectiveData?.bio ? (
              <p>{effectiveData.bio}</p>
            ) : isFrench ? (
              <p>
                Bonjour ! Je suis un <strong>{primaryService.toLowerCase()}</strong> certifié basé à <strong>{locationText}</strong>, spécialisé dans l’<strong>installation complète</strong> et les interventions techniques professionnelles. Grâce à une expertise de <strong>{yearsExperience}</strong> dans le bâtiment et la maintenance au Cameroun, j’assure des travaux soignés avec <strong>garantie décennale et séquestre sécurisé Skillora en Franc CFA</strong>.
              </p>
            ) : (
              <p>
                Welcome! I am a certified <strong>{primaryService}</strong> based in <strong>{locationText}</strong>, specializing in high-grade infrastructure and technical interventions. With <strong>{yearsExperience}</strong> of proven field experience, I provide reliable, top-quality services backed by the <strong>Skillora Escrow Guarantee in Franc CFA</strong>.
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
            <button type="button" className="quick-action-card-btn call-action" onClick={handleCall}>
              <span className="btn-action-icon">📞</span>
              <span className="btn-action-label">{isFrench ? 'Appeler' : 'Call'}</span>
              <span className="btn-action-sub">{phoneContact}</span>
            </button>

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
                ★ {artisanRating} • {reviews.length} {isFrench ? 'retours d’expérience vérifiés' : 'verified client reviews'}
              </p>
            </div>

            <button
              type="button"
              className="btn-write-review"
              onClick={() => setShowReviewModal(true)}
            >
              ✍️ {isFrench ? 'Rédiger un Avis' : 'Write a Review'}
            </button>
          </div>

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
              <span className="cta-price">{effectiveData?.priceRate || '15 000 FCFA / intervention'}</span>
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
              <div className="form-group-item">
                <label>{isFrench ? 'Votre Nom / Titre' : 'Your Name / Title'}</label>
                <input
                  type="text"
                  placeholder={currentUser?.name || (isFrench ? 'ex: Valérie M.' : 'e.g. Valerie M.')}
                  value={newReviewerName}
                  onChange={(e) => setNewReviewerName(e.target.value)}
                  className="modal-text-input"
                  required
                />
              </div>

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
                <button type="submit" className="submit-review-action-btn">
                  {isFrench ? 'Publier mon avis' : 'Submit Review'} ✓
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
    </div>
  );
}

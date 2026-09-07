import React, { useState, useEffect } from 'react';

export default function ArtisanDashboard({
  currentUser,
  walletBalance,
  onOpenWallet,
  onOpenSettings,
  triggerToast,
  t,
  lang
}) {
  const isFrench = lang === 'fr';

  // Scroll detection for collapsible solid header
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // New review form state
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

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

  // Profile data
  const artisanName = currentUser?.name || 'Derreck plomb';
  const primaryService = isFrench ? 'Plomberie Sanitaire & Chauffage Industriel' : 'Sanitary Plumbing & Industrial Heating';
  const locationText = currentUser?.city || 'Yaoundé (Bastos)';
  const yearsExperience = '05 ans';
  const phoneContact = currentUser?.phone || '+237 699 88 77 66';
  const whatsappNumber = '237699887766';

  // Skills
  const skills = isFrench
    ? ['Tuyauterie Cuivre & Multicouche', 'Dépannage Fuite d’Urgence', 'Chauffe-eau Solaire', 'Assainissement & Vidange', 'Robinetterie Luxe', 'Raccordement Haute Pression']
    : ['Copper & Multilayer Piping', 'Emergency Leak Repair', 'Solar Water Heaters', 'Sanitation & Drainage', 'Luxury Faucets & Fixtures', 'High Pressure Fitting'];

  // Gallery items (10 items)
  const galleryItems = [
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

  // Reviews list
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Dr. Sophie Mbianda',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'Il y a 2 jours' : '2 days ago',
      rating: 5,
      comment: isFrench
        ? 'Travail exceptionnel pour le raccordement complet de ma villa à Bastos. Derreck est ponctuel, méticuleux et très propre sur le chantier. Je recommande vivement !'
        : 'Exceptional workmanship on the complete plumbing of my villa in Bastos. Derreck was punctual, meticulous, and kept the site clean. Highly recommended!'
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
    },
    {
      id: 4,
      name: 'Cabinet BatiPro Sarl',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'Il y a 1 mois' : '1 month ago',
      rating: 5,
      comment: isFrench
        ? 'Partenaire fiable pour nos chantiers d’immeubles à Yaoundé. Respect strict des normes de pression hydraulique et des délais.'
        : 'Reliable subcontractor for our residential buildings in Yaoundé. Strict compliance with hydraulic standards and deadlines.'
    }
  ]);

  const toggleFavorite = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    triggerToast(
      nextState
        ? (isFrench ? 'Ajouté à vos artisans favoris ❤️' : 'Added to favorite artisans ❤️')
        : (isFrench ? 'Retiré de vos favoris' : 'Removed from favorites'),
      nextState ? '❤️' : '🤍'
    );
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
      triggerToast(
        isFrench ? 'Lien du profil copié dans le presse-papiers !' : 'Profile link copied to clipboard!',
        '🔗'
      );
    }
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newReviewComment.trim()) {
      triggerToast(isFrench ? 'Veuillez renseigner votre nom et votre avis' : 'Please provide your name and review', '⚠️');
      return;
    }

    const newRev = {
      id: Date.now(),
      name: newReviewerName.trim(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      date: isFrench ? 'À l’instant' : 'Just now',
      rating: newRating,
      comment: newReviewComment.trim()
    };

    setReviews([newRev, ...reviews]);
    setShowReviewModal(false);
    setNewReviewerName('');
    setNewReviewComment('');
    triggerToast(isFrench ? 'Votre avis a été publié avec succès !' : 'Review published successfully!', '✓');
  };

  return (
    <div className="artisan-dashboard-container">
      {/* 1. Header Navigation Bar (Floating & Collapsible into Solid App Bar) */}
      <header className={`artisan-custom-navbar ${isScrolled ? 'scrolled-solid' : 'floating-transparent'}`}>
        <div className="nav-action-left">
          <button
            className="round-nav-btn"
            onClick={() => window.history.back()}
            title={isFrench ? 'Retour' : 'Back'}
          >
            ←
          </button>
        </div>

        {/* Collapsed Header Details (shown on scroll) */}
        {isScrolled && (
          <div className="scrolled-artisan-title-bar">
            <span className="scrolled-artisan-name">{artisanName}</span>
            <span className="scrolled-artisan-service">
              ★ 5.0 • {primaryService}
            </span>
          </div>
        )}

        <div className="nav-action-right">
          <button
            className={`round-nav-btn favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            title={isFrench ? 'Ajouter aux favoris' : 'Add to favorites'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </header>

      {/* 2. Hero Media Section with Watermark Overlay */}
      <section className="artisan-hero-media">
        <img
          src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=85"
          alt="Artisan in action"
          className="artisan-cover-photo"
        />

        {showWatermark && (
          <div className="hero-watermark-tag">
            <span className="watermark-shield">🛡️</span>
            <span className="watermark-text">SKILLORA VERIFIED EXPERT • CAMEROON</span>
          </div>
        )}

        <button
          className="watermark-toggle-btn"
          onClick={() => setShowWatermark(!showWatermark)}
          title="Toggle watermark overlay"
        >
          {showWatermark ? '👁️ Watermark: ON' : '👁️ Watermark: OFF'}
        </button>
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
                  ★ 5.0 ({reviews.length} {isFrench ? 'Avis' : 'Reviews'})
                </div>
              </div>
              <h1 className="artisan-service-title">{primaryService}</h1>
            </div>

            <div className="wallet-shortcut-box" onClick={onOpenWallet} title={isFrench ? 'Ouvrir portefeuille' : 'Open Wallet'}>
              <span className="wallet-mini-lbl">{isFrench ? 'Solde Escrow' : 'Escrow Balance'}</span>
              <span className="wallet-mini-val">{(walletBalance || 0).toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="artisan-subinfo-row">
            <span className="artisan-author-name">👤 {artisanName}</span>
            <span className="artisan-location-pin">📍 {locationText}</span>
            <span className="artisan-verified-pill">✓ {isFrench ? 'Identité & Compétence Vérifiée' : 'AI Verified Pro'}</span>
          </div>
        </div>

        {/* 4. Skill Tags Section */}
        <section className="dashboard-section-block">
          <h2 className="section-title-sm">{isFrench ? 'Compétences & Spécialités' : 'Skills & Specializations'}</h2>
          <div className="skill-pills-container">
            {skills.map((skill, idx) => (
              <span key={idx} className="skill-pill-tag">
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* 5. About Section with Dynamic Bolding */}
        <section className="dashboard-section-block">
          <h2 className="section-title-sm">{isFrench ? 'À Propos de l’Artisan' : 'About the Professional'}</h2>
          <div className="about-text-container">
            {isFrench ? (
              <p>
                Bonjour ! Je suis un <strong>plombier professionnel</strong> certifié basé à <strong>Yaoundé</strong>, spécialisé dans l’<strong>installation complète</strong> de réseaux sanitaires haute pression et les systèmes de distribution d'eau modernes. Grâce à une expertise éprouvée dans le bâtiment résidentiel et industriel, j’assure le <strong>dépannage d'urgence sous 45 minutes</strong>, la pose de <strong>chauffe-eau solaire</strong> et la rénovation intégrale de salles d'eau avec <strong>garantie décennale et séquestre sécurisé Skillora en Franc CFA</strong>.
              </p>
            ) : (
              <p>
                Welcome! I am a certified <strong>professional plumber</strong> based in <strong>Yaoundé</strong>, specializing in the <strong>complete installation</strong> of modern high-pressure sanitary networks and water distribution systems. With hands-on expertise in residential and commercial infrastructure, I provide <strong>emergency leak fixes within 45 minutes</strong>, solar water heating setup, and turnkey bathroom remodels backed by the <strong>Skillora Escrow Guarantee in Franc CFA</strong>.
              </p>
            )}
          </div>
        </section>

        {/* 6. Experience & Quick Action Bar */}
        <section className="dashboard-section-block">
          <div className="experience-display-bar">
            <span className="exp-label">{isFrench ? 'Expérience du Métier :' : 'Trade Experience:'}</span>
            <span className="exp-highlight">{yearsExperience}</span>
          </div>

          <div className="quick-action-row">
            <button className="quick-action-card-btn call-action" onClick={handleCall}>
              <span className="btn-action-icon">📞</span>
              <span className="btn-action-label">{isFrench ? 'Appeler' : 'Call'}</span>
              <span className="btn-action-sub">{phoneContact}</span>
            </button>

            <button className="quick-action-card-btn whatsapp-action" onClick={handleWhatsApp}>
              <span className="btn-action-icon">💬</span>
              <span className="btn-action-label">WhatsApp</span>
              <span className="btn-action-sub">{isFrench ? 'Chat Direct' : 'Direct Chat'}</span>
            </button>

            <button className="quick-action-card-btn share-action" onClick={handleShare}>
              <span className="btn-action-icon">📤</span>
              <span className="btn-action-label">{isFrench ? 'Partager' : 'Share'}</span>
              <span className="btn-action-sub">{isFrench ? 'Envoyer Profil' : 'Send Profile'}</span>
            </button>
          </div>
        </section>

        {/* 7. Gallery Grid (2 Columns, 10 Items, 12px Rounded Corners) */}
        <section className="dashboard-section-block">
          <div className="section-header-flex">
            <h2 className="section-title-sm">
              {isFrench ? 'Galerie de Réalisations' : 'Portfolio Gallery'} <span className="gallery-counter">({galleryItems.length} items)</span>
            </h2>
          </div>

          <div className="gallery-two-col-grid">
            {galleryItems.map((item) => (
              <div key={item.id} className="gallery-item-card">
                <div className="gallery-img-wrapper">
                  <img src={item.img} alt={item.title} loading="lazy" />
                  <div className="gallery-item-overlay">
                    <span className="gallery-item-title">{item.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Reviews List with Top-Right Action Button */}
        <section className="dashboard-section-block">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title-sm">{isFrench ? 'Avis & Témoignages Clients' : 'Client Reviews'}</h2>
              <p className="reviews-sub-count">
                ★ 5.0 • {reviews.length} {isFrench ? 'retours d’expérience vérifiés' : 'verified client reviews'}
              </p>
            </div>

            <button
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
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h3>{isFrench ? 'Rédiger une Évaluation' : 'Write a Review'}</h3>
              <button className="close-btn" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddReview}>
              <div className="form-group-item">
                <label>{isFrench ? 'Votre Nom / Entreprise' : 'Your Name / Business'}</label>
                <input
                  type="text"
                  placeholder={isFrench ? 'ex: Paul Biya / SCI Bastos' : 'e.g. Paul Biya'}
                  value={newReviewerName}
                  onChange={(e) => setNewReviewerName(e.target.value)}
                  className="modal-text-input"
                  required
                />
              </div>

              <div className="form-group-item">
                <label>{isFrench ? 'Note sur 5' : 'Rating out of 5'}</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="modal-text-input"
                >
                  <option value={5}>★★★★★ (5/5) - Excellent</option>
                  <option value={4}>★★★★☆ (4/5) - Très bon</option>
                  <option value={3}>★★★☆☆ (3/5) - Moyen</option>
                </select>
              </div>

              <div className="form-group-item">
                <label>{isFrench ? 'Votre Commentaire Détaillé' : 'Your Detailed Feedback'}</label>
                <textarea
                  rows={4}
                  placeholder={isFrench ? 'Décrivez la qualité du travail, le respect des délais et la propreté du chantier...' : 'Describe the work quality, punctuality, and professionalism...'}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="modal-text-input"
                  required
                />
              </div>

              <button type="submit" className="submit-review-action-btn">
                {isFrench ? 'Publier mon Avis Sécurisé' : 'Submit Review'} →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


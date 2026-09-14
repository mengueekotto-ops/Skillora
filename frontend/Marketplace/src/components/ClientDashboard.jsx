import React, { useState } from 'react';

export default function ClientDashboard({
  currentUser,
  walletBalance,
  onOpenWallet,
  onOpenSettings,
  triggerToast,
  t,
  lang,
  onSelectArtisan
}) {
  const isFrench = lang === 'fr';

  // Navigation tab: 'OVERVIEW' | 'ORDERS' | 'MESSAGES' | 'BOOKMARKS' | 'PAYMENTS' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Subtab for Orders: 'ACTIVE' | 'HISTORY'
  const [ordersSubTab, setOrdersSubTab] = useState('ACTIVE');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Initial Bookmarks State
  const [bookmarks, setBookmarks] = useState([
    {
      id: 1,
      name: 'Emmanuel Ngu',
      businessName: 'Ngu Solar & Power Systems',
      profession: 'Électricien Master & Solaire',
      city: 'Douala & Yaoundé',
      location: 'Akwa, Douala • Bastos, Yaoundé',
      rating: 4.9,
      reviews: 38,
      verified: true,
      priceRate: '15 000 FCFA',
      phone: '+237 675 42 10 99',
      whatsapp: '237675421099',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1600&q=85',
      experience: '08 ans',
      badge: 'PRO MASTER',
      type: 'Single Artisan (Master Specialist)',
      skills: ['Tableaux Électriques', 'Centrales Solaires', 'Raccordement Groupes', 'Dépannage Court-circuit', 'Éclairage LED Industriel'],
      bio: 'Électricien diplômé avec 8 ans d\'expérience dans le résidentiel et l\'énergie solaire au Cameroun.',
      gallery: [
        { id: 101, title: 'Centrale Solaire Résidentielle 5kVA', img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80' },
        { id: 102, title: 'Câblage Armoire Électrique Triphasée', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' },
        { id: 103, title: 'Installation Onduleur Hybride', img: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    {
      id: 2,
      name: 'Atelier Central Tuyauterie & Bâtiment',
      businessName: 'Atelier Central Tuyauterie SARL',
      profession: 'Plomberie Sanitaire & Urgence',
      city: 'Yaoundé (Bastos)',
      location: 'Bastos & Biyem-Assi, Yaoundé',
      rating: 5.0,
      reviews: 94,
      verified: true,
      priceRate: '25 000 FCFA',
      phone: '+237 699 88 77 66',
      whatsapp: '237699887766',
      image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=85',
      experience: '12 ans',
      badge: 'ENTERPRISE CERTIFIED',
      type: 'Grouped Artisan (Workshop)',
      skills: ['Tuyauterie Cuivre & Inox', 'Chauffe-eau Solaire', 'Dépannage Fuite 24/7', 'Assainissement & Fosses', 'Pompage & Forage'],
      bio: 'Atelier collectif d\'artisans plombiers et thermiciens certifiés pour grands chantiers et résidences.',
      gallery: [
        { id: 201, title: 'Rénovation Salle de Bain de Luxe', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' },
        { id: 202, title: 'Centrale de Chauffage Villa Bastos', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80' },
        { id: 203, title: 'Système de Pompage et Filtration', img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80' }
      ]
    }
  ]);

  // Initial Active Orders State
  const [orders, setOrders] = useState([
    {
      id: 'SK-9041',
      title: '⚡ Dépannage Tableau Électrique & Court-Circuit',
      artisan: 'Emmanuel Ngu',
      profession: 'Master Électricien',
      date: 'Aujourd\'hui, 14:00',
      location: 'Yaoundé (Bastos)',
      amount: 45000,
      status: 'IN_PROGRESS',
      step: 4, // 1 to 5
      whatsapp: '237675421099',
      escrowLocked: true
    },
    {
      id: 'SK-8812',
      title: '🔧 Réparation Fuite d\'Eau & Mitigeur Cuisine',
      artisan: 'Atelier Central Tuyauterie & Bâtiment',
      profession: 'Plombier Sanitaire',
      date: 'Demain, 10:30',
      location: 'Yaoundé (Biyem-Assi)',
      amount: 30000,
      status: 'ON_THE_WAY',
      step: 3,
      whatsapp: '237699887766',
      escrowLocked: true
    }
  ]);

  // Initial History Orders State
  const [historyOrders, setHistoryOrders] = useState([
    {
      id: 'SK-7201',
      title: '❄️ Entretien & Recharge Gaz Climatiseur Split',
      artisan: 'Alain Foe',
      profession: 'Technicien Froid & Clim',
      date: '12 Août 2026',
      location: 'Yaoundé (Omnisports)',
      amount: 25000,
      status: 'COMPLETED',
      whatsapp: '237677112233',
      reviewed: true,
      rating: 5
    }
  ]);

  // Sample Artisans List with Rich Profile Data for Read-Only Navigation
  const artisans = [
    {
      id: 1,
      name: 'Emmanuel Ngu',
      businessName: 'Ngu Solar & High-Voltage Systems',
      type: 'Single Artisan (Master Specialist)',
      profession: 'Master Electrician & Solar',
      city: 'Douala (Akwa)',
      location: 'Akwa & Bonanjo, Douala',
      rating: 4.9,
      reviews: 38,
      verified: true,
      priceRate: '15 000 FCFA / visite',
      phone: '+237 675 42 10 99',
      whatsapp: '237675421099',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1600&q=85',
      badge: 'PRO MASTER VÉRIFIÉ',
      experience: '08 ans',
      skills: ['Tableaux Divisionnaires', 'Centrales Photovoltaïques', 'Groupes Électrogènes', 'Mise à la Terre & Parasurtenseur', 'Éclairage Architectural'],
      bio: 'Master électricien certifié avec 8 ans d\'expérience dans l\'ingénierie électrique haute et basse tension et les installations solaires clés en main à Douala et Yaoundé.',
      gallery: [
        { id: 101, title: 'Centrale Solaire Résidentielle 5kVA', img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80' },
        { id: 102, title: 'Câblage Armoire Électrique Triphasée', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' },
        { id: 103, title: 'Installation Onduleur Hybride & Batteries', img: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    {
      id: 2,
      name: 'Atelier Central Tuyauterie & Bâtiment',
      businessName: 'Atelier Central BTP & Fluides Cameroun',
      type: 'Grouped Artisan (Workshop)',
      profession: 'Sanitary Plumbing & Industrial Heating',
      city: 'Yaoundé (Bastos & Biyem-Assi)',
      location: 'Bastos, Yaoundé',
      rating: 5.0,
      reviews: 94,
      verified: true,
      priceRate: '25 000 FCFA / intervention',
      phone: '+237 699 88 77 66',
      whatsapp: '237699887766',
      image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=85',
      badge: 'ENTERPRISE CERTIFIED',
      experience: '12 ans',
      skills: ['Tuyauterie Cuivre & Inox', 'Chauffe-eau Solaire', 'Dépannage Fuite 24/7', 'Assainissement & Fosses', 'Pompage & Forage'],
      bio: 'Groupement d\'artisans chevronnés en plomberie sanitaire, canalisations souterraines et distribution d\'eau pour villas, immeubles et commerces.',
      gallery: [
        { id: 201, title: 'Rénovation Salle de Bain de Luxe', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80' },
        { id: 202, title: 'Centrale de Chauffage Villa Bastos', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80' },
        { id: 203, title: 'Installation Tuyauterie Inox Industrielle', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
        { id: 204, title: 'Système de Pompage et Filtration', img: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    {
      id: 3,
      name: 'Kamga & Fils Menuiserie Moderne',
      businessName: 'Ébénisterie Kamga & Mobilier Haut de Gamme',
      type: 'Grouped Artisan (Workshop)',
      profession: 'Custom Kitchens & Luxury Woodwork',
      city: 'Douala (Bonapriso)',
      location: 'Bonapriso & Akwa, Douala',
      rating: 4.8,
      reviews: 52,
      verified: true,
      priceRate: '45 000 FCFA / devis',
      phone: '+237 670 12 34 56',
      whatsapp: '237670123456',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1600&q=85',
      badge: 'TOP COLLECTIVE',
      experience: '15 ans',
      skills: ['Cuisines Américaines Sur Mesure', 'Dressings & Placards', 'Portes Blindées en Bois Massif', 'Parquet Massif', 'Traitement Anti-termites'],
      bio: 'Atelier familial de menuiserie fine et d\'agencement d\'intérieur en bois précieux locaux (Ayous, Iroko, Padouk).',
      gallery: [
        { id: 301, title: 'Cuisine Moderne en Bois Massif Iroko', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80' },
        { id: 302, title: 'Placard Dressing Intégré sur Mesure', img: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    {
      id: 4,
      name: 'Alain Foe',
      businessName: 'Foe Frigo & Froid Cameroun',
      type: 'Single Artisan (Master Specialist)',
      profession: 'AC & Cold Room Refrigeration',
      city: 'Yaoundé (Mvan)',
      location: 'Mvan & Omnisports, Yaoundé',
      rating: 4.7,
      reviews: 14,
      verified: false,
      priceRate: '20 000 FCFA / diagnostic',
      phone: '+237 677 11 22 33',
      whatsapp: '237677112233',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80',
      coverPhoto: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1600&q=85',
      badge: 'NOUVEAU PRO',
      experience: '06 ans',
      skills: ['Climatiseurs Split & Inverter', 'Recharge Fréon R410a / R32', 'Chambres Froides Positives/Négatives', 'Nettoyage Échangeurs & Filtres'],
      bio: 'Technicien frigoriste qualifié pour le dépannage rapide, l\'entretien préventif et la recharge gaz de climatiseurs résidentiels et chambres froides.',
      gallery: [
        { id: 401, title: 'Installation Mini-Split Inverter 2CV', img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80' },
        { id: 402, title: 'Maintenance Groupe Compresseur Froid', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80' }
      ]
    }
  ];

  // Total Escrow Locked Amount calculation
  const totalEscrowLocked = orders.reduce((sum, o) => sum + (o.escrowLocked ? o.amount : 0), 0);

  // Actions
  const handleValidateWorkEnd = (orderId) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    setOrders(prev => prev.filter(o => o.id !== orderId));
    setHistoryOrders(prev => [
      {
        ...targetOrder,
        status: 'COMPLETED',
        step: 5,
        escrowLocked: false,
        reviewed: false
      },
      ...prev
    ]);

    triggerToast(
      isFrench
        ? `Travaux #${orderId} validés ! Séquestre de ${targetOrder.amount.toLocaleString()} FCFA libéré pour l'artisan.`
        : `Order #${orderId} completed! Escrow of ${targetOrder.amount.toLocaleString()} FCFA released to artisan.`,
      '🎉'
    );
  };

  const handleCancelOrder = (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    triggerToast(
      isFrench
        ? `Réservation #${orderId} annulée. Montant remboursé sur votre portefeuille.`
        : `Booking #${orderId} cancelled. Refunded to wallet.`,
      'ℹ️'
    );
  };

  const handleRemoveBookmark = (id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    triggerToast(isFrench ? 'Artisan retiré des favoris' : 'Artisan removed from bookmarks', '🗑️');
  };

  const handleDownloadInvoice = (orderId) => {
    triggerToast(
      isFrench ? `Téléchargement de la Facture PDF #${orderId}...` : `Downloading PDF Invoice #${orderId}...`,
      '📄'
    );
  };

  const openWhatsApp = (phone, text = '') => {
    const defaultMsg = encodeURIComponent(
      text || (isFrench ? "Bonjour, je vous contacte depuis mon espace client Skillora." : "Hello, contacting you from Skillora Client Workspace.")
    );
    window.open(`https://wa.me/${phone}?text=${defaultMsg}`, '_blank');
  };

  return (
    <div className="client-dashboard-container">
      {/* ==========================================================================
          SECTION 1: HEADER & PROFILE OVERVIEW WITH KPI STATS
          ========================================================================== */}
      <div className="client-profile-header-card">
        <div className="client-profile-main-info">
          <div className="client-avatar-large-wrap" onClick={onOpenSettings} style={{ cursor: 'pointer' }} title={isFrench ? "Changer la photo de profil" : "Change profile picture"}>
            <img
              src={currentUser?.profileImage || currentUser?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"}
              alt="Client Avatar"
              className="client-avatar-img"
            />
            <span className="client-verified-badge" title="Client Biométriquement Vérifié">✓</span>
            <span className="avatar-edit-overlay-btn">📷</span>
          </div>

          <div className="client-profile-details">
            <div className="client-badge-pill">🇨🇲 CLIENT VÉRIFIÉ • MEMBRE PREMIUM</div>
            <h1 className="client-profile-name">{currentUser?.name || 'Valerie Mbida'}</h1>
            <p className="client-location-sub">📍 Yaoundé (Bastos) & Douala (Akwa) • {currentUser?.phone || '+237 670 00 00 00'}</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="client-kpi-grid">
        <div className="client-kpi-card" onClick={() => { setActiveTab('ORDERS'); setOrdersSubTab('ACTIVE'); }}>
          <div className="kpi-icon-wrap gold">📋</div>
          <div className="kpi-data">
            <span className="kpi-number">{orders.length}</span>
            <span className="kpi-label">{isFrench ? 'Réservations en cours' : 'Active Bookings'}</span>
          </div>
        </div>

        <div className="client-kpi-card" onClick={() => setActiveTab('ORDERS')}>
          <div className="kpi-icon-wrap emerald">📥</div>
          <div className="kpi-data">
            <span className="kpi-number">3</span>
            <span className="kpi-label">{isFrench ? 'Demandes & Devis reçus' : 'Pending Quotes'}</span>
          </div>
        </div>

        <div className="client-kpi-card highlight" onClick={() => setActiveTab('PAYMENTS')}>
          <div className="kpi-icon-wrap purple">🔒</div>
          <div className="kpi-data">
            <span className="kpi-number">{totalEscrowLocked.toLocaleString()} <small>FCFA</small></span>
            <span className="kpi-label">{isFrench ? 'Garantie Séquestre Bloquée' : 'Escrow Guarantee Locked'}</span>
          </div>
        </div>
      </div>

      {/* ==========================================================================
          CLIENT NAVIGATION TABS
          ========================================================================== */}
      <nav className="client-tabs-nav">
        <button
          className={`client-nav-tab ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          🔍 {isFrench ? 'Explorer & Artisans' : 'Explore Artisans'}
        </button>

        <button
          className={`client-nav-tab ${activeTab === 'ORDERS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ORDERS')}
        >
          📋 {isFrench ? 'Mes Réservations' : 'My Orders'} ({orders.length})
        </button>

        <button
          className={`client-nav-tab ${activeTab === 'MESSAGES' ? 'active' : ''}`}
          onClick={() => setActiveTab('MESSAGES')}
        >
          💬 {isFrench ? 'Messagerie & Chat' : 'Messages'}
        </button>

        <button
          className={`client-nav-tab ${activeTab === 'BOOKMARKS' ? 'active' : ''}`}
          onClick={() => setActiveTab('BOOKMARKS')}
        >
          ⭐ {isFrench ? 'Favoris Mémorisés' : 'Bookmarks'} ({bookmarks.length})
        </button>

        <button
          className={`client-nav-tab ${activeTab === 'PAYMENTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('PAYMENTS')}
        >
          💳 {isFrench ? 'Paiements & Sécurité' : 'Payments'}
        </button>

        <button
          className={`client-nav-tab ${activeTab === 'SETTINGS' ? 'active' : ''}`}
          onClick={() => setActiveTab('SETTINGS')}
        >
          ⚙️ {isFrench ? 'Paramètres Compte' : 'Settings'}
        </button>
      </nav>

      {/* ==========================================================================
          TAB 1: OVERVIEW & ARTISANS DIRECTORY
          ========================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="tab-content-panel">
          {/* Search bar */}
          <div className="client-search-bar" style={{ marginBottom: '1.5rem' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={isFrench ? "Rechercher électricien, plombier, menuisier à Douala ou Yaoundé..." : "Search electrician, plumber, carpenter in Douala or Yaoundé..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="client-search-input"
            />
            <button className="btn-search-action">{isFrench ? 'Recherche IA' : 'AI Search'} →</button>
          </div>

          {/* Filter Pills */}
          <div className="category-filter-bar" style={{ marginBottom: '1.75rem' }}>
            <button className={`filter-pill ${selectedFilter === 'ALL' ? 'active' : ''}`} onClick={() => setSelectedFilter('ALL')}>
              {isFrench ? 'Tous les Artisans' : 'All Artisans'}
            </button>
            <button className={`filter-pill ${selectedFilter === 'VERIFIED' ? 'active' : ''}`} onClick={() => setSelectedFilter('VERIFIED')} style={{ borderColor: 'var(--artisan-border)', color: 'var(--artisan-accent)' }}>
              🛡️ {isFrench ? 'Badge Vérifié Uniquement (✓)' : 'Verified Only (✓)'}
            </button>
            <button className={`filter-pill ${selectedFilter === 'SINGLE' ? 'active' : ''}`} onClick={() => setSelectedFilter('SINGLE')}>
              🧑‍🔧 {t.singleArtisan}
            </button>
            <button className={`filter-pill ${selectedFilter === 'GROUPED' ? 'active' : ''}`} onClick={() => setSelectedFilter('GROUPED')}>
              🏢 {t.groupedArtisan}
            </button>
          </div>

          {/* Artisans Grid */}
          <div className="artisans-grid">
            {artisans
              .filter((a) => {
                if (selectedFilter === 'VERIFIED') return a.verified === true;
                if (selectedFilter === 'SINGLE') return a.type.includes('Single');
                if (selectedFilter === 'GROUPED') return a.type.includes('Grouped');
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  return a.name.toLowerCase().includes(q) || a.profession.toLowerCase().includes(q) || a.city.toLowerCase().includes(q);
                }
                return true;
              })
              .map((artisan) => (
                <div
                  key={artisan.id}
                  className="artisan-card-luxury clickable-profile-card"
                  onClick={() => onSelectArtisan && onSelectArtisan(artisan)}
                  title={isFrench ? `Consulter le profil de ${artisan.name}` : `View ${artisan.name}'s profile`}
                >
                  <div className="artisan-card-img-wrap">
                    <img src={artisan.image} alt={artisan.name} />
                    <span className="artisan-badge-tag">{artisan.badge}</span>
                    <span className="artisan-structure-tag">
                      {artisan.type.includes('Grouped') ? '🏢 Atelier Groupé' : '🧑‍🔧 Solo Pro'}
                    </span>
                    <div className="card-hover-profile-hint">
                      <span>👁️ {isFrench ? 'Voir Profil' : 'View Profile'}</span>
                    </div>
                  </div>

                  <div className="artisan-card-body">
                    <div className="artisan-rating-row">
                      <span className="stars">★ {artisan.rating}</span>
                      <span className="review-count">({artisan.reviews} avis)</span>
                      {artisan.verified ? (
                        <span className="verified-check">✓ VÉRIFIÉ</span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>Indépendant</span>
                      )}
                    </div>

                    <h3 className="artisan-card-name">{artisan.name}</h3>
                    <p className="artisan-card-prof">{artisan.profession}</p>
                    <p className="artisan-card-location">📍 {artisan.city}</p>
                    <p className="artisan-price-tag">Tarif: <strong>{artisan.priceRate}</strong></p>

                    <div className="artisan-card-actions">
                      <button
                        type="button"
                        className="btn-view-profile-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectArtisan) onSelectArtisan(artisan);
                        }}
                      >
                        👁️ {isFrench ? 'Consulter le Profil' : 'View Profile'}
                      </button>
                      <button
                        type="button"
                        className="btn-whatsapp-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsApp(artisan.whatsapp);
                        }}
                      >
                        💬 WhatsApp
                      </button>
                      <button
                        type="button"
                        className="btn-book-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerToast(isFrench ? `Réservation envoyée à ${artisan.name} !` : `Booking request sent to ${artisan.name}!`, '⭐');
                        }}
                      >
                        {isFrench ? 'Réserver' : 'Book'} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ==========================================================================
          TAB 2: GESTION DES RÉSERVATIONS & COMMANDES (EN COURS & HISTORIQUE)
          ========================================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="tab-content-panel">
          <div className="subtabs-bar">
            <button
              className={`subtab-btn ${ordersSubTab === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setOrdersSubTab('ACTIVE')}
            >
              🟡 {isFrench ? 'Interventions En Cours' : 'Active Interventions'} ({orders.length})
            </button>
            <button
              className={`subtab-btn ${ordersSubTab === 'HISTORY' ? 'active' : ''}`}
              onClick={() => setOrdersSubTab('HISTORY')}
            >
              📜 {isFrench ? 'Historique & Factures' : 'History & Invoices'} ({historyOrders.length})
            </button>
          </div>

          {/* ACTIVE ORDERS */}
          {ordersSubTab === 'ACTIVE' && (
            <div className="orders-stack-list">
              {orders.length === 0 ? (
                <div className="empty-panel-box">
                  <span>📋</span>
                  <h3>{isFrench ? 'Aucune réservation en cours' : 'No active bookings'}</h3>
                  <p>{isFrench ? 'Réservez un artisan qualifié sur la plateforme' : 'Explore artisans to book a professional'}</p>
                  <button className="btn-primary-gold" onClick={() => setActiveTab('OVERVIEW')}>
                    {isFrench ? 'Explorer les Artisans →' : 'Explore Artisans →'}
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="client-order-card">
                    <div className="order-header-row">
                      <div>
                        <span className="order-id-pill">{order.id}</span>
                        <h3 className="order-service-title">{order.title}</h3>
                        <p className="order-meta-info">
                          🧑‍🔧 <strong
                            style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                            onClick={() => {
                              const match = artisans.find((a) => a.name === order.artisan) || {
                                name: order.artisan,
                                profession: order.profession,
                                city: order.location,
                                location: order.location,
                                phone: order.whatsapp,
                                whatsapp: order.whatsapp
                              };
                              if (onSelectArtisan) onSelectArtisan(match);
                            }}
                            title={isFrench ? "Consulter le profil de l'artisan" : "View artisan profile"}
                          >
                            {order.artisan}
                          </strong> ({order.profession}) • 📍 {order.location} • 🕒 {order.date}
                        </p>
                      </div>

                      <div className="order-amount-box">
                        <span className="amount-num">{order.amount.toLocaleString()} FCFA</span>
                        <span className="escrow-locked-badge">🔒 {isFrench ? 'Séquestre Verrouillé' : 'Escrow Locked'}</span>
                      </div>
                    </div>

                    {/* Live Realtime Status Stepper */}
                    <div className="client-status-stepper">
                      <div className="stepper-track">
                        <div className="stepper-fill" style={{ width: `${((order.step - 1) / 4) * 100}%` }}></div>
                      </div>
                      <div className={`step-point ${order.step >= 1 ? 'completed' : ''}`}>
                        <div className="point-dot">1</div>
                        <span className="point-label">{isFrench ? 'Demandé' : 'Requested'}</span>
                      </div>
                      <div className={`step-point ${order.step >= 2 ? 'completed' : ''}`}>
                        <div className="point-dot">2</div>
                        <span className="point-label">{isFrench ? 'Confirmé' : 'Confirmed'}</span>
                      </div>
                      <div className={`step-point ${order.step >= 3 ? 'completed' : ''}`}>
                        <div className="point-dot">3</div>
                        <span className="point-label">{isFrench ? 'En Route' : 'On The Way'}</span>
                      </div>
                      <div className={`step-point ${order.step >= 4 ? 'completed' : ''}`}>
                        <div className="point-dot">4</div>
                        <span className="point-label">{isFrench ? 'Travaux En Cours' : 'In Progress'}</span>
                      </div>
                      <div className={`step-point ${order.step >= 5 ? 'completed' : ''}`}>
                        <div className="point-dot">5</div>
                        <span className="point-label">{isFrench ? 'Terminé' : 'Completed'}</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="order-actions-bar">
                      <button className="btn-whatsapp-action" onClick={() => openWhatsApp(order.whatsapp)}>
                        💬 WhatsApp Pro
                      </button>

                      <button className="btn-cancel-action" onClick={() => handleCancelOrder(order.id)}>
                        🚫 {isFrench ? 'Annuler' : 'Cancel'}
                      </button>

                      <button className="btn-validate-escrow-action" onClick={() => handleValidateWorkEnd(order.id)}>
                        ✅ {isFrench ? 'Valider la Fin & Libérer Séquestre' : 'Release Escrow Payment'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HISTORY ORDERS */}
          {ordersSubTab === 'HISTORY' && (
            <div className="orders-stack-list">
              {historyOrders.map((hOrder) => (
                <div key={hOrder.id} className="client-order-card history">
                  <div className="order-header-row">
                    <div>
                      <span className="order-id-pill completed">✓ {hOrder.id} • {isFrench ? 'TERMINÉ' : 'COMPLETED'}</span>
                      <h3 className="order-service-title">{hOrder.title}</h3>
                      <p className="order-meta-info">
                        🧑‍🔧 <strong>{hOrder.artisan}</strong> • 📍 {hOrder.location} • 🕒 {hOrder.date}
                      </p>
                    </div>
                    <span className="amount-num green">{hOrder.amount.toLocaleString()} FCFA</span>
                  </div>

                  <div className="order-actions-bar">
                    <button className="btn-outline-gold" onClick={() => handleDownloadInvoice(hOrder.id)}>
                      📄 {isFrench ? 'Télécharger Facture PDF' : 'Download Invoice PDF'}
                    </button>
                    <button className="btn-outline" onClick={() => triggerToast(isFrench ? 'Formulaire d\'avis ouvert' : 'Review modal opened', '✍️')}>
                      ⭐ {isFrench ? 'Laisser un Avis' : 'Write Review'}
                    </button>
                    <button className="btn-primary-gold" onClick={() => triggerToast(isFrench ? 'Nouvelle réservation initiée' : 'New booking started', '🔄')}>
                      🔄 {isFrench ? 'Réserver à nouveau' : 'Rebook Artisan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================================================
          TAB 3: MESSAGERIE & CONTACTS
          ========================================================================== */}
      {activeTab === 'MESSAGES' && (
        <div className="tab-content-panel">
          <div className="section-title-wrap">
            <h2>💬 Messagerie & Espace de Discussion Artisans</h2>
            <p>Discutez en direct et envoyez vos photos/vidéos du problème à résoudre</p>
          </div>

          <div className="messages-chat-list">
            <div className="chat-thread-card" onClick={() => openWhatsApp('237675421099')}>
              <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80" alt="Emmanuel Ngu" className="chat-avatar" />
              <div className="chat-thread-body">
                <div className="chat-header">
                  <strong>Emmanuel Ngu (Master Électricien)</strong>
                  <span className="chat-time">14:15</span>
                </div>
                <p className="chat-last-msg">"Je suis en route vers Bastos avec le matériel, arrivée estimée dans 15 min."</p>
              </div>
              <button className="btn-whatsapp-card" style={{ marginLeft: 'auto' }}>💬 WhatsApp</button>
            </div>

            <div className="chat-thread-card" onClick={() => openWhatsApp('237699887766')}>
              <img src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80" alt="Derreck Plomb" className="chat-avatar" />
              <div className="chat-thread-body">
                <div className="chat-header">
                  <strong>Derreck Plomb (Plomberie Sanitaire)</strong>
                  <span className="chat-time">Hier</span>
                </div>
                <p className="chat-last-msg">"Devis accepté pour la rénovation de la tuyauterie de douche."</p>
              </div>
              <button className="btn-whatsapp-card" style={{ marginLeft: 'auto' }}>💬 WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          TAB 4: FAVORIS & ARTISANS MÉMORISÉS (BOOKMARKS)
          ========================================================================== */}
      {activeTab === 'BOOKMARKS' && (
        <div className="tab-content-panel">
          <div className="section-title-wrap">
            <h2>⭐ Vos Artisans Mémorisés en Favoris</h2>
            <p>Accès rapide pour vos interventions d'urgence à Douala & Yaoundé</p>
          </div>

          <div className="artisans-grid">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="artisan-card-luxury clickable-profile-card"
                onClick={() => onSelectArtisan && onSelectArtisan(b)}
                title={isFrench ? `Consulter le profil de ${b.name}` : `View ${b.name}'s profile`}
              >
                <div className="artisan-card-img-wrap">
                  <img src={b.image} alt={b.name} />
                  <span className="artisan-badge-tag">FAVORI ✓</span>
                  <div className="card-hover-profile-hint">
                    <span>👁️ {isFrench ? 'Voir Profil' : 'View Profile'}</span>
                  </div>
                </div>
                <div className="artisan-card-body">
                  <h3 className="artisan-card-name">{b.name}</h3>
                  <p className="artisan-card-prof">{b.profession}</p>
                  <p className="artisan-card-location">📍 {b.city}</p>
                  <div className="artisan-card-actions">
                    <button
                      type="button"
                      className="btn-view-profile-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectArtisan) onSelectArtisan(b);
                      }}
                    >
                      👁️ {isFrench ? 'Consulter le Profil' : 'View Profile'}
                    </button>
                    <button
                      type="button"
                      className="btn-whatsapp-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsApp(b.whatsapp);
                      }}
                    >
                      💬 WhatsApp
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(b.id);
                      }}
                    >
                      🗑️ Retirer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================================================
          TAB 5: PAIEMENTS & SÉCURITÉ (GARANTIE SÉQUESTRE)
          ========================================================================== */}
      {activeTab === 'PAYMENTS' && (
        <div className="tab-content-panel">
          <div className="payment-security-banner">
            <div>
              <h2>🔒 Garantie Séquestre Skillora FCFA</h2>
              <p>Vos fonds sont conservés en toute sécurité sous séquestre jusqu'à la fin complète et validée de vos travaux.</p>
            </div>
            <button className="btn-primary-gold" onClick={onOpenWallet}>+ Recharger Portefeuille FCFA</button>
          </div>

          <h3 style={{ color: '#fff', margin: '1.5rem 0 1rem' }}>💳 Moyens de Paiement Enregistrés</h3>
          <div className="payment-methods-grid">
            <div className="payment-method-card mtn">
              <span className="pm-icon">🟡</span>
              <div>
                <strong>MTN Mobile Money (*126#)</strong>
                <p>+237 670 00 00 00 (Compte Principal)</p>
              </div>
              <span className="pm-badge">PAR DÉFAUT</span>
            </div>

            <div className="payment-method-card orange">
              <span className="pm-icon">🟠</span>
              <div>
                <strong>Orange Money (#150#)</strong>
                <p>+237 699 11 22 33</p>
              </div>
            </div>
          </div>

          <h3 style={{ color: '#fff', margin: '2rem 0 1rem' }}>📜 Historique des Transactions & Factures</h3>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Réf Transaction</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Mode</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#TX-9041</td>
                <td>Séquestre Verrouillé (Électricité)</td>
                <td>45 000 FCFA</td>
                <td>MTN MoMo</td>
                <td><span className="t-status locked">🔒 Bloqué Séquestre</span></td>
              </tr>
              <tr>
                <td>#TX-8812</td>
                <td>Séquestre Verrouillé (Plomberie)</td>
                <td>30 000 FCFA</td>
                <td>Orange Money</td>
                <td><span className="t-status locked">🔒 Bloqué Séquestre</span></td>
              </tr>
              <tr>
                <td>#TX-7201</td>
                <td>Libération Séquestre (Clim)</td>
                <td>25 000 FCFA</td>
                <td>MTN MoMo</td>
                <td><span className="t-status success">✓ Payé à l'artisan</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================================================
          TAB 6: PARAMÈTRES DU COMPTE CLIENT
          ========================================================================== */}
      {activeTab === 'SETTINGS' && (
        <div className="tab-content-panel">
          <div className="section-title-wrap">
            <h2>⚙️ Paramètres du Compte & Préférences Client</h2>
            <p>Gérez vos coordonnées, adresse principale et options de notification</p>
          </div>

          <form className="client-settings-form" onSubmit={(e) => { e.preventDefault(); triggerToast('Modifications enregistrées !', '✓'); }}>
            <div className="form-two-col">
              <div className="field">
                <label className="field-label">Nom Complet</label>
                <input type="text" className="input-field" defaultValue={currentUser?.name || 'Valerie Mbida'} required />
              </div>
              <div className="field">
                <label className="field-label">Téléphone WhatsApp (+237)</label>
                <input type="tel" className="input-field" defaultValue={currentUser?.phone || '+237 670 00 00 00'} required />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Adresse Principale d'Intervention</label>
              <input type="text" className="input-field" defaultValue="Yaoundé, Quartier Bastos (Avenue des Ambassades)" required />
            </div>

            <h3 style={{ color: '#fff', margin: '1.5rem 0 0.75rem' }}>🔔 Préférences de Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-cream)' }}>
                <input type="checkbox" defaultChecked /> Notifications WhatsApp (Suivi des travaux en temps réel)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-cream)' }}>
                <input type="checkbox" defaultChecked /> SMS de confirmation de Séquestre Mobile Money
              </label>
            </div>

            <button type="submit" className="btn-primary-gold" style={{ marginTop: '1.75rem' }}>
              Enregistrer les Modifications ✓
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

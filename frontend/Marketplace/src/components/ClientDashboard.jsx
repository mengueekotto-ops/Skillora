import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  api,
  avatarFor,
  formatDate,
  formatFCFA,
  mapProfessional,
  mapRequest,
  PAYMENT_STATUS_LABELS,
  shortRef,
} from '../api';
import { BookingDialog, PaymentDialog, ReviewDialog } from './JobDialogs';

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

export default function ClientDashboard({
  currentUser,
  setCurrentUser,
  onOpenSettings,
  triggerToast,
  t,
  lang,
  onSelectArtisan
}) {
  const isFrench = lang === 'fr';
  const tr = (fr, en) => (isFrench ? fr : en);

  // Navigation tab: 'OVERVIEW' | 'ORDERS' | 'BOOKMARKS' | 'PAYMENTS' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [ordersSubTab, setOrdersSubTab] = useState('ACTIVE');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Server data
  const [artisans, setArtisans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState({ artisans: true, orders: true, bookmarks: true });
  const [loadError, setLoadError] = useState('');

  // Dialogs
  const [bookingTarget, setBookingTarget] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  // ── Loading ────────────────────────────────────────────────────────────────
  const loadArtisans = useCallback(async () => {
    setLoading((l) => ({ ...l, artisans: true }));
    try {
      const res = await api('/professionals', { auth: false });
      setArtisans((res.data || []).map(mapProfessional));
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading((l) => ({ ...l, artisans: false }));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading((l) => ({ ...l, orders: true }));
    try {
      const [reqRes, payRes] = await Promise.all([api('/requests'), api('/payments/history')]);
      setRequests(reqRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setLoading((l) => ({ ...l, orders: false }));
    }
  }, [triggerToast]);

  const loadBookmarks = useCallback(async () => {
    setLoading((l) => ({ ...l, bookmarks: true }));
    try {
      const res = await api('/bookmarks');
      setBookmarks(
        (res.data || [])
          .filter((b) => b.professionalId)
          .map((b) => mapProfessional(b.professionalId))
      );
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setLoading((l) => ({ ...l, bookmarks: false }));
    }
  }, [triggerToast]);

  useEffect(() => {
    loadArtisans();
    loadOrders();
    loadBookmarks();
  }, [loadArtisans, loadOrders, loadBookmarks]);

  const orders = useMemo(() => requests.map((r) => mapRequest(r, payments)), [requests, payments]);
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const totalEscrowLocked = orders.reduce((sum, o) => sum + (o.escrowLocked ? o.amount : 0), 0);

  const filteredArtisans = artisans.filter((a) => {
    if (selectedFilter === 'VERIFIED' && !a.verified) return false;
    if (selectedFilter === 'SINGLE' && a.isGrouped) return false;
    if (selectedFilter === 'GROUPED' && !a.isGrouped) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return [a.name, a.profession, a.city, ...(a.skills || [])].some((v) => String(v).toLowerCase().includes(q));
    }
    return true;
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const updateStatus = async (order, status, successMsg) => {
    setBusy(true);
    try {
      await api(`/requests/${order.id}`, { method: 'PUT', body: { status } });
      triggerToast(successMsg, status === 'COMPLETED' ? '🎉' : 'ℹ️');
      await loadOrders();
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setBusy(false);
    }
  };

  const handleValidateWorkEnd = (order) => {
    const msg = order.escrowLocked
      ? tr(
          `Travaux ${order.ref} validés ! ${formatFCFA(order.amount)} libérés pour l'artisan.`,
          `Order ${order.ref} completed! ${formatFCFA(order.amount)} released to the artisan.`
        )
      : tr(`Travaux ${order.ref} validés !`, `Order ${order.ref} marked as completed!`);
    if (!window.confirm(tr('Confirmez-vous que les travaux sont terminés ? Le paiement sera versé à l\'artisan.', 'Confirm the work is finished? The payment will be released to the artisan.'))) return;
    updateStatus(order, 'COMPLETED', msg);
  };

  const handleCancelOrder = (order) => {
    if (!window.confirm(tr('Annuler cette réservation ?', 'Cancel this booking?'))) return;
    updateStatus(
      order,
      'CANCELLED',
      order.escrowLocked
        ? tr(`Réservation ${order.ref} annulée. Remboursement en cours.`, `Booking ${order.ref} cancelled. Refund pending.`)
        : tr(`Réservation ${order.ref} annulée.`, `Booking ${order.ref} cancelled.`)
    );
  };

  const handleToggleBookmark = async (artisan) => {
    try {
      const res = await api('/bookmarks/toggle', { method: 'POST', body: { professionalId: artisan.id } });
      triggerToast(
        res.isBookmarked ? tr('Ajouté aux favoris', 'Added to bookmarks') : tr('Artisan retiré des favoris', 'Removed from bookmarks'),
        res.isBookmarked ? '⭐' : '🗑️'
      );
      loadBookmarks();
    } catch (err) {
      triggerToast(err.message, '⚠️');
    }
  };

  const handleDownloadInvoice = (order) => {
    const win = window.open('', '_blank');
    if (!win) {
      triggerToast(tr('Autorisez les fenêtres pop-up pour télécharger la facture.', 'Allow pop-ups to download the invoice.'), '⚠️');
      return;
    }
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Facture ${esc(order.ref)}</title>
      <style>body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;color:#222}h1{color:#1f3a34}td{padding:6px 12px 6px 0}.total{font-size:1.3em;font-weight:bold}</style></head><body>
      <h1>Skillora — Facture</h1>
      <p><strong>Référence :</strong> ${esc(order.ref)}<br><strong>Date :</strong> ${esc(formatDate(order.date, lang))}</p>
      <table>
        <tr><td>Client</td><td>${esc(currentUser?.name)}</td></tr>
        <tr><td>Artisan</td><td>${esc(order.artisan)} (${esc(order.profession)})</td></tr>
        <tr><td>Prestation</td><td>${esc(order.description)}</td></tr>
        <tr><td>Lieu</td><td>${esc(order.location)}</td></tr>
        <tr><td>Statut</td><td>${esc(order.status)}</td></tr>
        ${order.payment ? `<tr><td>Transaction</td><td>${esc(order.payment.payinTransactionId)}</td></tr>
        <tr><td>Frais plateforme (2%)</td><td>${esc(formatFCFA(order.payment.platformFee))}</td></tr>` : ''}
      </table>
      <p class="total">Total : ${esc(formatFCFA(order.amount))}</p>
      <script>window.print()</script></body></html>`);
    win.document.close();
  };

  const openWhatsApp = (phone, text = '') => {
    if (!phone) {
      triggerToast(tr("Cet artisan n'a pas encore de numéro WhatsApp.", 'This artisan has no WhatsApp number yet.'), 'ℹ️');
      return;
    }
    const defaultMsg = encodeURIComponent(
      text || tr('Bonjour, je vous contacte depuis mon espace client Skillora.', 'Hello, contacting you from Skillora Client Workspace.')
    );
    window.open(`https://wa.me/${phone}?text=${defaultMsg}`, '_blank', 'noopener');
  };

  const openArtisanFromOrder = (order) => {
    const match = artisans.find((a) => String(a.id) === String(order.professionalId));
    if (onSelectArtisan) onSelectArtisan(match || { id: order.professionalId, name: order.artisan, profession: order.profession });
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderArtisanCard = (artisan, { favorite = false } = {}) => (
    <div
      key={artisan.id}
      className="artisan-card-luxury clickable-profile-card"
      onClick={() => onSelectArtisan && onSelectArtisan(artisan)}
      title={tr(`Consulter le profil de ${artisan.name}`, `View ${artisan.name}'s profile`)}
    >
      <div className="artisan-card-img-wrap">
        <img src={artisan.image} alt={artisan.name} />
        <span className="artisan-badge-tag">{favorite ? 'FAVORI ✓' : artisan.badge}</span>
        <span className="artisan-structure-tag">
          {artisan.isGrouped ? '🏢 Atelier Groupé' : '🧑‍🔧 Solo Pro'}
        </span>
        <div className="card-hover-profile-hint">
          <span>👁️ {tr('Voir Profil', 'View Profile')}</span>
        </div>
      </div>

      <div className="artisan-card-body">
        <div className="artisan-rating-row">
          <span className="stars">★ {artisan.rating ? artisan.rating.toFixed(1) : '—'}</span>
          <span className="review-count">({artisan.reviews} {tr('avis', 'reviews')})</span>
          {artisan.verified ? (
            <span className="verified-check">✓ {tr('VÉRIFIÉ', 'VERIFIED')}</span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{tr('Indépendant', 'Independent')}</span>
          )}
        </div>

        <h3 className="artisan-card-name">{artisan.name}</h3>
        <p className="artisan-card-prof">{artisan.profession}</p>
        <p className="artisan-card-location">📍 {artisan.city || tr('Localisation non précisée', 'Location not set')}</p>
        {!favorite && <p className="artisan-price-tag">{tr('Tarif', 'Rate')}: <strong>{artisan.priceRate}</strong></p>}

        <div className="artisan-card-actions">
          <button
            type="button"
            className="btn-view-profile-card"
            onClick={(e) => { e.stopPropagation(); if (onSelectArtisan) onSelectArtisan(artisan); }}
          >
            👁️ {tr('Consulter le Profil', 'View Profile')}
          </button>
          <button
            type="button"
            className="btn-whatsapp-card"
            onClick={(e) => { e.stopPropagation(); openWhatsApp(artisan.whatsapp); }}
          >
            💬 WhatsApp
          </button>
          {favorite ? (
            <button
              type="button"
              className="btn-cancel-action"
              onClick={(e) => { e.stopPropagation(); handleToggleBookmark(artisan); }}
            >
              🗑️ {tr('Retirer', 'Remove')}
            </button>
          ) : (
            <button
              type="button"
              className="btn-book-card"
              onClick={(e) => { e.stopPropagation(); setBookingTarget(artisan); }}
            >
              {tr('Réserver', 'Book')} →
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderEmpty = (icon, title, text, action) => (
    <div className="empty-panel-box">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );

  const clientName = currentUser?.name || tr('Client', 'Client');

  return (
    <div className="client-dashboard-container">
      {/* HEADER & PROFILE OVERVIEW */}
      <div className="client-profile-header-card">
        <div className="client-profile-main-info">
          <div className="client-avatar-large-wrap" onClick={onOpenSettings} style={{ cursor: 'pointer' }} title={tr('Changer la photo de profil', 'Change profile picture')}>
            <img
              src={currentUser?.profileImage || avatarFor(clientName)}
              alt={clientName}
              className="client-avatar-img"
            />
            <span className="avatar-edit-overlay-btn">📷</span>
          </div>

          <div className="client-profile-details">
            <div className="client-badge-pill">🇨🇲 {tr('ESPACE CLIENT', 'CLIENT WORKSPACE')}</div>
            <h1 className="client-profile-name">{clientName}</h1>
            <p className="client-location-sub">
              📍 {currentUser?.city || tr('Ville non renseignée', 'City not set')}
              {currentUser?.phone ? ` • ${currentUser.phone}` : ''}
            </p>
            {totalEscrowLocked > 0 && (
              <p className="client-location-sub">🔒 {tr('En séquestre', 'In escrow')} : <strong>{formatFCFA(totalEscrowLocked)}</strong></p>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <nav className="client-tabs-nav">
        <button className={`client-nav-tab ${activeTab === 'OVERVIEW' ? 'active' : ''}`} onClick={() => setActiveTab('OVERVIEW')}>
          🔍 {tr('Explorer & Artisans', 'Explore Artisans')}
        </button>
        <button className={`client-nav-tab ${activeTab === 'ORDERS' ? 'active' : ''}`} onClick={() => setActiveTab('ORDERS')}>
          📋 {tr('Mes Réservations', 'My Orders')} ({activeOrders.length})
        </button>
        <button className={`client-nav-tab ${activeTab === 'BOOKMARKS' ? 'active' : ''}`} onClick={() => setActiveTab('BOOKMARKS')}>
          ⭐ {tr('Favoris', 'Bookmarks')} ({bookmarks.length})
        </button>
        <button className={`client-nav-tab ${activeTab === 'PAYMENTS' ? 'active' : ''}`} onClick={() => setActiveTab('PAYMENTS')}>
          💳 {tr('Paiements & Sécurité', 'Payments')}
        </button>
        <button className={`client-nav-tab ${activeTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActiveTab('SETTINGS')}>
          ⚙️ {tr('Paramètres Compte', 'Settings')}
        </button>
      </nav>

      {/* TAB 1: ARTISANS DIRECTORY */}
      {activeTab === 'OVERVIEW' && (
        <div className="tab-content-panel">
          <div className="client-search-bar" style={{ marginBottom: '1.5rem' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={tr('Rechercher électricien, plombier, menuisier à Douala ou Yaoundé...', 'Search electrician, plumber, carpenter in Douala or Yaoundé...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="client-search-input"
            />
          </div>

          <div className="category-filter-bar" style={{ marginBottom: '1.75rem' }}>
            <button className={`filter-pill ${selectedFilter === 'ALL' ? 'active' : ''}`} onClick={() => setSelectedFilter('ALL')}>
              {tr('Tous les Artisans', 'All Artisans')}
            </button>
            <button className={`filter-pill ${selectedFilter === 'VERIFIED' ? 'active' : ''}`} onClick={() => setSelectedFilter('VERIFIED')} style={{ borderColor: 'var(--artisan-border)', color: 'var(--artisan-accent)' }}>
              🛡️ {tr('Badge Vérifié Uniquement (✓)', 'Verified Only (✓)')}
            </button>
            <button className={`filter-pill ${selectedFilter === 'SINGLE' ? 'active' : ''}`} onClick={() => setSelectedFilter('SINGLE')}>
              🧑‍🔧 {t.singleArtisan}
            </button>
            <button className={`filter-pill ${selectedFilter === 'GROUPED' ? 'active' : ''}`} onClick={() => setSelectedFilter('GROUPED')}>
              🏢 {t.groupedArtisan}
            </button>
          </div>

          {loading.artisans ? (
            renderEmpty('⏳', tr('Chargement des artisans…', 'Loading artisans…'), '')
          ) : loadError ? (
            renderEmpty('⚠️', tr('Impossible de charger les artisans', 'Could not load artisans'), loadError,
              <button className="btn-primary-gold" onClick={loadArtisans}>{tr('Réessayer', 'Retry')}</button>)
          ) : filteredArtisans.length === 0 ? (
            renderEmpty('🔍', tr('Aucun artisan trouvé', 'No artisans found'), tr('Essayez une autre recherche ou un autre filtre.', 'Try another search or filter.'))
          ) : (
            <div className="artisans-grid">{filteredArtisans.map((a) => renderArtisanCard(a))}</div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="tab-content-panel">
          <div className="subtabs-bar">
            <button className={`subtab-btn ${ordersSubTab === 'ACTIVE' ? 'active' : ''}`} onClick={() => setOrdersSubTab('ACTIVE')}>
              🟡 {tr('Interventions En Cours', 'Active Interventions')} ({activeOrders.length})
            </button>
            <button className={`subtab-btn ${ordersSubTab === 'HISTORY' ? 'active' : ''}`} onClick={() => setOrdersSubTab('HISTORY')}>
              📜 {tr('Historique & Factures', 'History & Invoices')} ({historyOrders.length})
            </button>
          </div>

          {ordersSubTab === 'ACTIVE' && (
            <div className="orders-stack-list">
              {loading.orders ? (
                renderEmpty('⏳', tr('Chargement…', 'Loading…'), '')
              ) : activeOrders.length === 0 ? (
                renderEmpty('📋', tr('Aucune réservation en cours', 'No active bookings'), tr('Réservez un artisan qualifié sur la plateforme', 'Explore artisans to book a professional'),
                  <button className="btn-primary-gold" onClick={() => setActiveTab('OVERVIEW')}>{tr('Explorer les Artisans →', 'Explore Artisans →')}</button>)
              ) : (
                activeOrders.map((order) => (
                  <div key={order.id} className="client-order-card">
                    <div className="order-header-row">
                      <div>
                        <span className="order-id-pill">{order.ref}</span>
                        <h3 className="order-service-title">{order.title}</h3>
                        <p className="order-meta-info">
                          🧑‍🔧 <strong
                            style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                            onClick={() => openArtisanFromOrder(order)}
                            title={tr("Consulter le profil de l'artisan", 'View artisan profile')}
                          >
                            {order.artisan}
                          </strong> ({order.profession}) • 📍 {order.location || '—'} • 🕒 {formatDate(order.date, lang)}
                        </p>
                      </div>

                      <div className="order-amount-box">
                        <span className="amount-num">{order.amount ? formatFCFA(order.amount) : tr('Sur devis', 'Quote')}</span>
                        {order.escrowLocked && <span className="escrow-locked-badge">🔒 {tr('Séquestre Verrouillé', 'Escrow Locked')}</span>}
                        {order.payment?.status === 'PENDING' && <span className="escrow-locked-badge">⏳ {tr('Paiement en attente', 'Payment pending')}</span>}
                      </div>
                    </div>

                    <div className="client-status-stepper">
                      <div className="stepper-track">
                        <div className="stepper-fill" style={{ width: `${((order.step - 1) / 4) * 100}%` }}></div>
                      </div>
                      {[
                        tr('Demandé', 'Requested'),
                        tr('Accepté', 'Accepted'),
                        tr('Payé (Séquestre)', 'Paid (Escrow)'),
                        tr('Travaux En Cours', 'In Progress'),
                        tr('Terminé', 'Completed'),
                      ].map((label, idx) => (
                        <div key={label} className={`step-point ${order.step >= idx + 1 ? 'completed' : ''}`}>
                          <div className="point-dot">{idx + 1}</div>
                          <span className="point-label">{label}</span>
                        </div>
                      ))}
                    </div>

                    {order.status === 'PENDING' && (
                      <p className="order-meta-info">⏳ {tr("En attente de la réponse de l'artisan.", 'Waiting for the artisan to respond.')}</p>
                    )}

                    <div className="order-actions-bar">
                      <button className="btn-whatsapp-action" onClick={() => openWhatsApp(order.whatsapp)}>
                        💬 WhatsApp Pro
                      </button>

                      {['PENDING', 'ACCEPTED'].includes(order.status) && (
                        <button className="btn-cancel-action" disabled={busy} onClick={() => handleCancelOrder(order)}>
                          🚫 {tr('Annuler', 'Cancel')}
                        </button>
                      )}

                      {['ACCEPTED', 'IN_PROGRESS'].includes(order.status) && !order.isPaid && (
                        <button className="btn-primary-gold" disabled={busy} onClick={() => setPayingOrder(order)}>
                          💳 {order.payment?.status === 'PENDING' ? tr('Confirmer le paiement', 'Confirm payment') : tr('Payer (Séquestre)', 'Pay into escrow')}
                        </button>
                      )}

                      {order.status === 'IN_PROGRESS' && (
                        <button className="btn-validate-escrow-action" disabled={busy} onClick={() => handleValidateWorkEnd(order)}>
                          ✅ {order.escrowLocked ? tr('Valider la Fin & Libérer Séquestre', 'Confirm & Release Escrow') : tr('Valider la Fin des Travaux', 'Confirm Work Completed')}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {ordersSubTab === 'HISTORY' && (
            <div className="orders-stack-list">
              {historyOrders.length === 0
                ? renderEmpty('📜', tr('Aucun historique', 'No history yet'), tr('Vos prestations terminées apparaîtront ici.', 'Completed jobs will appear here.'))
                : historyOrders.map((hOrder) => (
                  <div key={hOrder.id} className="client-order-card history">
                    <div className="order-header-row">
                      <div>
                        <span className={`order-id-pill ${hOrder.status === 'COMPLETED' ? 'completed' : ''}`}>
                          {hOrder.status === 'COMPLETED' ? '✓' : '✕'} {hOrder.ref} • {hOrder.status === 'COMPLETED' ? tr('TERMINÉ', 'COMPLETED') : hOrder.status === 'REJECTED' ? tr('REFUSÉ', 'REJECTED') : tr('ANNULÉ', 'CANCELLED')}
                        </span>
                        <h3 className="order-service-title">{hOrder.title}</h3>
                        <p className="order-meta-info">
                          🧑‍🔧 <strong>{hOrder.artisan}</strong> • 📍 {hOrder.location || '—'} • 🕒 {formatDate(hOrder.date, lang)}
                        </p>
                      </div>
                      {hOrder.amount > 0 && <span className="amount-num green">{formatFCFA(hOrder.amount)}</span>}
                    </div>

                    <div className="order-actions-bar">
                      <button className="btn-outline-gold" onClick={() => handleDownloadInvoice(hOrder)}>
                        📄 {tr('Télécharger Facture PDF', 'Download Invoice PDF')}
                      </button>
                      {hOrder.status === 'COMPLETED' && (
                        <button className="btn-outline" onClick={() => setReviewOrder(hOrder)}>
                          ⭐ {tr('Laisser un Avis', 'Write Review')}
                        </button>
                      )}
                      <button
                        className="btn-primary-gold"
                        onClick={() => {
                          const match = artisans.find((a) => String(a.id) === String(hOrder.professionalId));
                          setBookingTarget(match || { id: hOrder.professionalId, name: hOrder.artisan });
                        }}
                      >
                        🔄 {tr('Réserver à nouveau', 'Rebook Artisan')}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKMARKS */}
      {activeTab === 'BOOKMARKS' && (
        <div className="tab-content-panel">
          <div className="section-title-wrap">
            <h2>⭐ {tr('Vos Artisans Favoris', 'Your Favourite Artisans')}</h2>
            <p>{tr("Accès rapide pour vos interventions d'urgence", 'Quick access for urgent jobs')}</p>
          </div>
          {loading.bookmarks
            ? renderEmpty('⏳', tr('Chargement…', 'Loading…'), '')
            : bookmarks.length === 0
            ? renderEmpty('⭐', tr('Aucun favori', 'No bookmarks yet'), tr("Ajoutez des artisans en favoris depuis leur profil.", 'Bookmark artisans from their profile page.'))
            : <div className="artisans-grid">{bookmarks.map((b) => renderArtisanCard(b, { favorite: true }))}</div>}
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="tab-content-panel">
          <div className="payment-security-banner">
            <div>
              <h2>🔒 {tr('Garantie Séquestre Skillora', 'Skillora Escrow Guarantee')}</h2>
              <p>
                {tr(
                  "Vos fonds sont conservés en séquestre et ne sont versés à l'artisan qu'après votre validation de fin des travaux. Skillora prélève 2% de frais de service.",
                  'Your money is held in escrow and only paid to the artisan once you confirm the job is done. Skillora keeps a 2% service fee.'
                )}
              </p>
            </div>
          </div>

          <h3 style={{ color: 'var(--text-white)', margin: '2rem 0 1rem' }}>📜 {tr('Historique des Transactions', 'Transaction History')}</h3>
          {payments.length === 0 ? (
            renderEmpty('💳', tr('Aucune transaction', 'No transactions yet'), tr('Vos paiements Mobile Money apparaîtront ici.', 'Your Mobile Money payments will appear here.'))
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>{tr('Réf', 'Ref')}</th>
                  <th>{tr('Prestation', 'Job')}</th>
                  <th>{tr('Montant', 'Amount')}</th>
                  <th>{tr('Mode', 'Method')}</th>
                  <th>{tr('Statut', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const label = PAYMENT_STATUS_LABELS[p.status] || { fr: p.status, en: p.status, cls: '' };
                  return (
                    <tr key={p._id}>
                      <td>{shortRef(p._id)}</td>
                      <td>{p.serviceRequestId?.description || '—'}</td>
                      <td>{formatFCFA(p.amount)}</td>
                      <td>{p.paymentMethod === 'MTN' ? 'MTN MoMo' : p.paymentMethod === 'ORANGE' ? 'Orange Money' : 'Mobile Money'}</td>
                      <td><span className={`t-status ${label.cls}`}>{isFrench ? label.fr : label.en}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <ClientSettingsForm currentUser={currentUser} setCurrentUser={setCurrentUser} triggerToast={triggerToast} tr={tr} />
      )}

      {bookingTarget && (
        <BookingDialog
          artisan={bookingTarget}
          defaultLocation={currentUser?.city || ''}
          tr={tr}
          onClose={() => setBookingTarget(null)}
          onBooked={() => {
            setBookingTarget(null);
            loadOrders();
            setActiveTab('ORDERS');
            setOrdersSubTab('ACTIVE');
          }}
          triggerToast={triggerToast}
        />
      )}

      {payingOrder && (
        <PaymentDialog
          order={payingOrder}
          defaultPhone={currentUser?.phone || ''}
          tr={tr}
          onClose={() => setPayingOrder(null)}
          onDone={() => { setPayingOrder(null); loadOrders(); }}
          triggerToast={triggerToast}
        />
      )}

      {reviewOrder && (
        <ReviewDialog
          order={reviewOrder}
          tr={tr}
          onClose={() => setReviewOrder(null)}
          onDone={() => { setReviewOrder(null); loadArtisans(); }}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
}

function ClientSettingsForm({ currentUser, setCurrentUser, triggerToast, tr }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [location, setLocation] = useState(currentUser?.city || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    const [firstName, ...rest] = name.trim().split(/\s+/);
    setSaving(true);
    try {
      const res = await api(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: { firstName, lastName: rest.join(' ') || currentUser.lastName, phone, location },
      });
      const u = res.data;
      setCurrentUser?.((prev) => ({
        ...prev,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`.trim(),
        phone: u.phone || '',
        city: u.location || '',
        location: u.location || '',
      }));
      triggerToast(tr('Modifications enregistrées !', 'Changes saved!'), '✓');
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-content-panel">
      <div className="section-title-wrap">
        <h2>⚙️ {tr('Paramètres du Compte', 'Account Settings')}</h2>
        <p>{tr('Gérez vos coordonnées et votre adresse principale', 'Manage your contact details and main address')}</p>
      </div>

      <form className="client-settings-form" onSubmit={submit}>
        <div className="form-two-col">
          <div className="field">
            <label className="field-label">{tr('Nom Complet', 'Full Name')}</label>
            <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">{tr('Téléphone WhatsApp (+237)', 'WhatsApp Phone (+237)')}</label>
            <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field-label">{tr("Adresse Principale d'Intervention", 'Main Service Address')}</label>
          <input type="text" className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Yaoundé, Bastos" />
        </div>

        <p className="order-meta-info">✉️ {currentUser?.email}</p>

        <button type="submit" className="btn-primary-gold" disabled={saving} style={{ marginTop: '1.75rem' }}>
          {saving ? tr('Enregistrement…', 'Saving…') : tr('Enregistrer les Modifications ✓', 'Save Changes ✓')}
        </button>
      </form>
    </div>
  );
}

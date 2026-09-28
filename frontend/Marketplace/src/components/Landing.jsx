import React, { useEffect, useMemo, useState } from 'react';
import { api, avatarFor } from '../api';
import './Landing.css';

const IMG = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

const HERO_IMAGE = IMG('1621905251189-08b45d6a269e', 1400);
const TEAM_IMAGE = IMG('1504307651254-35680f356dfd', 900);

const SERVICES = [
  { icon: '⚡', img: '1621905251189-08b45d6a269e', fr: ['Électricité', 'Installation, dépannage de tableaux, mise à la terre.'], en: ['Electrical', 'Installations, panel repairs, earthing.'] },
  { icon: '🚰', img: '1585704032915-c3400ca199e7', fr: ['Plomberie', 'Fuites, sanitaires, chauffe-eau et canalisations.'], en: ['Plumbing', 'Leaks, bathrooms, water heaters and pipes.'] },
  { icon: '☀️', img: '1508514177221-188b1cf16e9d', fr: ['Énergie solaire', 'Panneaux, onduleurs et batteries pour la maison.'], en: ['Solar energy', 'Panels, inverters and home batteries.'] },
  { icon: '🧱', img: '1504307651254-35680f356dfd', fr: ['Maçonnerie & BTP', 'Construction, rénovation, carrelage.'], en: ['Masonry & building', 'Construction, renovation, tiling.'] },
  { icon: '🛁', img: '1584622650111-993a426fbf0a', fr: ['Rénovation', 'Salles de bain, cuisines et finitions.'], en: ['Renovation', 'Bathrooms, kitchens and finishes.'] },
  { icon: '🛠️', img: '1581092918056-0c4c3acd3789', fr: ['Dépannage', 'Diagnostic et réparation rapides.'], en: ['Repairs', 'Fast diagnosis and repair.'] },
];

export default function Landing({ lang, setLang, onSelectRole, currentUser, onOpenWorkspace }) {
  const tr = (fr, en) => (lang === 'fr' ? fr : en);
  const [menuOpen, setMenuOpen] = useState(false);
  const [artisans, setArtisans] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    api('/professionals', { auth: false })
      .then((res) => setArtisans(res.data || []))
      .catch(() => setArtisans([]));
    api('/reviews', { auth: false })
      .then((res) => setReviews((res.data || []).filter((r) => r.rating >= 4 && r.comment)))
      .catch(() => setReviews([]));
  }, []);

  const stats = useMemo(() => {
    if (!artisans) return null;
    const rated = artisans.filter((a) => a.rating > 0);
    const avg = rated.length ? rated.reduce((s, a) => s + a.rating, 0) / rated.length : 0;
    return {
      artisans: artisans.length,
      verified: artisans.filter((a) => a.verifiedBadge).length,
      rating: avg ? avg.toFixed(1) : '—',
      reviews: artisans.reduce((s, a) => s + (a.reviewCount || 0), 0),
    };
  }, [artisans]);

  const findArtisan = () => (currentUser ? onOpenWorkspace() : onSelectRole('client-auth', 'signup'));
  const becomeArtisan = () => (currentUser ? onOpenWorkspace() : onSelectRole('artisan-auth', 'signup'));
  const signIn = () => (currentUser ? onOpenWorkspace() : onSelectRole('client-auth', 'login'));
  const go = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pageSize = 3;
  const pages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const shownReviews = reviews.slice(reviewPage * pageSize, reviewPage * pageSize + pageSize);

  const NAV = [
    ['services', tr('Services', 'Services')],
    ['how', tr('Comment ça marche', 'How it works')],
    ['artisans', tr('Pour les artisans', 'For artisans')],
    ['faq', 'FAQ'],
  ];

  return (
    <div className="lp">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <button type="button" className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="lp-brand-mark" aria-hidden="true"><span /><span /><span /></span>
            <span>
              Skillora
              <small>{tr('ARTISANS VÉRIFIÉS', 'VERIFIED ARTISANS')}</small>
            </span>
          </button>

          <nav className={`lp-nav ${menuOpen ? 'open' : ''}`} aria-label={tr('Navigation principale', 'Main navigation')}>
            {NAV.map(([id, label]) => (
              <button key={id} type="button" onClick={() => go(id)}>{label}</button>
            ))}
            <div className="lp-nav-mobile-actions">
              <button type="button" className="lp-btn ghost" onClick={signIn}>{currentUser ? tr('Mon espace', 'My workspace') : tr('Se connecter', 'Sign in')}</button>
            </div>
          </nav>

          <div className="lp-header-actions">
            <div className="lp-lang" role="group" aria-label={tr('Langue', 'Language')}>
              <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => setLang?.('fr')}>FR</button>
              <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang?.('en')}>EN</button>
            </div>
            <button type="button" className="lp-link lp-hide-sm" onClick={signIn}>
              {currentUser ? tr('Mon espace', 'My workspace') : tr('Se connecter', 'Sign in')}
            </button>
            <button type="button" className="lp-btn primary lp-hide-sm" onClick={findArtisan}>
              {tr('Trouver un artisan', 'Find an artisan')}
            </button>
            <button
              type="button"
              className="lp-burger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={tr('Menu', 'Menu')}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="lp-hero" style={{ '--hero-img': `url(${HERO_IMAGE})` }}>
        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">{tr('VÉRIFIÉS. FIABLES. PROTÉGÉS.', 'VERIFIED. RELIABLE. PROTECTED.')}</p>
            <h1>
              {tr('Des artisans de confiance pour votre maison et votre entreprise', 'Trusted artisans for your home and business')}
            </h1>
            <p className="lp-lead">
              {tr(
                "Électriciens, plombiers, maçons, techniciens solaires… Trouvez un professionnel vérifié près de chez vous au Cameroun et payez en toute sécurité par Mobile Money.",
                'Electricians, plumbers, masons, solar technicians… Find a verified professional near you in Cameroon and pay safely with Mobile Money.'
              )}
            </p>
            <div className="lp-hero-ctas">
              <button type="button" className="lp-btn primary lg" onClick={findArtisan}>
                {tr('Trouver un artisan', 'Find an artisan')} →
              </button>
              <button type="button" className="lp-btn ghost lg" onClick={becomeArtisan}>
                {tr('Devenir artisan', 'Become an artisan')}
              </button>
            </div>

            <dl className="lp-stats">
              <div>
                <dt>{stats ? stats.artisans : '—'}</dt>
                <dd>{tr('Artisans inscrits', 'Registered artisans')}</dd>
              </div>
              <div>
                <dt>{stats ? stats.verified : '—'}</dt>
                <dd>{tr('Profils vérifiés', 'Verified profiles')}</dd>
              </div>
              <div>
                <dt>{stats ? stats.rating : '—'}<span className="lp-star">★</span></dt>
                <dd>{tr('Note moyenne', 'Average rating')}</dd>
              </div>
            </dl>
          </div>

          <div className="lp-hero-badge" aria-hidden="true">
            <span className="lp-hero-badge-icon">🔒</span>
            <div>
              <strong>{tr('Paiement en séquestre', 'Escrow payment')}</strong>
              <span>{tr("Libéré à l'artisan seulement après votre validation", 'Released to the artisan only after you confirm')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY ──────────────────────────────────────────────── */}
      <section className="lp-section lp-why">
        <div className="lp-container lp-why-inner">
          <div>
            <h2>{tr('Pourquoi choisir Skillora ?', 'Why choose Skillora?')}</h2>
            <p>{tr('Une plateforme pensée pour la confiance, du premier contact au paiement final.', 'A platform built for trust, from first contact to final payment.')}</p>
          </div>
          <ul className="lp-why-list">
            {[
              ['🛡️', tr('Artisans vérifiés', 'Verified artisans'), tr('Quiz technique et pièces contrôlées', 'Technical quiz and checked documents')],
              ['🔒', tr('Paiement protégé', 'Protected payment'), tr('Argent bloqué en séquestre', 'Money held in escrow')],
              ['⭐', tr('Avis authentiques', 'Genuine reviews'), tr('Seulement après une mission terminée', 'Only after a completed job')],
              ['📱', tr('Mobile Money', 'Mobile Money'), tr('MTN MoMo et Orange Money', 'MTN MoMo and Orange Money')],
            ].map(([icon, title, text]) => (
              <li key={title}>
                <span className="lp-why-icon">{icon}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className="lp-section" id="services">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>{tr('Nos services', 'Our services')}</h2>
            <button type="button" className="lp-link" onClick={findArtisan}>{tr('Voir tous les artisans →', 'See all artisans →')}</button>
          </div>
          <div className="lp-services">
            {SERVICES.map((s) => {
              const [title, text] = lang === 'fr' ? s.fr : s.en;
              return (
                <button type="button" key={title} className="lp-service" onClick={findArtisan} style={{ '--svc-img': `url(${IMG(s.img, 700)})` }}>
                  <span className="lp-service-icon">{s.icon}</span>
                  <strong>{title}</strong>
                  <span className="lp-service-text">{text}</span>
                  <span className="lp-service-more">{tr('Trouver un pro →', 'Find a pro →')}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PROCESS + VERIFIED ───────────────────────────────── */}
      <section className="lp-section" id="how">
        <div className="lp-container lp-split">
          <div>
            <h2>{tr('Simple, en 3 étapes', 'Simple, in 3 steps')}</h2>
            <ol className="lp-steps">
              {[
                [tr('Décrivez votre besoin', 'Describe your need'), tr("Choisissez un artisan et envoyez votre demande en quelques secondes.", 'Pick an artisan and send your request in seconds.')],
                [tr('Payez en séquestre', 'Pay into escrow'), tr("Une fois la mission acceptée, payez par Mobile Money. L'argent est bloqué.", 'Once accepted, pay by Mobile Money. The money is held safely.')],
                [tr('Validez les travaux', 'Confirm the work'), tr("Quand le travail est fait, validez : l'artisan est payé et vous laissez un avis.", 'When the job is done, confirm: the artisan is paid and you leave a review.')],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span className="lp-step-num">{i + 1}</span>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="lp-verified" id="artisans">
            <div className="lp-verified-copy">
              <h2>{tr('Des artisans vérifiés', 'Verified artisans')}</h2>
              <p>{tr('Le badge ✓ est attribué aux artisans qui ont prouvé leur savoir-faire.', 'The ✓ badge goes to artisans who have proven their skills.')}</p>
              <ul className="lp-checks">
                <li>{tr('Quiz technique sur leur métier', 'Technical quiz on their trade')}</li>
                <li>{tr("Pièce d'identité et selfie contrôlés", 'ID and selfie checked')}</li>
                <li>{tr('Avis de clients ayant réellement réservé', 'Reviews from clients who actually booked')}</li>
              </ul>
              <button type="button" className="lp-btn primary" onClick={becomeArtisan}>
                {tr('Vous êtes artisan ? Rejoignez-nous', 'Are you an artisan? Join us')}
              </button>
            </div>
            <div className="lp-verified-photo" style={{ '--team-img': `url(${TEAM_IMAGE})` }}>
              <span className="lp-verified-chip">✓ {tr('Profil vérifié', 'Verified profile')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (real reviews only) ─────────────────── */}
      {reviews.length > 0 && (
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head">
              <h2>{tr('Ce que disent nos clients', 'What our clients say')}</h2>
            </div>
            <div className="lp-reviews">
              {shownReviews.map((r) => {
                const c = r.customerId || {};
                const name = `${c.firstName || ''} ${c.lastName ? `${c.lastName[0]}.` : ''}`.trim() || tr('Client', 'Client');
                const pro = r.professionalId?.userId;
                return (
                  <figure key={r._id} className="lp-review">
                    <span className="lp-quote" aria-hidden="true">“</span>
                    <blockquote>{r.comment}</blockquote>
                    <div className="lp-review-stars" aria-label={`${r.rating}/5`}>{'★'.repeat(Math.round(r.rating))}<span>{'★'.repeat(5 - Math.round(r.rating))}</span></div>
                    <figcaption>
                      <img src={c.profileImage || avatarFor(name)} alt="" />
                      <div>
                        <strong>{name}</strong>
                        {pro && <small>{tr('a fait appel à', 'hired')} {pro.firstName}</small>}
                      </div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            {pages > 1 && (
              <div className="lp-dots" role="tablist">
                {Array.from({ length: pages }).map((_, i) => (
                  <button key={i} type="button" className={i === reviewPage ? 'active' : ''} onClick={() => setReviewPage(i)} aria-label={`${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="lp-section" id="faq">
        <div className="lp-container lp-faq">
          <h2>{tr('Questions fréquentes', 'Frequently asked questions')}</h2>
          {[
            [tr("Comment fonctionne le paiement en séquestre ?", 'How does escrow payment work?'),
              tr("Vous payez par Mobile Money une fois que l'artisan a accepté. L'argent reste bloqué et n'est versé à l'artisan qu'après votre validation de fin des travaux.", 'You pay by Mobile Money once the artisan accepts. The money stays locked and is only released after you confirm the job is done.')],
            [tr("Que se passe-t-il si j'annule ?", 'What if I cancel?'),
              tr("Si une mission payée est annulée ou refusée, le paiement est signalé à notre équipe pour remboursement.", 'If a paid job is cancelled or declined, the payment is flagged to our team for a refund.')],
            [tr("Combien coûte Skillora ?", 'How much does Skillora cost?'),
              tr("L'inscription est gratuite. Une commission de 2 % est prélevée sur le montant versé à l'artisan.", 'Signing up is free. A 2% commission is taken from the amount paid to the artisan.')],
            [tr("Comment un artisan obtient-il le badge vérifié ?", 'How does an artisan get the verified badge?'),
              tr("En réussissant un quiz technique sur son métier (60 % minimum) et en fournissant ses documents.", 'By passing a technical quiz on their trade (60% minimum) and providing their documents.')],
          ].map(([q, a]) => (
            <details key={q} className="lp-faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-cta">
            <span className="lp-cta-icon" aria-hidden="true">⚡</span>
            <div className="lp-cta-copy">
              <h2>{tr("Besoin d'un artisan maintenant ?", 'Need an artisan right now?')}</h2>
              <p>{tr('Créez votre compte gratuitement et envoyez votre première demande.', 'Create your free account and send your first request.')}</p>
            </div>
            <div className="lp-cta-actions">
              <button type="button" className="lp-btn primary" onClick={findArtisan}>{tr('Trouver un artisan', 'Find an artisan')}</button>
              <button type="button" className="lp-btn ghost" onClick={becomeArtisan}>{tr('Devenir artisan', 'Become an artisan')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div>
            <div className="lp-brand static">
              <span className="lp-brand-mark" aria-hidden="true"><span /><span /><span /></span>
              <span>Skillora</span>
            </div>
            <p>{tr('La plateforme qui relie les clients aux artisans vérifiés du Cameroun, avec paiement protégé.', 'The platform connecting clients with verified artisans in Cameroon, with protected payments.')}</p>
          </div>
          <div>
            <h3>{tr('Services', 'Services')}</h3>
            {SERVICES.map((s) => (
              <button key={s.img} type="button" onClick={findArtisan}>{(lang === 'fr' ? s.fr : s.en)[0]}</button>
            ))}
          </div>
          <div>
            <h3>{tr('Plateforme', 'Platform')}</h3>
            <button type="button" onClick={() => onSelectRole('client-auth', 'login')}>{tr('Espace client', 'Client space')}</button>
            <button type="button" onClick={() => onSelectRole('artisan-auth', 'login')}>{tr('Espace artisan', 'Artisan space')}</button>
            <button type="button" onClick={() => go('how')}>{tr('Comment ça marche', 'How it works')}</button>
            <button type="button" onClick={() => go('faq')}>FAQ</button>
          </div>
          <div>
            <h3>{tr('Contact', 'Contact')}</h3>
            <p>📍 Yaoundé & Douala, {tr('Cameroun', 'Cameroon')}</p>
            <button type="button" className="lp-admin-link" onClick={() => onSelectRole('admin-auth')}>{tr('Administration', 'Administration')}</button>
          </div>
        </div>
        <div className="lp-container lp-footer-bottom">
          © {new Date().getFullYear()} Skillora. {tr('Tous droits réservés.', 'All rights reserved.')}
        </div>
      </footer>
    </div>
  );
}

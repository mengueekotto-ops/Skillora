import React from 'react';

export default function RoleSelection({ onSelectRole, t, lang, setLang, theme, setTheme }) {
  return (
    <section className="role-selection-section">
      <div className="role-selection-inner-container">
        {/* Full-Width Top Header Navbar */}
        <header className="fullwidth-top-navbar w-full fixed top-0 left-0 right-0 z-50">
          <div className="navbar-fullwidth-inner w-full flex items-center justify-between px-6 py-3">
            <div className="landing-brand flex items-center gap-2">
              <span className="brand-icon-gem text-2xl">💎</span>
              <span className="brand-name text-xl font-extrabold tracking-tight">Skillora</span>
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

        {/* Hero Section */}
        <div className="role-hero">
          <h1 className="role-hero-title">
            {t.roleHeroTitle}
          </h1>
          <p className="role-hero-sub">
            {t.roleHeroSubtitle}
          </p>
        </div>

        {/* Role Cards Section */}
        <div className="role-cards">
          {/* CLIENT CARD */}
          <div className="luxury-card card-client">
            <div className="card-image-wrapper">
              <img src="/luxury_client_bg.png" alt="Modern luxury interior" />
              <div className="card-image-overlay"></div>
            </div>

            <div className="card-body">
              <div>
                <div className="card-label">{t.forClients}</div>
                <h2 className="card-heading">{t.clientTitle}</h2>
                <p className="card-text">{t.clientDesc}</p>

                <ul className="feature-list">
                  <li><span className="feature-icon">✓</span>{t.clientFeat1}</li>
                  <li><span className="feature-icon">✓</span>{t.clientFeat2}</li>
                  <li><span className="feature-icon">✓</span>{t.clientFeat3}</li>
                </ul>
              </div>

              <button className="card-action-btn" onClick={() => onSelectRole('client-auth')}>
                {t.continueClient}
              </button>
            </div>
          </div>

          {/* ARTISAN CARD */}
          <div className="luxury-card card-artisan">
            <div className="card-image-wrapper">
              <img src="/luxury_artisan_bg.png" alt="Master craftsman in workshop" />
              <div className="card-image-overlay"></div>
            </div>

            <div className="card-body">
              <div>
                <div className="card-label">{t.forArtisans}</div>
                <h2 className="card-heading">{t.artisanTitle}</h2>
                <p className="card-text">{t.artisanDesc}</p>

                <ul className="feature-list">
                  <li><span className="feature-icon">✓</span>{t.artisanFeat1}</li>
                  <li><span className="feature-icon">✓</span>{t.artisanFeat2}</li>
                  <li><span className="feature-icon">✓</span>{t.artisanFeat3}</li>
                </ul>
              </div>

              <button className="card-action-btn" onClick={() => onSelectRole('artisan-auth')}>
                {t.continueArtisan}
              </button>
            </div>
          </div>
        </div>

        {/* Social Proof & Trust Section */}
        <div className="social-proof-section" style={{
          marginTop: '4rem',
          padding: '2.5rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Key Numerical Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center',
            marginBottom: '2.5rem'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h3 style={{ fontSize: '2.2rem', color: '#06b6d4', margin: 0, fontWeight: '800' }}>500+</h3>
              <p style={{ margin: '0.4rem 0 0 0', fontWeight: '700', color: '#f8fafc' }}>{t.statArtisans || 'Artisans Qualifiés'}</p>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.statArtisansSub || 'Vérifiés par IA & Enquête Terrain'}</span>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h3 style={{ fontSize: '2.2rem', color: '#10b981', margin: 0, fontWeight: '800' }}>2,500+</h3>
              <p style={{ margin: '0.4rem 0 0 0', fontWeight: '700', color: '#f8fafc' }}>{t.statProjects || 'Projets Réussis'}</p>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.statProjectsSub || 'Missions Résidentielles & Commerciales'}</span>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <h3 style={{ fontSize: '2.2rem', color: '#f59e0b', margin: 0, fontWeight: '800' }}>4.9 / 5</h3>
              <p style={{ margin: '0.4rem 0 0 0', fontWeight: '700', color: '#f8fafc' }}>{t.statRating || 'Note Moyenne'}</p>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.statRatingSub || 'Basée sur +1,800 Avis Clients'}</span>
            </div>
          </div>

          {/* Reassurance & Guarantee Badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justify: 'center',
            gap: '1rem',
            marginBottom: '2.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', color: '#06b6d4' }}>
              <span>🔒</span>
              <span>{t.badgeEscrow || 'Paiements Sécurisés Escrow FCFA (MTN & Orange MoMo)'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', color: '#10b981' }}>
              <span>🛡️</span>
              <span>{t.badgeAI || 'Certification IA en 13 Étapes'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '8px 16px', borderRadius: '999px', fontSize: '0.85rem', color: '#f59e0b' }}>
              <span>⚡</span>
              <span>{t.badgeSpeed || 'Intervention Garantie sous 24h'}</span>
            </div>
          </div>

          {/* Customer & Artisan Testimonials Grid */}
          <h4 style={{ textAlign: 'center', color: '#f8fafc', fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '700' }}>
            💬 {t.testimonialsTitle || "La Confiance des Clients & Collectifs d'Entreprises"}
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.5' }}>
                « J'ai trouvé un électricien agréé en 15 minutes à Yaoundé pour la réhabilitation de ma villa. Travail impeccable et paiement sécurisé via Orange Money ! »
              </p>
              <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc' }}>
                Sandrine M. — <span style={{ color: '#94a3b8', fontWeight: '400' }}>Bastos, Yaoundé</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.5' }}>
                « En tant que collectif de plomberie à Douala, Skillora nous a apporté plus de 12 gros chantiers d'entreprises ce mois-ci. La certification IA donne une vraie crédibilité. »
              </p>
              <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc' }}>
                Maître Paul & Équipe — <span style={{ color: '#94a3b8', fontWeight: '400' }}>Akwa, Douala</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.5' }}>
                « Pas de mauvaises surprises sur les devis. Le système d'Escrow FCFA protège l'argent jusqu'à la fin des travaux. Excellent service ! »
              </p>
              <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', fontWeight: '700', color: '#f8fafc' }}>
                Dr. Alain Kouam — <span style={{ color: '#94a3b8', fontWeight: '400' }}>Bonapriso, Douala</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Footer with Discrete Admin Link */}
        <footer style={{
          marginTop: '4rem',
          padding: '1.5rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          justify: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.82rem',
          color: '#64748b'
        }}>
          <div>
            © 2026 Skillora — Plateforme d'Expertise & Certification IA au Cameroun. Tous droits réservés.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span
              onClick={() => onSelectRole('admin-auth')}
              style={{
                color: '#475569',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                fontSize: '0.8rem'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
              title="Accès Administrateur Dédié"
            >
              🔒 {t.adminSpaceFooter || 'Espace Admin'}
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}

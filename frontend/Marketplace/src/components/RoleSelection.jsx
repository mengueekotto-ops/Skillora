import React from 'react';

export default function RoleSelection({ onSelectRole, t }) {
  return (
    <section className="role-selection-section">
      <div className="role-hero">
        <h1 className="role-hero-title">
          {t.roleHeroTitle}
        </h1>
        <p className="role-hero-sub">
          {t.roleHeroSubtitle}
        </p>
      </div>

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
              <p className="card-text">
                {t.clientDesc}
              </p>

              <ul className="feature-list">
                <li>
                  <span className="feature-icon">✓</span>
                  {t.clientFeat1}
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  {t.clientFeat2}
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  {t.clientFeat3}
                </li>
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
              <p className="card-text">
                {t.artisanDesc}
              </p>

              <ul className="feature-list">
                <li>
                  <span className="feature-icon">✓</span>
                  {t.artisanFeat1}
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  {t.artisanFeat2}
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  {t.artisanFeat3}
                </li>
              </ul>
            </div>

            <button className="card-action-btn" onClick={() => onSelectRole('artisan-auth')}>
              {t.continueArtisan}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';

export default function Navbar({
  screen,
  setScreen,
  lang,
  setLang,
  t,
  walletBalance,
  onOpenWallet,
  onOpenSettings,
  onOpenAiAssistant,
  userRole,
  currentUser
}) {
  const toggleLang = () => {
    setLang(lang === 'en' ? 'fr' : 'en');
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "237670000000";
    const text = encodeURIComponent(
      lang === 'fr'
        ? "Bonjour Skillora, je souhaite obtenir de l'assistance pour mon projet d'artisanat au Cameroun."
        : "Hello Skillora, I would like assistance with my artisan service project in Cameroon."
    );
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
  };

  return (
    <header className="skillora-nav">
      {/* Top Left: Skillora Brand (No Senvato, No Interlink) */}
      <div className="nav-left">
        <a
          href="#"
          className="skillora-brand"
          onClick={(e) => {
            e.preventDefault();
            setScreen('role-selection');
          }}
        >
          <div className="brand-icon-gem">💎</div>
          <div className="brand-text-stack">
            <span className="brand-name">Skillora</span>
            <span className="brand-tagline">{t.brandTag}</span>
          </div>
        </a>
      </div>

      {/* Middle Top: Clean Language Switcher Button [ EN | FR ] */}
      <div className="nav-middle">
        <div className="lang-switcher-pill">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
            title="English"
          >
            🇬🇧 EN
          </button>
          <span className="lang-divider">|</span>
          <button
            className={`lang-btn ${lang === 'fr' ? 'active' : ''}`}
            onClick={() => setLang('fr')}
            title="Français"
          >
            🇫🇷 FR
          </button>
        </div>
      </div>

      {/* Top Right: All Nav Actions */}
      <div className="nav-right">
        {/* AI Assistant Launch Button */}
        <button
          className="btn-ai-assistant-top"
          onClick={onOpenAiAssistant}
          title="Skillora AI Assistant"
        >
          <span className="ai-btn-sparkle">✨</span>
          <span className="ai-btn-text">Skillora AI</span>
        </button>

        {/* WhatsApp Direct Chat Button */}
        <button
          className="btn-whatsapp-direct"
          onClick={handleWhatsAppClick}
          title="Direct WhatsApp Support (+237)"
        >
          <svg className="whatsapp-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.188 8.188 0 01-5.82 2.41c-1.46 0-2.89-.39-4.14-1.12l-.3-.18-3.08.81.82-3-.19-.31a8.19 8.19 0 01-1.27-4.44c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.07-.39-2.04-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
          </svg>
          <span className="wa-text">WhatsApp</span>
        </button>

        {/* Franc CFA Wallet Badge */}
        <button
          className="btn-wallet-top"
          onClick={onOpenWallet}
          title={t.walletSubtitle}
        >
          <span className="wallet-icon">💳</span>
          <div className="wallet-balance-info">
            <span className="wallet-tag">{t.wallet}</span>
            <span className="wallet-amount">{walletBalance.toLocaleString()} FCFA</span>
          </div>
          <span className="wallet-plus">+</span>
        </button>

        {/* Settings Button */}
        <button
          className="btn-settings-top"
          onClick={onOpenSettings}
          title={t.settings}
        >
          <span className="settings-gear">⚙️</span>
        </button>

        {/* Role switcher / Back Button */}
        {screen !== 'role-selection' && (
          <button className="btn-nav-back" onClick={() => setScreen('role-selection')}>
            {t.backToHome}
          </button>
        )}
      </div>
    </header>
  );
}


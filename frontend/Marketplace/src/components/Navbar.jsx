import React, { useCallback, useEffect, useState } from 'react';
import { api, formatDate } from '../api';

/* ------------------------------------------------------------------ */
/* Static data                                                         */
/* ------------------------------------------------------------------ */

const HOME_SCREEN = 'role-selection';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'EN', title: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'FR', title: 'Français' },
];

const THEMES = [
  { value: 'light', icon: '☀️', label: 'Clair', title: 'Mode Clair' },
  { value: 'dark', icon: '🌙', label: 'Sombre', title: 'Mode Sombre' },
];



/* Shared class names */
const ICON_BUTTON_CLASS =
  'p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none';

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Brand({ t, onGoHome }) {
  return (
    <div className="landing-brand flex items-center gap-2">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onGoHome?.();
        }}
        className="flex items-center gap-2 outline-none"
      >
        <span className="brand-icon-gem text-2xl">💎</span>
        <span className="brand-name text-xl font-extrabold tracking-tight">Skillora</span>
        {t?.brandTag && (
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:block ml-2 mt-1">
            {t.brandTag}
          </span>
        )}
      </a>
    </div>
  );
}

function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher-pill flex items-center rounded-lg p-1 text-xs">
      {LANGUAGES.map(({ code, flag, label, title }, index) => (
        <React.Fragment key={code}>
          {index > 0 && <span className="lang-divider px-1 opacity-40">|</span>}
          <button
            type="button"
            className={`lang-btn px-2 py-1 rounded font-bold transition-all ${lang === code ? 'active' : ''}`}
            onClick={() => setLang?.(code)}
            title={title}
          >
            {flag} {label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle-pill hidden sm:flex items-center rounded-lg p-1 text-xs">
      {THEMES.map(({ value, icon, label, title }) => (
        <button
          key={value}
          type="button"
          className={`theme-toggle-btn px-2 py-1 rounded font-semibold transition-all ${theme === value ? 'active' : ''}`}
          onClick={() => setTheme?.(value)}
          title={title}
        >
          {icon} <span className="theme-toggle-label ml-1">{label}</span>
        </button>
      ))}
    </div>
  );
}

function WalletBadge({ balance, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
      title={t?.walletSubtitle || 'Portefeuille FCFA'}
    >
      <span className="text-sm">💳</span>
      <span className="text-xs font-bold whitespace-nowrap tracking-wide">
        {balance.toLocaleString()} FCFA
      </span>
    </button>
  );
}

const NOTIFICATION_ICONS = { PAYMENT: '💳', REQUEST: '📋', REQUEST_UPDATE: '🔄', VERIFICATION: '🛡️', SYSTEM: '🔔' };
const NOTIFICATION_POLL_MS = 60 * 1000;

/** Live notifications of the logged-in user, refreshed every minute. */
function useNotifications(enabled) {
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api('/notifications');
      setItems(res.data || []);
    } catch { /* keep the last known list */ }
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled) return undefined;
    const timer = setInterval(refresh, NOTIFICATION_POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await api('/notifications/read-all', { method: 'PUT' }); } catch { refresh(); }
  };

  return { items, unread: items.filter((n) => !n.isRead).length, markAllRead, refresh };
}

function NotificationBell({ onClick, unread }) {
  return (
    <button type="button" onClick={onClick} className={`relative ${ICON_BUTTON_CLASS}`} aria-label={`Notifications (${unread})`}>
      <span className="text-lg leading-none">🔔</span>
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 bg-red-500 border-[1.5px] border-white dark:border-[#0f172a] text-white text-[9px] font-bold rounded-full">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

function SettingsButton({ onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={ICON_BUTTON_CLASS}
      title={t?.settings || 'Paramètres'}
    >
      <span className="text-lg leading-none">⚙️</span>
    </button>
  );
}

function BackHomeButton({ onClick, t }) {
  return (
    <>
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
      <button
        type="button"
        onClick={onClick}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors outline-none"
      >
        <span>←</span> {t?.backToHome || 'Accueil'}
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Notification slide-over panel                                       */
/* ------------------------------------------------------------------ */

function NotificationItem({ icon, title, body, time, read }) {
  return (
    <div
      className={`notification-item p-3 rounded-xl border ${
        read ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-800/80 border-slate-700/50'
      }`}
    >
      <span className="notif-icon">{icon}</span>
      <div className="notif-content text-xs">
        <div className={`notif-title font-bold ${read ? 'text-slate-300' : 'text-white'}`}>{title}</div>
        <div className={`notif-body mt-1 ${read ? 'text-slate-400' : 'text-slate-300'}`}>{body}</div>
        <div className="notif-time text-slate-500 text-[10px] mt-1">{time}</div>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose, items, onMarkAllRead, lang }) {
  return (
    <div
      className="notification-panel-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="notification-panel fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-800 p-4 shadow-2xl z-50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notification-header flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">🔔 Vos Notifications</h3>
          <button type="button" className="btn-close-notif text-slate-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* List */}
        <div className="notification-list flex-1 overflow-y-auto py-3 space-y-3">
          {items.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-8">
              {lang === 'fr' ? 'Aucune notification pour le moment.' : 'No notifications yet.'}
            </p>
          ) : (
            items.map((n) => (
              <NotificationItem
                key={n._id}
                icon={NOTIFICATION_ICONS[n.type] || '🔔'}
                title={n.title}
                body={n.message}
                time={formatDate(n.createdAt, lang)}
                read={n.isRead}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.some((n) => !n.isRead) && (
          <div className="notification-footer pt-3 border-t border-slate-800">
            <button
              type="button"
              className="btn-mark-read w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
              onClick={onMarkAllRead}
            >
              {lang === 'fr' ? 'Tout marquer comme lu ✓' : 'Mark all as read ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating AI assistant badge (bottom-left)                           */
/* ------------------------------------------------------------------ */

function AiAssistantBadge({ onClick, lang }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3 px-4 py-2 rounded-full bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] shadow-[0_10px_40px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-200 group"
      title="Skillora AI Assistant"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-inner group-hover:brightness-110 transition-all">
        <span className="text-white text-lg">✨</span>
      </div>

      {/* Text */}
      <div className="flex flex-col items-start text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-black text-xs tracking-wider">SKILLORA AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
        </div>
        <span className="text-slate-400 text-[10px] font-medium group-hover:text-slate-300 transition-colors">
          {lang === 'fr' ? 'Votre assistant intelligent' : 'Your smart assistant'}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */

export default function Navbar({
  // navigation
  screen,
  setScreen,
  // language & theme
  lang,
  setLang,
  t,
  theme = 'light',
  setTheme,
  // actions
  walletBalance = 0,
  onOpenWallet,
  onOpenSettings,
  onOpenAiAssistant,
  // notifications
  isNotificationsOpen = false,
  setIsNotificationsOpen,
  currentUser,
}) {
  const goHome = () => setScreen?.(HOME_SCREEN);
  const notifications = useNotifications(Boolean(currentUser));
  const toggleNotifications = () => {
    if (!isNotificationsOpen) notifications.refresh();
    setIsNotificationsOpen?.(!isNotificationsOpen);
  };
  const closeNotifications = () => setIsNotificationsOpen?.(false);

  const showBackHome = Boolean(screen && screen !== HOME_SCREEN && setScreen);

  return (
    <>
      <header className="fullwidth-top-navbar w-full fixed top-0 left-0 right-0 z-50">
        <div className="navbar-fullwidth-inner w-full flex items-center justify-between px-6 py-3">
          {/* LEFT: logo & brand */}
          <Brand t={t} onGoHome={goHome} />

          {/* RIGHT: controls & actions */}
          <div className="landing-controls flex items-center gap-3">
            <LanguageSwitcher lang={lang} setLang={setLang} />
            <ThemeToggle theme={theme} setTheme={setTheme} />

            {onOpenWallet && <WalletBadge balance={walletBalance} onClick={onOpenWallet} t={t} />}
            {setIsNotificationsOpen && <NotificationBell onClick={toggleNotifications} unread={notifications.unread} />}
            {onOpenSettings && <SettingsButton onClick={onOpenSettings} t={t} />}
            {showBackHome && <BackHomeButton onClick={goHome} t={t} />}
          </div>
        </div>
      </header>

      {isNotificationsOpen && (
        <NotificationPanel
          onClose={closeNotifications}
          items={notifications.items}
          onMarkAllRead={notifications.markAllRead}
          lang={lang}
        />
      )}

      {onOpenAiAssistant && <AiAssistantBadge onClick={onOpenAiAssistant} lang={lang} />}
    </>
  );
}
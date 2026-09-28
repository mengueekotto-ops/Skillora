import React, { useState, useEffect } from 'react';
import './App.css';
import { translations } from './translations';
import Navbar from './components/Navbar';
import RoleSelection from './components/RoleSelection';
import ClientAuth from './components/ClientAuth';
import ArtisanAuth from './components/ArtisanAuth';
import ClientDashboard from './components/ClientDashboard';
import ArtisanDashboard from './components/ArtisanDashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminAuth from './components/AdminAuth';
import WalletPaymentModal from './components/WalletPaymentModal';
import SettingsModal from './components/SettingsModal';
import HoloToast, { AiAssistantModal } from './components/HoloToast';
import { api, clearSession, getToken, normalizeUser } from './api';

const screenForRole = (role) =>
  role === 'ADMIN' ? 'admin-dashboard' : role === 'PROFESSIONAL' ? 'artisan-dashboard' : 'client-dashboard';

function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('skillora-theme') || 'light'; } catch { return 'light'; }
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [lang, setLang] = useState('fr'); // Default to French, seamlessly switchable to English
  const [screen, setScreen] = useState('role-selection'); // 'role-selection' | 'client-auth' | 'artisan-auth' | 'client-dashboard' | 'artisan-dashboard' | 'artisan-detail'
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [selectedArtisanId, setSelectedArtisanId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0); // 0.00 FCFA default initial balance
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'signup'
  const [currentUser, setCurrentUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(getToken()));
  const [toast, setToast] = useState({ visible: false, msg: '', icon: '✓' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('skillora-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  // Restore the logged-in session after a page refresh
  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((res) => {
        const user = normalizeUser(res.data.user);
        setCurrentUser(user);
        setScreen(screenForRole(user.role));
      })
      .catch(() => clearSession())
      .finally(() => setIsRestoringSession(false));
  }, []);

  // Any API call that gets 401 (expired token) logs the user out
  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setCurrentUser(null);
      setScreen('role-selection');
      setToast({ visible: true, msg: 'Session expirée, veuillez vous reconnecter. / Session expired.', icon: '🔒' });
    };
    window.addEventListener('skillora:unauthorized', onUnauthorized);
    return () => window.removeEventListener('skillora:unauthorized', onUnauthorized);
  }, []);

  const t = translations[lang] || translations.en;

  const triggerToast = (msg, icon = '✓') => {
    setToast({ visible: true, msg, icon });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Both auth screens hand back a normalized user; route by the role the server returned
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setScreen(screenForRole(user?.role));
  };
  const handleClientLoginSuccess = handleLoginSuccess;
  const handleArtisanLoginSuccess = handleLoginSuccess;

  const handleViewArtisanProfile = (artisan) => {
    setSelectedArtisan(artisan);
    setSelectedArtisanId(artisan?.id || null);
    setScreen('artisan-detail');
  };

  const handleBackToClientDashboard = () => {
    setScreen('client-dashboard');
    setSelectedArtisan(null);
    setSelectedArtisanId(null);
  };

  const handleLogout = () => {
    api('/auth/logout', { method: 'POST' }).catch(() => {});
    clearSession();
    setCurrentUser(null);
    setWalletBalance(0);
    setIsSettingsOpen(false);
    setSelectedArtisan(null);
    setSelectedArtisanId(null);
    setScreen('role-selection');
    triggerToast(lang === 'fr' ? 'Déconnexion effectuée avec succès' : 'Logged out successfully', '👋');
  };

  // Navbar wallet badge: earnings for artisans, money held in escrow for clients
  const refreshWallet = React.useCallback(async () => {
    if (!currentUser || currentUser.role === 'ADMIN') return;
    try {
      const res = await api('/payments/history');
      if (currentUser.role === 'PROFESSIONAL') {
        setWalletBalance(Number(res.walletBalance || 0));
      } else {
        setWalletBalance((res.data || []).filter((p) => p.status === 'HELD').reduce((s, p) => s + p.amount, 0));
      }
    } catch { /* badge keeps its last value */ }
  }, [currentUser]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet, screen]);

  if (isRestoringSession) {
    return (
      <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-dim)' }}>💎 Skillora…</p>
      </div>
    );
  }

  return (
    <>
      {/* Ambient background glows */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      <div className="ambient-glow glow-3"></div>

      {/* Toast Alert */}
      <HoloToast toast={toast} onClose={hideToast} />

      {/* AI Assistant Modal Dialog */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        lang={lang}
        triggerToast={triggerToast}
      />

      {/* Wallet & Payment Modal (MTN MoMo & Orange Money in Franc CFA) */}
      <WalletPaymentModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        t={t}
        lang={lang}
        currentUser={currentUser}
        walletBalance={walletBalance}
        onRefresh={refreshWallet}
      />

      {/* Settings Modal (Profile Info, Edit Profile, Legal, Logout) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        t={t}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onLogout={handleLogout}
        triggerToast={triggerToast}
      />

      <div className="app-shell">
        {/* Top Navigation Bar — Only visible when logged in (dashboard screens) */}
        {!['role-selection', 'client-auth', 'artisan-auth', 'admin-auth'].includes(screen) && (
          <Navbar
            screen={screen}
            setScreen={setScreen}
            lang={lang}
            setLang={setLang}
            t={t}
            walletBalance={walletBalance}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
            userRole={currentUser?.role}
            currentUser={currentUser}
            theme={theme}
            setTheme={setTheme}
            isNotificationsOpen={isNotificationsOpen}
            setIsNotificationsOpen={setIsNotificationsOpen}
          />
        )}

        {/* Dynamic Screen Flow */}
        {screen === 'role-selection' && (
          <RoleSelection
            onSelectRole={(role, tab = 'login') => {
              setAuthTab(tab);
              setScreen(role);
            }}
            t={t}
            lang={lang}
            setLang={setLang}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {screen === 'client-auth' && (
          <ClientAuth
            initialTab={authTab}
            setAuthTab={setAuthTab}
            onSwitchToArtisan={() => setScreen('artisan-auth')}
            onBackToLanding={() => setScreen('role-selection')}
            onLoginSuccess={handleClientLoginSuccess}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
            setLang={setLang}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {screen === 'artisan-auth' && (
          <ArtisanAuth
            initialTab={authTab}
            setAuthTab={setAuthTab}
            onSwitchToClient={() => setScreen('client-auth')}
            onBackToLanding={() => setScreen('role-selection')}
            onLoginSuccess={handleArtisanLoginSuccess}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
            setLang={setLang}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {screen === 'admin-auth' && (
          <AdminAuth
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setScreen('admin-dashboard');
            }}
            onBack={() => setScreen('role-selection')}
            triggerToast={triggerToast}
            lang={lang}
          />
        )}

        {screen === 'client-dashboard' && (
          <ClientDashboard
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            walletBalance={walletBalance}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
            onSelectArtisan={handleViewArtisanProfile}
          />
        )}

        {/* Read-Only Artisan Detail View for Clients */}
        {screen === 'artisan-detail' && (
          <ArtisanDashboard
            artisan={selectedArtisan}
            artisanId={selectedArtisanId}
            isReadOnly={true}
            currentUser={currentUser}
            userRole={currentUser?.role || 'CUSTOMER'}
            onBack={handleBackToClientDashboard}
            walletBalance={walletBalance}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
          />
        )}

        {/* Artisan Self-Dashboard with Full Edit Capabilities */}
        {screen === 'artisan-dashboard' && (
          <ArtisanDashboard
            artisanId={currentUser?.professionalId}
            isReadOnly={false}
            currentUser={currentUser}
            userRole={currentUser?.role || 'PROFESSIONAL'}
            onBack={() => setScreen('role-selection')}
            walletBalance={walletBalance}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
          />
        )}

        {/* Master Admin Console / Dashboard */}
        {screen === 'admin-dashboard' && (
          <AdminDashboard
            onLogout={handleLogout}
            onBackToMarketplace={() => setScreen('role-selection')}
            triggerToast={triggerToast}
            lang={lang}
          />
        )}
      </div>
    </>
  );
}

export default App;

import React, { useState } from 'react';
import './App.css';
import { translations } from './translations';
import Navbar from './components/Navbar';
import RoleSelection from './components/RoleSelection';
import ClientAuth from './components/ClientAuth';
import ArtisanAuth from './components/ArtisanAuth';
import ClientDashboard from './components/ClientDashboard';
import ArtisanDashboard from './components/ArtisanDashboard';
import WalletPaymentModal from './components/WalletPaymentModal';
import SettingsModal from './components/SettingsModal';
import HoloToast, { AiAssistantModal } from './components/HoloToast';

function App() {
  const [lang, setLang] = useState('fr'); // Default to French, seamlessly switchable to English
  const [screen, setScreen] = useState('role-selection'); // 'role-selection' | 'client-auth' | 'artisan-auth' | 'client-dashboard' | 'artisan-dashboard' | 'artisan-detail'
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [selectedArtisanId, setSelectedArtisanId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0); // 0.00 FCFA default initial balance
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: 'Emmanuel Ngu',
    email: 'emmanuel.pro@skillora.cm',
    phone: '+237 675 42 10 99',
    role: 'PROFESSIONAL',
    artisanType: 'Single Artisan (Master Specialist)',
    city: 'Yaoundé (Bastos)',
    bio: 'Certified Master Artisan with 8+ years experience in electrical engineering, high-voltage systems and solar energy in Cameroon.'
  });
  const [toast, setToast] = useState({ visible: false, msg: '', icon: '✓' });

  const t = translations[lang] || translations.en;

  const triggerToast = (msg, icon = '✓') => {
    setToast({ visible: true, msg, icon });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleClientLoginSuccess = (user) => {
    setCurrentUser(user);
    setScreen('client-dashboard');
  };

  const handleArtisanLoginSuccess = (user) => {
    setCurrentUser(user);
    setScreen('artisan-dashboard');
  };

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
    setIsSettingsOpen(false);
    setSelectedArtisan(null);
    setSelectedArtisanId(null);
    setScreen('role-selection');
    triggerToast(lang === 'fr' ? 'Déconnexion effectuée avec succès' : 'Logged out successfully', '👋');
  };

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
        walletBalance={walletBalance}
        setWalletBalance={setWalletBalance}
        triggerToast={triggerToast}
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
        {/* Top Navigation Bar with Skillora Logo, Middle-Top EN/FR Language Switcher, Top-Right AI Button, FCFA Wallet, WhatsApp, and Settings */}
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
        />

        {/* Dynamic Screen Flow */}
        {screen === 'role-selection' && (
          <RoleSelection
            onSelectRole={(role) => setScreen(role)}
            t={t}
            lang={lang}
          />
        )}

        {screen === 'client-auth' && (
          <ClientAuth
            onSwitchToArtisan={() => setScreen('artisan-auth')}
            onLoginSuccess={handleClientLoginSuccess}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
          />
        )}

        {screen === 'artisan-auth' && (
          <ArtisanAuth
            onSwitchToClient={() => setScreen('client-auth')}
            onLoginSuccess={handleArtisanLoginSuccess}
            triggerToast={triggerToast}
            t={t}
            lang={lang}
          />
        )}

        {screen === 'client-dashboard' && (
          <ClientDashboard
            currentUser={currentUser}
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
            artisan={currentUser}
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
      </div>
    </>
  );
}

export default App;

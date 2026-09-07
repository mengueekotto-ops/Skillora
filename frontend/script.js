/**
 * Skillora - Premium Luxury Service Platform Engine (Cameroon)
 * Features:
 * - Skillora Branding (No Senvato, No Interlink)
 * - Single Artisan & Grouped Artisan (Workshop/Enterprise) Support
 * - Centered Top Language Switcher [ EN | FR ]
 * - Top Right Franc CFA (FCFA) Wallet with MTN MoMo (*126#) & Orange Money (#150#)
 * - Direct WhatsApp Client Buttons
 * - Optional AI Verification & Gemini AI Technical Assessment Quiz
 * - Verified Badge (✓) & Unverified Artisan Support
 * - Settings Modal (Profile Info, Edit Profile, Legal, Logout)
 */

let appState = {
  lang: 'fr',
  currentScreen: 'role-selection',
  walletBalance: 0,
  selectedArtisanStructure: 'SINGLE',
  paymentProvider: 'MTN',
  walletTab: 'deposit',
  currentUser: {
    name: 'Emmanuel Ngu',
    email: 'emmanuel.pro@skillora.cm',
    phone: '+237 675 42 10 99',
    role: 'PROFESSIONAL',
    artisanType: 'Artisan Individuel (Master)',
    city: 'Yaoundé & Douala',
    verificationStatus: 'verified',
    verifiedBadge: true,
    verificationScore: 92,
    bio: 'Artisan certifié Master avec plus de 8 ans d\'expérience en électricité, armoires haute tension et énergie solaire au Cameroun.'
  }
};

const artisansData = [
  {
    id: 1,
    name: 'Emmanuel Ngu',
    type: 'SINGLE',
    typeLabel: '🧑‍🔧 Artisan Individuel',
    profession: 'Électricien Master & Solaire',
    city: 'Douala (Akwa)',
    rating: 4.9,
    reviews: 38,
    verified: true, // VERIFIED BADGE (✓)
    verificationScore: 92,
    priceRate: '15 000 FCFA / visite',
    whatsapp: '237675421099',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    badge: 'PRO MASTER'
  },
  {
    id: 2,
    name: 'Atelier Central Tuyauterie & Bâtiment',
    type: 'GROUPED',
    typeLabel: '🏢 Atelier Groupé',
    profession: 'Plomberie Sanitaire & Chauffage Industriel',
    city: 'Yaoundé (Bastos & Biyem-Assi)',
    rating: 5.0,
    reviews: 94,
    verified: true, // VERIFIED BADGE (✓)
    verificationScore: 96,
    priceRate: '25 000 FCFA / intervention',
    whatsapp: '237699887766',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
    badge: 'ENTERPRISE CERTIFIED'
  },
  {
    id: 3,
    name: 'Kamga & Fils Menuiserie Moderne',
    type: 'GROUPED',
    typeLabel: '🏢 Atelier Groupé',
    profession: 'Cuisines sur Mesure & Ébénisterie',
    city: 'Douala (Bonapriso)',
    rating: 4.8,
    reviews: 52,
    verified: true,
    verificationScore: 89,
    priceRate: '45 000 FCFA / devis',
    whatsapp: '237670123456',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    badge: 'TOP COLLECTIVE'
  },
  {
    id: 4,
    name: 'Alain Foe',
    type: 'SINGLE',
    typeLabel: '🧑‍🔧 Artisan Individuel',
    profession: 'Climatisation & Froid Commercial',
    city: 'Yaoundé (Mvan)',
    rating: 4.7,
    reviews: 14,
    verified: false, // UNVERIFIED (Can work, no badge)
    verificationScore: null,
    priceRate: '20 000 FCFA / diagnostic',
    whatsapp: '237677112233',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80',
    badge: 'NEW PRO'
  },
  {
    id: 5,
    name: 'Marcelle Tchakounte',
    type: 'SINGLE',
    typeLabel: '🧑‍🔧 Artisan Individuel',
    profession: 'Peinture Bâtiment & Décoration',
    city: 'Douala (Deido)',
    rating: 4.6,
    reviews: 8,
    verified: false, // UNVERIFIED
    verificationScore: null,
    priceRate: '12 000 FCFA / pièce',
    whatsapp: '237675001122',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
    badge: 'ARTISAN'
  }
];

// Switch Application Screen
function switchAppScreen(screenId) {
  appState.currentScreen = screenId;
  document.querySelectorAll('.app-screen').forEach(el => el.classList.remove('active'));
  
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (screenId === 'client-dashboard') {
    renderArtisansList('ALL');
  }
}

// Toast Alert
function showSkilloraToast(msg, icon = '✓') {
  const toast = document.getElementById('skillora-toast');
  const txt = document.getElementById('toast-text');
  const ic = document.getElementById('toast-icon');
  if (toast && txt) {
    txt.textContent = msg;
    if (ic) ic.textContent = icon;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}

// Language Switcher [ EN | FR ]
function setLanguage(lang) {
  appState.lang = lang;
  document.getElementById('btn-lang-en')?.classList.toggle('active', lang === 'en');
  document.getElementById('btn-lang-fr')?.classList.toggle('active', lang === 'fr');
  showSkilloraToast(lang === 'fr' ? 'Langue changée en Français 🇫🇷' : 'Language set to English 🇬🇧', '🌐');
}

// WhatsApp Direct Support
function openWhatsAppChat(contactTarget = '') {
  const phone = "237670000000";
  const defaultMsg = appState.lang === 'fr'
    ? `Bonjour Skillora, je souhaite obtenir des informations pour mes services au Cameroun.`
    : `Hello Skillora, I would like assistance with services in Cameroon.`;
  const msg = encodeURIComponent(contactTarget ? `Bonjour ${contactTarget}, je vous contacte via la plateforme Skillora.` : defaultMsg);
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// Single vs Grouped Artisan Selection in Registration
function selectArtisanStructure(type) {
  appState.selectedArtisanStructure = type;
  const isSingle = type === 'SINGLE';

  document.getElementById('type-card-single')?.classList.toggle('selected', isSingle);
  document.getElementById('type-card-grouped')?.classList.toggle('selected', !isSingle);
  
  const badgeSingle = document.getElementById('badge-single');
  const badgeGrouped = document.getElementById('badge-grouped');
  if (badgeSingle) badgeSingle.textContent = isSingle ? '● Sélectionné' : '○';
  if (badgeGrouped) badgeGrouped.textContent = !isSingle ? '● Sélectionné' : '○';

  const singleWrap = document.getElementById('single-fields-wrap');
  const groupedWrap = document.getElementById('grouped-fields-wrap');
  if (singleWrap) singleWrap.style.display = isSingle ? 'block' : 'none';
  if (groupedWrap) groupedWrap.style.display = !isSingle ? 'block' : 'none';
}

// Artisan Wizard Stepper
function goToArtisanStep(step) {
  [1, 2, 3].forEach(s => {
    const page = document.getElementById(`artisan-step-${s}`);
    const node = document.getElementById(`step-node-${s}`);
    if (page) page.style.display = s === step ? 'block' : 'none';
    if (node) {
      node.classList.toggle('active', s === step);
      node.classList.toggle('completed', s < step);
    }
  });

  const progress = document.getElementById('artisan-step-progress');
  if (progress) progress.style.width = `${((step - 1) / 2) * 100}%`;
}

function simulateVaultDocUpload(elementId, label) {
  const target = document.getElementById(elementId);
  if (target) {
    target.textContent = 'Chiffrement et vérification IA en cours... ⏳';
    setTimeout(() => {
      target.textContent = '✓ Document chiffré et validé dans le Coffre-Fort';
      showSkilloraToast(`${label} téléversé avec succès !`, '📄');
    }, 1000);
  }
}

// Skip Verification (Section 2 & 3: Unverified Account)
function skipArtisanVerification() {
  const isSingle = appState.selectedArtisanStructure === 'SINGLE';
  const name = isSingle 
    ? (document.getElementById('artisan-name-input')?.value || 'Artisan Indépendant')
    : (document.getElementById('group-name-input')?.value || 'Atelier Groupé');
  
  appState.currentUser.name = name;
  appState.currentUser.artisanType = isSingle ? 'Artisan Individuel (Non Vérifié)' : 'Atelier Groupé (Non Vérifié)';
  appState.currentUser.verifiedBadge = false;
  appState.currentUser.verificationStatus = 'unverified';
  
  showSkilloraToast('Compte créé en tant que Non Vérifié. Vous pouvez commencer à proposer vos services !', '✓');
  
  const badgeTop = document.getElementById('artisan-type-badge-top');
  const userDisp = document.getElementById('artisan-user-display');
  if (badgeTop) badgeTop.textContent = isSingle ? 'ARTISAN INDIVIDUEL (NON VÉRIFIÉ)' : 'ARTISAN GROUPÉ (NON VÉRIFIÉ)';
  if (userDisp) userDisp.textContent = name;
  
  switchAppScreen('artisan-dashboard');
}

// Complete AI Verification (Section 4 & 5: Verified Badge ✓)
function submitArtisanRegistration() {
  const isSingle = appState.selectedArtisanStructure === 'SINGLE';
  const name = isSingle 
    ? (document.getElementById('artisan-name-input')?.value || 'Emmanuel Ngu')
    : (document.getElementById('group-name-input')?.value || 'Atelier Élite Bâtiment');
  
  appState.currentUser.name = name;
  appState.currentUser.artisanType = isSingle ? 'Artisan Individuel (Master)' : 'Artisan Groupé (Atelier Élite)';
  appState.currentUser.verifiedBadge = true;
  appState.currentUser.verificationStatus = 'verified';
  appState.currentUser.verificationScore = 88;
  
  showSkilloraToast('🎉 Vérification IA validée avec 88% ! Badge VÉRIFIÉ attribué.', '🛡️');
  
  const badgeTop = document.getElementById('artisan-type-badge-top');
  const userDisp = document.getElementById('artisan-user-display');
  if (badgeTop) badgeTop.textContent = isSingle ? 'ARTISAN INDIVIDUEL (✓ VÉRIFIÉ)' : 'ARTISAN GROUPÉ (✓ VÉRIFIÉ)';
  if (userDisp) userDisp.textContent = name;
  
  switchAppScreen('artisan-dashboard');
}

// Client Login & Signup Handlers
function switchClientTab(tab) {
  document.getElementById('btn-client-tab-login')?.classList.toggle('active', tab === 'login');
  document.getElementById('btn-client-tab-signup')?.classList.toggle('active', tab === 'signup');
  document.getElementById('form-client-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-client-signup').style.display = tab === 'signup' ? 'block' : 'none';
}

function handleClientLogin(e) {
  e.preventDefault();
  showSkilloraToast('Connexion réussie ! Bienvenue sur Skillora.');
  switchAppScreen('client-dashboard');
}

function handleClientSignup(e) {
  e.preventDefault();
  const name = document.getElementById('client-reg-name')?.value || 'Valerie Mbida';
  appState.currentUser.name = name;
  document.getElementById('client-user-display').textContent = name;
  showSkilloraToast('Compte Client créé avec succès !');
  switchAppScreen('client-dashboard');
}

function switchArtisanTab(tab) {
  document.getElementById('btn-artisan-tab-login')?.classList.toggle('active', tab === 'login');
  document.getElementById('btn-artisan-tab-signup')?.classList.toggle('active', tab === 'signup');
  if (tab === 'login') {
    document.getElementById('artisan-wizard-box').style.display = 'none';
    submitArtisanRegistration();
  } else {
    document.getElementById('artisan-wizard-box').style.display = 'block';
    goToArtisanStep(1);
  }
}

// Render Artisans with Verified Badge vs Unverified Display (Section 5 & 6)
function renderArtisansList(category) {
  const container = document.getElementById('artisans-display-grid');
  if (!container) return;

  const filtered = artisansData.filter(a => {
    if (category === 'VERIFIED') return a.verified === true;
    if (category === 'SINGLE') return a.type === 'SINGLE';
    if (category === 'GROUPED') return a.type === 'GROUPED';
    return true;
  });

  container.innerHTML = filtered.map(artisan => `
    <div class="artisan-card-luxury">
      <div class="artisan-card-img-wrap" style="cursor:pointer;" onclick="openArtisanProfileModalById(${artisan.id})" title="Cliquer pour voir le profil complet et la galerie">
        <img src="${artisan.image}" alt="${artisan.name}">
        <span class="artisan-badge-tag">${artisan.badge}</span>
        <span class="artisan-structure-tag">${artisan.typeLabel}</span>
      </div>
      <div class="artisan-card-body">
        <div class="artisan-rating-row">
          <span class="stars">★ ${artisan.rating}</span>
          <span class="review-count">(${artisan.reviews} avis)</span>
          ${artisan.verified 
            ? `<span class="verified-check" title="Score de Vérification: ${artisan.verificationScore}%">✓ VÉRIFIÉ</span>` 
            : `<span style="font-size:0.72rem; color:var(--text-dim); margin-left:auto;">Non vérifié</span>`
          }
        </div>
        <h3 class="artisan-card-name" style="cursor:pointer;" onclick="openArtisanProfileModalById(${artisan.id})" title="Cliquer pour voir le profil">${artisan.name}</h3>
        <p class="artisan-card-prof">${artisan.profession}</p>
        <p class="artisan-card-location">📍 ${artisan.city}</p>
        <p class="artisan-price-tag">Tarif: <strong>${artisan.priceRate}</strong></p>
        <div class="artisan-card-actions">
          <button class="btn-outline-gold" style="font-size:0.78rem; padding:0.4rem 0.6rem;" onclick="openArtisanProfileModalById(${artisan.id})">
            👤 Voir Profil
          </button>
          <button class="btn-whatsapp-card" onclick="openWhatsAppChat('${artisan.name}')">
            <svg class="whatsapp-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.188 8.188 0 01-5.82 2.41c-1.46 0-2.89-.39-4.14-1.12l-.3-.18-3.08.81.82-3-.19-.31a8.19 8.19 0 01-1.27-4.44c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.13-1.07-.39-2.04-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
            </svg>
            <span>WhatsApp</span>
          </button>
          <button class="btn-book-card" onclick="showSkilloraToast('Demande de mission envoyée avec séquestre FCFA !')">
            Réserver →
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterArtisanCategory(cat) {
  document.querySelectorAll('.category-filter-bar .filter-pill').forEach(el => el.classList.remove('active'));
  event?.target?.classList.add('active');
  renderArtisansList(cat);
}

// Wallet Modal Functions (MTN MoMo & Orange Money in Franc CFA)
function openWalletModal() {
  document.getElementById('modal-wallet').style.display = 'flex';
  updateWalletDisplays();
}

function closeWalletModal() {
  document.getElementById('modal-wallet').style.display = 'none';
}

function updateWalletDisplays() {
  const formatted = appState.walletBalance.toLocaleString() + ' FCFA';
  document.getElementById('nav-wallet-val').textContent = formatted;
  document.getElementById('modal-balance-display').textContent = appState.walletBalance.toLocaleString();
  const clDash = document.getElementById('client-dash-wallet-val');
  if (clDash) clDash.textContent = appState.walletBalance.toLocaleString();
  const arDash = document.getElementById('artisan-dash-wallet-val');
  if (arDash) arDash.textContent = appState.walletBalance.toLocaleString();
}

function switchWalletTab(tab) {
  appState.walletTab = tab;
  document.getElementById('wtab-deposit')?.classList.toggle('active', tab === 'deposit');
  document.getElementById('wtab-withdraw')?.classList.toggle('active', tab === 'withdraw');
  
  const submitBtn = document.getElementById('btn-wallet-action-submit');
  const amt = parseInt(document.getElementById('wallet-amount-input')?.value || '25000', 10);
  if (submitBtn) {
    submitBtn.textContent = tab === 'deposit'
      ? `Recharger via ${appState.paymentProvider === 'MTN' ? 'MTN MoMo' : 'Orange Money'} (${amt.toLocaleString()} FCFA) →`
      : `Effectuer le Retrait Mobile Money (${amt.toLocaleString()} FCFA) →`;
  }
}

function selectPaymentProvider(provider) {
  appState.paymentProvider = provider;
  const isMTN = provider === 'MTN';
  document.getElementById('pcard-mtn')?.classList.toggle('selected', isMTN);
  document.getElementById('pcard-orange')?.classList.toggle('selected', !isMTN);
  document.getElementById('pcheck-mtn').textContent = isMTN ? '● Sélectionné' : '○';
  document.getElementById('pcheck-orange').textContent = !isMTN ? '● Sélectionné' : '○';
  
  const submitBtn = document.getElementById('btn-wallet-action-submit');
  if (submitBtn) {
    submitBtn.className = `btn-process-payment ${provider.toLowerCase()}`;
    const amt = parseInt(document.getElementById('wallet-amount-input')?.value || '25000', 10);
    submitBtn.textContent = appState.walletTab === 'deposit'
      ? `Recharger via ${isMTN ? 'MTN MoMo' : 'Orange Money'} (${amt.toLocaleString()} FCFA) →`
      : `Effectuer le Retrait (${amt.toLocaleString()} FCFA) →`;
  }

  const helper = document.getElementById('wallet-phone-helper');
  if (helper) {
    helper.textContent = isMTN
      ? 'Vous recevrez un prompt MTN MoMo sur votre téléphone pour valider avec votre code PIN (*126#).'
      : 'Vous recevrez un prompt Orange Money sur votre téléphone ou générez votre OTP via #150#.';
  }
}

function setPresetAmount(val) {
  document.getElementById('wallet-amount-input').value = val;
  selectPaymentProvider(appState.paymentProvider);
}

function handleWalletTransactionSubmit(e) {
  e.preventDefault();
  const amt = parseInt(document.getElementById('wallet-amount-input').value, 10);
  if (isNaN(amt) || amt <= 0) return;

  const isDeposit = appState.walletTab === 'deposit';
  if (!isDeposit && amt > appState.walletBalance) {
    showSkilloraToast('Solde FCFA insuffisant pour ce retrait.', '⚠️');
    return;
  }

  appState.walletBalance = isDeposit ? appState.walletBalance + amt : appState.walletBalance - amt;
  updateWalletDisplays();
  
  const provName = appState.paymentProvider === 'MTN' ? 'MTN Mobile Money' : 'Orange Money';
  showSkilloraToast(
    isDeposit ? `+${amt.toLocaleString()} FCFA ajoutés via ${provName} !` : `Retrait de ${amt.toLocaleString()} FCFA envoyé vers votre compte ${provName}.`,
    '💰'
  );
  closeWalletModal();
}

// Settings & Profile Functions
function openSettingsModal() {
  document.getElementById('modal-settings').style.display = 'flex';
  switchSettingsTab('profile');
}

function closeSettingsModal() {
  document.getElementById('modal-settings').style.display = 'none';
}

function switchSettingsTab(tab) {
  ['profile', 'edit', 'legal'].forEach(t => {
    document.getElementById(`stab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`scontent-${t}`).style.display = t === tab ? 'block' : 'none';
  });
}

function handleProfileEditSubmit(e) {
  e.preventDefault();
  const newName = document.getElementById('edit-name').value;
  appState.currentUser.name = newName;
  document.getElementById('set-name-disp').textContent = newName;
  document.getElementById('set-avatar-char').textContent = newName.charAt(0);
  document.getElementById('set-email-disp').textContent = document.getElementById('edit-email').value;
  document.getElementById('set-phone-disp').textContent = document.getElementById('edit-phone').value;
  document.getElementById('set-city-disp').textContent = '📍 ' + document.getElementById('edit-city').value;
  document.getElementById('set-bio-disp').textContent = document.getElementById('edit-bio').value;

  showSkilloraToast('Profil mis à jour avec succès !', '✓');
  switchSettingsTab('profile');
}

function logoutSkillora() {
  closeSettingsModal();
  switchAppScreen('role-selection');
  showSkilloraToast('Vous avez été déconnecté.', '👋');
}

function togglePassVisibility(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function checkPassStrength(val, fillId, textId) {
  let score = 0;
  if (val.length >= 8) score += 25;
  if (/[A-Z]/.test(val)) score += 25;
  if (/[0-9]/.test(val)) score += 25;
  if (/[^A-Za-z0-9]/.test(val)) score += 25;

  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (!fill || !text) return;

  fill.style.width = score + '%';
  if (score <= 25) {
    fill.style.background = '#d44a4a';
    text.textContent = 'Mot de passe faible';
    text.style.color = '#d44a4a';
  } else if (score <= 75) {
    fill.style.background = '#d4af37';
    text.textContent = 'Mot de passe moyen';
    text.style.color = '#d4af37';
  } else {
    fill.style.background = '#3eb489';
    text.textContent = 'Mot de passe fort et sécurisé ✓';
    text.style.color = '#3eb489';
  }
}

// New JS Handlers for Profile Bio, Gallery, Share Link, Requests Page, Trade Search & BEPC AI Quiz

const TRADE_LIST = [
  "⚡ Électricien Bâtiment & Solaire",
  "🚿 Plomberie Sanitaire & Chauffage",
  "🪵 Menuiserie Fine & Ébénisterie",
  "❄️ Climatisation, Froid & Frigo",
  "☀️ Panneaux Solaires & Onduleurs",
  "🧱 Maçonnerie, Carrelage & Génie Civil",
  "🎨 Peinture Bâtiment & Décoration",
  "🚗 Mécanique Automobile & Diagnostic",
  "💇 Coiffure & Esthétique",
  "💻 Réparation Ordinateurs & Téléphones",
  "💻 Développement Web & Mobile",
  "📷 Photographie & Vidéographie",
  "🧹 Ménage & Entretien Domestique"
];

function filterTradeList(query) {
  const container = document.getElementById('trade-search-results');
  if (!container) return;

  if (!query.trim()) {
    container.style.display = 'none';
    return;
  }

  const matches = TRADE_LIST.filter(t => t.toLowerCase().includes(query.toLowerCase()));
  if (matches.length === 0) {
    container.innerHTML = `<div style="padding:0.6rem; font-size:0.8rem; color:var(--text-muted);">Aucun métier trouvé. Tapez librement...</div>`;
  } else {
    container.innerHTML = matches.map(m => `
      <div style="padding:0.65rem 0.85rem; font-size:0.82rem; cursor:pointer; color:#fff; border-bottom:1px solid rgba(255,255,255,0.05);" onclick="selectSearchTrade('${m}')">
        ${m}
      </div>
    `).join('');
  }
  container.style.display = 'block';
}

function selectSearchTrade(tradeName) {
  document.getElementById('trade-search-input').value = tradeName;
  document.getElementById('selected-trade-display').value = tradeName;
  document.getElementById('trade-search-results').style.display = 'none';
  showSkilloraToast(`Métier sélectionné : ${tradeName}`, '⚒');
}

// BEPC Level AI Assessment Quiz Engine
let bepcQuizState = {
  currentQ: 0,
  timer: null,
  timeLeft: 30,
  score: 0,
  questions: [
    {
      q: "Examen BEPC/CAP : Quel outil de mesure est obligatoire pour vérifier l'absence de tension (VAT) avant travaux ?",
      options: ["Un ampèremètre à pince", "Un VAT (Vérificateur d'Absence de Tension) normalisé", "Un thermomètre infrarouge", "Un tournevis témoin simple"],
      correct: 1,
      explanation: "Seul un VAT conforme aux normes de sécurité garantit l'absence réelle de potentiel dangereux."
    },
    {
      q: "Examen BEPC/CAP : En cas de court-circuit direct entre la phase et le neutre, quel composant doit réagir immédiatement ?",
      options: ["Le compteur d'eau", "Le disjoncteur magnétothermique ou fusible", "Le transformateur d'isolement", "Le filtre réseau"],
      correct: 1,
      explanation: "La protection magnétique du disjoncteur coupe instantanément le courant lors d'un court-circuit."
    },
    {
      q: "Examen BEPC/CAP : Quelle est la formule essentielle de la Loi d'Ohm en courant continu ?",
      options: ["U = R x I", "P = U / R", "I = U x R", "R = U x I"],
      correct: 0,
      explanation: "La tension U (en Volts) est égale au produit de la résistance R (en Ohms) par l'intensité I (en Ampères)."
    }
  ]
};

function startBEPCAIQuiz() {
  document.getElementById('bepc-quiz-container').style.display = 'block';
  bepcQuizState.currentQ = 0;
  bepcQuizState.score = 0;
  renderBEPCQuestion();
}

function renderBEPCQuestion() {
  clearInterval(bepcQuizState.timer);
  bepcQuizState.timeLeft = 30;

  const qData = bepcQuizState.questions[bepcQuizState.currentQ];
  document.getElementById('bepc-q-title').textContent = `Question ${bepcQuizState.currentQ + 1}/3 (Examen BEPC)`;
  document.getElementById('bepc-q-text').textContent = qData.q;
  document.getElementById('bepc-timer').textContent = `⏱️ 30s`;

  const optsContainer = document.getElementById('bepc-options-list');
  optsContainer.innerHTML = qData.options.map((opt, idx) => `
    <button type="button" style="text-align:left; background:rgba(0,0,0,0.4); border:1px solid var(--border-subtle); color:var(--text-cream); padding:0.65rem 0.85rem; border-radius:8px; font-size:0.82rem; cursor:pointer;" onclick="answerBEPCQuestion(${idx})">
      ${String.fromCharCode(65 + idx)}. ${opt}
    </button>
  `).join('');

  bepcQuizState.timer = setInterval(() => {
    bepcQuizState.timeLeft--;
    document.getElementById('bepc-timer').textContent = `⏱️ ${bepcQuizState.timeLeft}s`;
    if (bepcQuizState.timeLeft <= 0) {
      clearInterval(bepcQuizState.timer);
      showSkilloraToast('Chrono écoulé ! Réinitialisation à la question 1...', '⏱️');
      startBEPCAIQuiz();
    }
  }, 1000);
}

function answerBEPCQuestion(selectedIdx) {
  clearInterval(bepcQuizState.timer);
  const qData = bepcQuizState.questions[bepcQuizState.currentQ];
  if (selectedIdx === qData.correct) bepcQuizState.score++;

  bepcQuizState.currentQ++;
  if (bepcQuizState.currentQ < bepcQuizState.questions.length) {
    renderBEPCQuestion();
  } else {
    // Finish Quiz
    const resBox = document.getElementById('bepc-result-box');
    resBox.style.display = 'block';
    const passed = bepcQuizState.score >= 2;
    resBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <span style="font-weight:800; color:${passed ? '#3eb489' : '#d44a4a'}; font-size:0.9rem;">
          ${passed ? '✓ NIVEAU BEPC VALIDÉ AVEC SUCCÈS' : '⚠️ SCORE INSUFFISANT (RÉESSAYER)'}
        </span>
        <span style="font-weight:800; color:var(--gold-light); font-size:0.85rem;">Score: ${bepcQuizState.score}/3</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-cream); margin:0;">
        ${passed ? 'Félicitations ! Vous avez démontré les compétences théoriques de niveau BEPC/CAP pour votre métier.' : 'Révisez les concepts de sécurité et réessayez l\'épreuve.'}
      </p>
    `;
  }
}

// Work Gallery Uploader (3 Photos per Album Post)
function triggerGalleryUploader() {
  const title = prompt("Titre de la nouvelle réalisation (Album de 3 photos) :", "Rénovation Panneau & Câblage");
  if (!title) return;

  const grid = document.getElementById('artisan-gallery-grid');
  if (grid) {
    const albumDiv = document.createElement('div');
    albumDiv.style.cssText = "background:rgba(0,0,0,0.4); border:1px solid var(--border-gold); border-radius:12px; padding:0.85rem; position:relative;";
    albumDiv.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
        <span style="font-size:0.8rem; font-weight:700; color:#fff;">⚡ ${title}</span>
        <span style="font-size:0.7rem; color:var(--gold-light);">3 Photos Enregistrées</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; border-radius:8px; overflow:hidden;">
        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80" style="width:100%; height:75px; object-fit:cover;" />
        <img src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=300&q=80" style="width:100%; height:75px; object-fit:cover;" />
        <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80" style="width:100%; height:75px; object-fit:cover;" />
      </div>
      <!-- Plus (+) Cross Button to add photos to gallery -->
      <button type="button" style="position:absolute; bottom:-10px; right:12px; width:28px; height:28px; border-radius:50%; background:var(--gold); border:none; color:#000; font-weight:900; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.5);" onclick="triggerGalleryUploader()" title="Ajouter des photos à l'album">+</button>
    `;
    grid.prepend(albumDiv);
    showSkilloraToast('Album de 3 photos enregistré dans la galerie ! Clients notifiés.', '📸');
  }
}

// Share Artisan Profile Link
function shareArtisanProfileLink() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    showSkilloraToast('Lien du profil copié dans le presse-papier !', '🔗');
  } else {
    showSkilloraToast('Lien du profil : ' + url, '🔗');
  }
}

// Open Round Avatar Full Profile View Modal
function openArtisanProfileModalById(artisanId) {
  const artisan = artisansData.find(a => a.id === artisanId) || appState.currentUser;
  openArtisanProfileModal(artisan);
}

function openArtisanProfileModal(artisan) {
  const modal = document.getElementById('modal-artisan-profile');
  if (!modal) return;

  const titleEl = document.getElementById('modal-artisan-title');
  const subEl = document.getElementById('modal-artisan-sub');
  const locEl = document.getElementById('modal-artisan-loc');
  const ratingEl = document.getElementById('modal-artisan-rating');
  const bioEl = document.getElementById('modal-artisan-bio');
  const imgEl = document.getElementById('modal-artisan-img');

  if (titleEl) titleEl.textContent = artisan?.profession || 'Sanitary plumbing (toilet/sink/shower)';
  if (subEl) subEl.innerHTML = `${artisan?.name || 'Derreck plomb'} <span style="background:rgba(255,255,255,0.1); padding:1px 5px; border-radius:4px; font-size:0.7rem; color:#fff; font-weight:700;">EN</span> <span style="background:rgba(255,255,255,0.1); padding:1px 5px; border-radius:4px; font-size:0.7rem; color:#fff; font-weight:700;">FR</span>`;
  if (locEl) locEl.textContent = `📍 ${artisan?.city || 'Yaoundé'}`;
  if (ratingEl) ratingEl.textContent = `★ ${artisan?.rating || 5.0} (${artisan?.reviews || 4} Reviews)`;
  if (imgEl && artisan?.image) imgEl.src = artisan.image;
  if (bioEl) {
    bioEl.innerHTML = artisan?.bio 
      ? artisan.bio 
      : `Je suis un <strong>${artisan?.profession || 'professionnel'} basé à ${artisan?.city || 'Yaoundé'}</strong>, spécialisé dans l'<strong>installation complète et la maintenance</strong> pour les maisons et bâtiments. Je m'engage à fournir un travail fiable, soigné et durable.`;
  }

  modal.style.display = 'flex';
}

function closeArtisanProfileModal() {
  const modal = document.getElementById('modal-artisan-profile');
  if (modal) modal.style.display = 'none';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  renderArtisansList('ALL');
  updateWalletDisplays();
});


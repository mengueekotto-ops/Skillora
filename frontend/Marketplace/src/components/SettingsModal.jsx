import React, { useState } from 'react';
import ImageCapturePicker from './ImageCapturePicker';

export default function SettingsModal({
  isOpen,
  onClose,
  t,
  currentUser,
  setCurrentUser,
  onLogout,
  triggerToast
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'edit' | 'legal'
  const [formData, setFormData] = useState({
    name: currentUser?.name || 'Emmanuel Ngu',
    email: currentUser?.email || 'emmanuel.pro@skillora.cm',
    phone: currentUser?.phone || '+237 675 42 10 99',
    role: currentUser?.role || 'PROFESSIONAL',
    artisanType: currentUser?.artisanType || 'Grouped Artisan (Master Workshop)',
    city: currentUser?.city || 'Yaoundé (Bastos)',
    bio: currentUser?.bio || 'Certified Master Artisan with 8+ years specializing in electrical engineering, high-voltage panels and solar inverter installations in Cameroon.',
    profileImage: currentUser?.profileImage || currentUser?.avatar || ''
  });

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      ...formData
    });
    triggerToast(t.editSuccess, '✓');
    setActiveTab('profile');
  };

  const handleAvatarChange = (newUrl) => {
    setFormData((prev) => ({ ...prev, profileImage: newUrl }));
    setCurrentUser({
      ...currentUser,
      ...formData,
      profileImage: newUrl,
      avatar: newUrl
    });
  };

  return (
    <div className="modal-backdrop-luxury">
      <div className="settings-modal-card">
        {/* Header */}
        <div className="settings-modal-header">
          <div className="settings-header-title">
            <span className="settings-title-icon">⚙️</span>
            <div>
              <h2>{t.settingsTitle}</h2>
              <p className="settings-subtitle">Manage your profile, identity, and security preferences</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Navigation Tabs */}
        <div className="settings-tab-nav">
          <button
            className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 {t.tabProfileInfo}
          </button>
          <button
            className={`settings-nav-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            ✏️ {t.tabEditProfile}
          </button>
          <button
            className={`settings-nav-btn ${activeTab === 'legal' ? 'active' : ''}`}
            onClick={() => setActiveTab('legal')}
          >
            📜 {t.tabLegal}
          </button>
        </div>

        <div className="settings-modal-body">
          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <div className="settings-profile-view">
              <div className="profile-hero-card">
                <div className="profile-avatar-large-container">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt={formData.name}
                      className="profile-avatar-img-round"
                    />
                  ) : (
                    <div className="profile-avatar-large">
                      <span>{formData.name.charAt(0)}</span>
                    </div>
                  )}
                  <span className="verified-badge-pill">✓ VERIFIED</span>

                  <ImageCapturePicker
                    value={formData.profileImage}
                    onChange={handleAvatarChange}
                    triggerToast={triggerToast}
                    label="Photo de profil"
                    aspectRatio="square"
                    className="avatar-inline-picker"
                    buttonText="📷 Modifier photo"
                  />
                </div>
                <div className="profile-hero-details">
                  <h3>{formData.name}</h3>
                  <span className="role-tag-luxury">{formData.artisanType || formData.role}</span>
                  <p className="profile-city-text">📍 {formData.city} • 🇨🇲 Cameroon</p>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-label">{t.email}</span>
                  <span className="info-value">{formData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.phone}</span>
                  <span className="info-value">{formData.phone}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Professional Bio / Scope</span>
                  <p className="info-bio-value">{formData.bio}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">Verification Rank</span>
                  <span className="rank-badge-gold">⭐⭐⭐⭐⭐ MASTER RANK</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Escrow Protection</span>
                  <span className="escrow-active-tag">Active (FCFA Guarantee)</span>
                </div>
              </div>

              <div className="settings-actions-footer">
                <button className="btn-outline-gold" onClick={() => setActiveTab('edit')}>
                  Edit Profile Information ✏️
                </button>
                <button className="btn-danger-logout" onClick={onLogout}>
                  🚪 {t.logout}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="settings-edit-form">
              <div className="form-field-group avatar-edit-section">
                <label className="field-label">Photo de profil (Galerie ou Caméra)</label>
                <div className="avatar-edit-preview-row">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Avatar"
                      className="avatar-edit-thumb"
                    />
                  ) : (
                    <div className="avatar-edit-placeholder">
                      {formData.name.charAt(0)}
                    </div>
                  )}
                  <ImageCapturePicker
                    value={formData.profileImage}
                    onChange={handleAvatarChange}
                    triggerToast={triggerToast}
                    label="Photo de profil"
                    aspectRatio="square"
                    buttonText="📁 Choisir / 📷 Caméra"
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label">{t.fullName}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="luxury-input-full"
                  required
                />
              </div>

              <div className="form-two-col">
                <div className="form-field-group">
                  <label className="field-label">{t.email}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="luxury-input-full"
                    required
                  />
                </div>
                <div className="form-field-group">
                  <label className="field-label">{t.phone}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="luxury-input-full"
                    required
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label">City / Region in Cameroon</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="luxury-input-full"
                  placeholder="e.g. Douala (Akwa) or Yaoundé (Bastos)"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Bio & Specializations</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="luxury-textarea-full"
                  rows="3"
                ></textarea>
              </div>

              <div className="settings-actions-footer">
                <button type="button" className="btn-secondary" onClick={() => setActiveTab('profile')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-gold">
                  Save Changes ✓
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: LEGAL & TERMS */}
          {activeTab === 'legal' && (
            <div className="settings-legal-view">
              <div className="legal-section-block">
                <h4>📜 {t.termsTitle}</h4>
                <p>{t.termsText}</p>
              </div>

              <div className="legal-section-block">
                <h4>🔒 Escrow & Franc CFA (FCFA) Payment Policy</h4>
                <p>
                  Funds deposited into Skillora are held securely in escrow until mission completion. Payouts are dispatched to Mobile Money (MTN MoMo or Orange Money) only upon client confirmation or verified arbitration.
                </p>
              </div>

              <div className="legal-section-block">
                <h4>🛡️ Single vs Grouped Artisan Verification</h4>
                <p>
                  - <strong>Single Artisans</strong> are certified through national ID verification, diploma/certificate authentication, portfolio validation, and video proof.<br/>
                  - <strong>Grouped Artisans (Enterprises/Workshops)</strong> are certified through commercial registration (RCCM/NIU), team license audits, and supervisor background evaluations.
                </p>
              </div>

              <div className="settings-actions-footer">
                <button className="btn-secondary" onClick={() => setActiveTab('profile')}>
                  Back to Profile
                </button>
                <button className="btn-danger-logout" onClick={onLogout}>
                  🚪 {t.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

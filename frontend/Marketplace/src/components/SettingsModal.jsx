import React, { useEffect, useState } from 'react';
import ImageCapturePicker from './ImageCapturePicker';
import { api } from '../api';

const formFromUser = (user) => {
  const prof = user?.professionalProfile || {};
  return {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    artisanType: prof.artisanType === 'GROUPED' ? 'Grouped Artisan (Workshop)' : prof.artisanType ? 'Single Artisan' : '',
    city: user?.city || '',
    bio: prof.bio || '',
    profession: prof.profession || '',
    experience: prof.experience ?? '',
    profileImage: user?.profileImage || '',
    latitude: prof.latitude ?? null,
    longitude: prof.longitude ?? null,
    serviceArea: prof.serviceArea || '',
    locationVisibility: prof.locationVisibility || 'APPROXIMATE',
  };
};

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
  const [formData, setFormData] = useState(() => formFromUser(currentUser));
  const [isSaving, setIsSaving] = useState(false);
  const isArtisan = currentUser?.role === 'PROFESSIONAL';

  // Reload the form from the real account each time the modal opens
  useEffect(() => {
    if (isOpen) setFormData(formFromUser(currentUser));
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleDetectDeviceLocation = () => {
    if (!navigator.geolocation) {
      triggerToast('Geolocation not supported by your browser', '⚠️');
      return;
    }
    triggerToast('Detecting device location...', '📍');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lon = Math.round(pos.coords.longitude * 10000) / 10000;
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        try {
          if (isArtisan) {
            await api('/professionals/location', {
              method: 'PUT',
              body: { latitude: lat, longitude: lon, serviceArea: formData.serviceArea, locationVisibility: formData.locationVisibility },
            });
          } else {
            await api('/users/location', { method: 'PUT', body: { latitude: lat, longitude: lon } });
          }
          triggerToast(`Location saved: Lat ${lat}°, Lon ${lon}°`, '🟢');
        } catch (err) {
          triggerToast(err.message, '⚠️');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          triggerToast('Location permission denied.', '⚠️');
        } else {
          triggerToast('Could not retrieve location.', '❌');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const [firstName, ...rest] = formData.name.trim().split(/\s+/);
    setIsSaving(true);
    try {
      const userRes = await api(`/users/${currentUser.id}`, {
        method: 'PUT',
        body: { firstName, lastName: rest.join(' ') || currentUser.lastName, phone: formData.phone, location: formData.city },
      });

      let professionalProfile = currentUser.professionalProfile;
      if (isArtisan && currentUser.professionalId) {
        const profRes = await api(`/professionals/${currentUser.professionalId}`, {
          method: 'PUT',
          body: {
            profession: formData.profession.trim() || undefined,
            experience: formData.experience === '' ? undefined : Number(formData.experience),
            bio: formData.bio,
            serviceArea: formData.serviceArea,
            locationVisibility: formData.locationVisibility,
            latitude: formData.latitude,
            longitude: formData.longitude,
          },
        });
        professionalProfile = profRes.data;
      }

      const u = userRes.data;
      setCurrentUser({
        ...currentUser,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName} ${u.lastName}`.trim(),
        phone: u.phone || '',
        city: u.location || '',
        location: u.location || '',
        professionalProfile,
      });
      triggerToast(t.editSuccess, '✓');
      setActiveTab('profile');
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setIsSaving(false);
    }
  };

  // The picker uploads to /upload/profile-image, which already saves it on the account
  const handleAvatarChange = (newUrl) => {
    setFormData((prev) => ({ ...prev, profileImage: newUrl }));
    setCurrentUser({ ...currentUser, profileImage: newUrl || null });
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
                    uploadPath="/upload/profile-image"
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
                    uploadPath="/upload/profile-image"
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
                    readOnly
                    title="Email cannot be changed"
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

              {isArtisan && (<>
              <div className="form-field-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="field-label">Métier / Trade</label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="luxury-input-full"
                    placeholder="Électricien, Plombier, Menuisier…"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Expérience (ans)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="luxury-input-full"
                  />
                </div>
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

              {/* Geolocation & Service Area Configuration */}
              <div className="form-field-group" style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.2)', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="field-label" style={{ color: 'var(--primary)', margin: 0 }}>📍 Geolocation & Service Area Settings</label>
                  <button
                    type="button"
                    className="btn-outline-gold"
                    onClick={handleDetectDeviceLocation}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    📍 Use Device Location
                  </button>
                </div>

                <div className="form-two-col">
                  <div className="form-field-group">
                    <label className="field-label" style={{ fontSize: '0.8rem' }}>Latitude (°N)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude ?? ''}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : null })}
                      className="luxury-input-full"
                      placeholder="e.g. 3.8883"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label" style={{ fontSize: '0.8rem' }}>Longitude (°E)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude ?? ''}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : null })}
                      className="luxury-input-full"
                      placeholder="e.g. 11.5175"
                    />
                  </div>
                </div>

                <div className="form-two-col">
                  <div className="form-field-group">
                    <label className="field-label" style={{ fontSize: '0.8rem' }}>Service Area / Operational Radius</label>
                    <input
                      type="text"
                      value={formData.serviceArea || ''}
                      onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                      className="luxury-input-full"
                      placeholder="e.g. Yaoundé & Bastos (15 km radius)"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label" style={{ fontSize: '0.8rem' }}>Location Privacy Setting</label>
                    <select
                      value={formData.locationVisibility}
                      onChange={(e) => setFormData({ ...formData, locationVisibility: e.target.value })}
                      className="luxury-input-full"
                      style={{ background: 'var(--bg-dark)', color: 'var(--text-light)' }}
                    >
                      <option value="APPROXIMATE">Approximate (Shows distance like "2.4 km away")</option>
                      <option value="CITY_ONLY">City Only (Shows city, hides coordinates)</option>
                      <option value="EXACT">Exact Location</option>
                    </select>
                  </div>
                </div>
              </div>
              </>)}

              <div className="settings-actions-footer">
                <button type="button" className="btn-secondary" onClick={() => setActiveTab('profile')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-gold" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes ✓'}
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

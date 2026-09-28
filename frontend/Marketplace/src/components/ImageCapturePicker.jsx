import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';

/**
 * ImageCapturePicker Component
 * Allows photo selection from device gallery and direct live camera snapshot.
 * Supports image preview, change, remove, validation, and direct upload to Skillora API.
 */
export default function ImageCapturePicker({
  value,
  onChange,
  onUploadSuccess,
  label = 'Photo',
  aspectRatio = 'square', // 'square' | 'banner' | 'free'
  // API path under /api: '/upload/image' (generic), '/upload/profile-image', '/upload/artisan-cover'
  uploadPath = '/upload/image',
  maxSizeMB = 10,
  lang = 'fr',
  triggerToast = () => {},
  showTriggerButton = true,
  buttonText = null,
  className = '',
  enableCamera = true
}) {
  const isFrench = lang === 'fr';

  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('gallery'); // 'gallery' | 'camera' | 'preview'
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [cameraStream, setCameraStream] = useState(null);

  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value && value !== previewUrl) {
      setPreviewUrl(value);
    }
  }, [value]);

  // Clean up camera stream on unmount or mode switch
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Start Live Camera
  const startCamera = async (mode = facingMode) => {
    stopCameraStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        isFrench
          ? "La caméra en direct n'est pas prise en charge par ce navigateur. Utilisez le bouton mobile ci-dessous."
          : "Direct camera stream is not supported in this browser. Use mobile fallback."
      );
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError(
        isFrench
          ? "Accès caméra refusé ou indisponible. Vous pouvez importer une photo depuis la galerie ou utiliser le sélecteur d'appareil."
          : "Camera access denied or unavailable. You can pick from gallery or use device capture."
      );
    }
  };

  // Switch between front & back camera
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Trigger when switching tabs inside modal
  const handleSwitchTab = (tab) => {
    setActiveMode(tab);
    if (tab === 'camera') {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
  };

  // Handle file selection from disk/gallery
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      triggerToast(
        isFrench ? "Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP)" : "Please select a valid image file (JPG, PNG, WEBP)",
        '⚠️'
      );
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      triggerToast(
        isFrench ? `L'image dépasse la limite de ${maxSizeMB} Mo` : `Image exceeds ${maxSizeMB}MB limit`,
        '⚠️'
      );
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setPreviewUrl(loadEvt.target.result);
      setActiveMode('preview');
      stopCameraStream();
    };
    reader.readAsDataURL(file);
  };

  // Capture snapshot from live video stream
  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      // Mirror effect for front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    setSelectedFile(null); // base64 string will be uploaded
    setActiveMode('preview');
    stopCameraStream();
  };

  // Clear / Remove image
  const handleRemoveImage = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
    if (onChange) onChange('');
    triggerToast(isFrench ? "Image supprimée" : "Image removed", '🗑️');
    setIsOpen(false);
  };

  // Confirm and Upload Image to Backend
  const handleConfirmUpload = async () => {
    if (!previewUrl) {
      triggerToast(isFrench ? "Aucune image sélectionnée" : "No image selected", '⚠️');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to the backend; only a server URL is ever handed back to the caller
      const result = await api(uploadPath, { method: 'POST', body: { image: previewUrl } });
      const finalUrl = result.data?.coverPhoto || result.data?.profileImage || result.data?.url;
      if (!finalUrl) throw new Error(isFrench ? "Réponse du serveur invalide" : 'Invalid server response');

      triggerToast(isFrench ? "Photo enregistrée avec succès !" : "Photo saved successfully!", '✓');
      if (onChange) onChange(finalUrl);
      if (onUploadSuccess) onUploadSuccess(finalUrl);
      setIsOpen(false);
      stopCameraStream();
    } catch (err) {
      triggerToast(
        (isFrench ? "Échec de l'envoi de la photo : " : 'Photo upload failed: ') + err.message,
        '⚠️'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    if (previewUrl) {
      setActiveMode('preview');
    } else {
      setActiveMode('gallery');
    }
  };

  const handleCloseModal = () => {
    stopCameraStream();
    setIsOpen(false);
  };

  return (
    <div className={`skillora-image-picker-root ${className}`}>
      {/* Trigger Button or Display Thumbnail */}
      {showTriggerButton && (
        <div className="picker-trigger-wrapper">
          <button
            type="button"
            className="btn-skillora-picker-trigger"
            onClick={handleOpenModal}
          >
            <span className="trigger-icon">📷</span>
            <span>
              {buttonText ||
                (previewUrl
                  ? isFrench
                    ? "Changer l'image"
                    : "Change image"
                  : isFrench
                  ? "Choisir ou Prendre une Photo"
                  : "Pick or Snap Photo")}
            </span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={mobileCameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {/* MODAL DIALOG */}
      {isOpen && (
        <div className="image-picker-backdrop" onClick={handleCloseModal}>
          <div
            className="image-picker-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="picker-modal-header">
              <div className="picker-header-title">
                <span className="picker-header-icon">📸</span>
                <div>
                  <h3 className="picker-title-text">{label}</h3>
                  <p className="picker-subtitle-text">
                    {isFrench
                      ? "Sélectionnez depuis votre galerie ou prenez une photo en direct"
                      : "Pick from device gallery or capture live with camera"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="picker-close-btn"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            {/* Nav Tabs */}
            <div className="picker-tabs-row">
              <button
                type="button"
                className={`picker-tab-btn ${activeMode === 'gallery' ? 'active' : ''}`}
                onClick={() => handleSwitchTab('gallery')}
              >
                📁 {isFrench ? "Galerie / Fichiers" : "Gallery / Files"}
              </button>
              {enableCamera && (
                <button
                  type="button"
                  className={`picker-tab-btn ${activeMode === 'camera' ? 'active' : ''}`}
                  onClick={() => handleSwitchTab('camera')}
                >
                  📷 {isFrench ? "Caméra en direct" : "Live Camera"}
                </button>
              )}
              {previewUrl && (
                <button
                  type="button"
                  className={`picker-tab-btn ${activeMode === 'preview' ? 'active' : ''}`}
                  onClick={() => handleSwitchTab('preview')}
                >
                  👁️ {isFrench ? "Aperçu & Validation" : "Preview & Save"}
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="picker-modal-body">
              {/* 1. GALLERY SELECTION MODE */}
              {activeMode === 'gallery' && (
                <div className="picker-gallery-zone">
                  <div
                    className="picker-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <div className="dropzone-icon-circle">
                      <span>📁</span>
                    </div>
                    <h4>{isFrench ? "Cliquez pour choisir une photo" : "Click to select a photo"}</h4>
                    <p className="dropzone-hint">
                      {isFrench
                        ? `Formats autorisés: JPG, PNG, WEBP (Max ${maxSizeMB} Mo)`
                        : `Allowed formats: JPG, PNG, WEBP (Max ${maxSizeMB}MB)`}
                    </p>
                    <button
                      type="button"
                      className="btn-browse-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current && fileInputRef.current.click();
                      }}
                    >
                      {isFrench ? "Parcourir les fichiers" : "Browse Files"}
                    </button>
                  </div>

                  <div className="picker-quick-actions-bar">
                    <button
                      type="button"
                      className="btn-mobile-camera-snap"
                      onClick={() => mobileCameraInputRef.current && mobileCameraInputRef.current.click()}
                    >
                      📱 {isFrench ? "Capture directe appareil (Mobile)" : "Device Camera (Mobile)"}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. LIVE CAMERA MODE */}
              {activeMode === 'camera' && (
                <div className="picker-camera-zone">
                  {cameraError ? (
                    <div className="camera-error-banner">
                      <p>⚠️ {cameraError}</p>
                      <button
                        type="button"
                        className="btn-mobile-camera-snap"
                        onClick={() => mobileCameraInputRef.current && mobileCameraInputRef.current.click()}
                      >
                        📱 {isFrench ? "Prendre une photo avec l'appareil" : "Take photo with device camera"}
                      </button>
                    </div>
                  ) : (
                    <div className="live-camera-feed-container">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`live-video-player ${facingMode === 'user' ? 'mirror' : ''}`}
                      />

                      {/* Camera Viewfinder Overlay */}
                      <div className="camera-viewfinder-overlay">
                        <div className="viewfinder-corner top-left"></div>
                        <div className="viewfinder-corner top-right"></div>
                        <div className="viewfinder-corner bottom-left"></div>
                        <div className="viewfinder-corner bottom-right"></div>
                      </div>

                      {/* Camera Controls Bar */}
                      <div className="camera-controls-bottom-bar">
                        <button
                          type="button"
                          className="btn-camera-flip"
                          onClick={toggleCameraFacing}
                          title={isFrench ? "Changer de caméra" : "Flip camera"}
                        >
                          🔄
                        </button>

                        <button
                          type="button"
                          className="btn-camera-shutter"
                          onClick={capturePhotoFromCamera}
                          title={isFrench ? "Prendre la photo" : "Take photo"}
                        >
                          <span className="shutter-inner-ring"></span>
                        </button>

                        <button
                          type="button"
                          className="btn-camera-fallback-file"
                          onClick={() => mobileCameraInputRef.current && mobileCameraInputRef.current.click()}
                          title={isFrench ? "Appareil photo système" : "System camera"}
                        >
                          📱
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. PREVIEW & CONFIRMATION MODE */}
              {activeMode === 'preview' && (
                <div className="picker-preview-zone">
                  <div className={`preview-image-frame ${aspectRatio}`}>
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="preview-img-display"
                    />
                    <div className="preview-status-pill">
                      ✓ {isFrench ? "Image Prête" : "Ready"}
                    </div>
                  </div>

                  <div className="preview-action-buttons">
                    <button
                      type="button"
                      className="btn-picker-change"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      🔄 {isFrench ? "Remplacer" : "Change"}
                    </button>
                    {enableCamera && (
                      <button
                        type="button"
                        className="btn-picker-retake"
                        onClick={() => handleSwitchTab('camera')}
                      >
                        📷 {isFrench ? "Reprendre" : "Retake"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-picker-delete"
                      onClick={handleRemoveImage}
                    >
                      🗑️ {isFrench ? "Supprimer" : "Remove"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="picker-modal-footer">
              <button
                type="button"
                className="btn-picker-cancel"
                onClick={handleCloseModal}
              >
                {isFrench ? "Annuler" : "Cancel"}
              </button>

              {activeMode === 'preview' && previewUrl && (
                <button
                  type="button"
                  className="btn-picker-confirm"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span>⏳ {isFrench ? "Téléversement..." : "Uploading..."}</span>
                  ) : (
                    <span>✓ {isFrench ? "Valider & Enregistrer" : "Confirm & Save"}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

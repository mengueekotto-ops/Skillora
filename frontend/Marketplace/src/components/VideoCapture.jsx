import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * VideoCapture — Live camera recorder for Artisan Onboarding (Step 2)
 * Robust features:
 * - Cascading getUserMedia fallback (video+audio -> video only -> loose constraints)
 * - Immediate stream binding with onloadedmetadata listener
 * - File upload fallback (if webcam is missing or permission is blocked)
 * - 60s hard recording limit with visual countdown ring & progress bar
 * - Pulsing recording indicator
 * - Manual upload trigger with realistic upload handling & fallback
 * - Retake / Re-record capability
 * - Glassmorphism cyber-luxury design matching Skillora
 */
export default function VideoCapture({
  onRecordComplete,
  onUploadSuccess,
  triggerToast,
  lang = 'fr',
  maxDuration = 60,
}) {
  const isFr = lang === 'fr';

  // Stream & Recording State
  const [cameraStream, setCameraStream] = useState(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAudioTrack, setHasAudioTrack] = useState(true);

  // Refs
  const videoPreviewRef = useRef(null);
  const playbackRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const countdownIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Safely stop all tracks
  const stopStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setStreamActive(false);
  }, [cameraStream]);

  // Keep videoPreviewRef connected whenever cameraStream updates
  useEffect(() => {
    const videoEl = videoPreviewRef.current;
    if (videoEl && cameraStream) {
      videoEl.srcObject = cameraStream;
      videoEl.onloadedmetadata = () => {
        videoEl.play().catch((e) => console.warn('Video play warning:', e));
      };
    }
  }, [cameraStream, streamActive]);

  // Clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [cameraStream, recordedUrl]);

  // Request & start camera stream with multi-level resilient fallback
  const startCamera = async () => {
    setErrorMessage('');
    setIsStartingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = isFr
        ? 'Votre navigateur ne supporte pas l\'accès caméra direct ou le site n\'est pas dans un contexte sécurisé (localhost / HTTPS). Utilisez le bouton d\'import de fichier ci-dessous.'
        : 'Direct camera access is not supported in this browser context. Please use file upload below.';
      setErrorMessage(msg);
      setIsStartingCamera(false);
      triggerToast?.(msg, '⚠️');
      return;
    }

    let stream = null;
    let audioOk = true;

    // Step 1: Try HD Video + Audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
    } catch (err1) {
      console.warn('Attempt 1 (HD video + audio) failed:', err1.name, err1.message);

      // Step 2: Try basic Video + Audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err2) {
        console.warn('Attempt 2 (basic video + audio) failed:', err2.name, err2.message);

        // Step 3: Try Video ONLY (no audio: avoids failure when microphone is missing or denied)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          audioOk = false;
        } catch (err3) {
          console.warn('Attempt 3 (video user facing only) failed:', err3.name, err3.message);

          // Step 4: Loosest constraint possible (any available video device)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            audioOk = false;
          } catch (err4) {
            console.error('All camera attempts failed:', err4);
            setIsStartingCamera(false);

            let msg = '';
            if (err4.name === 'NotAllowedError' || err4.name === 'PermissionDeniedError') {
              msg = isFr
                ? 'Accès caméra refusé. Veuillez cliquer sur l\'icône de cadenas ou caméra dans la barre d\'adresse pour autoriser la caméra, ou importez une vidéo.'
                : 'Camera permission denied. Please allow camera in the browser address bar, or upload a video file.';
            } else if (err4.name === 'NotFoundError' || err4.name === 'DevicesNotFoundError') {
              msg = isFr
                ? 'Aucune webcam détectée sur cet appareil. Vous pouvez importer directement une vidéo enregistrée ci-dessous.'
                : 'No webcam found on this device. You can upload a recorded video file below.';
            } else {
              msg = isFr
                ? `Impossible d'activer la caméra (${err4.name || 'erreur système'}). Vous pouvez importer un fichier vidéo.`
                : `Could not start camera (${err4.name || 'system error'}). You can upload a video file.`;
            }

            setErrorMessage(msg);
            triggerToast?.(msg, '⚠️');
            return;
          }
        }
      }
    }

    if (stream) {
      setHasAudioTrack(audioOk);
      setCameraStream(stream);
      setStreamActive(true);
      setIsStartingCamera(false);

      if (!audioOk) {
        triggerToast?.(
          isFr
            ? 'Caméra activée (sans microphone). Vous pouvez enregistrer votre présentation.'
            : 'Camera on (no microphone). You can record your presentation.',
          'ℹ️'
        );
      } else {
        triggerToast?.(isFr ? 'Caméra et micro activés !' : 'Camera and mic ready!', '📸');
      }
    }
  };

  // Handle Stop Recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Handle Start Recording
  const startRecording = () => {
    if (!cameraStream) {
      startCamera().then(() => beginMediaRecorder(cameraStream));
      return;
    }
    beginMediaRecorder(cameraStream);
  };

  const beginMediaRecorder = (activeStream) => {
    const stream = activeStream || cameraStream;
    if (!stream) return;

    try {
      recordedChunksRef.current = [];

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setIsUploaded(false);
        stopStream();
        onRecordComplete?.(url);
        triggerToast?.(isFr ? 'Vidéo enregistrée avec succès !' : 'Video recorded successfully!', '🎥');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1s slices
      setIsRecording(true);
      setTimeLeft(maxDuration);

      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      triggerToast?.(isFr ? 'Erreur lors du lancement de l\'enregistrement.' : 'Failed to start recording.', '❌');
    }
  };

  // Handle Video File Upload fallback
  const handleFileSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      triggerToast?.(
        isFr ? 'Veuillez sélectionner un fichier vidéo valide (MP4, WEBM, MOV).' : 'Please select a valid video file (MP4, WEBM, MOV).',
        '⚠️'
      );
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      triggerToast?.(isFr ? 'La vidéo ne doit pas dépasser 100 Mo.' : 'Video must not exceed 100MB.', '⚠️');
      return;
    }

    stopStream();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);

    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setRecordedUrl(url);
    setIsUploaded(false);
    onRecordComplete?.(url);
    triggerToast?.(isFr ? 'Vidéo importée avec succès !' : 'Video imported successfully!', '📁');
  };

  // Re-record / Retake
  const handleRetake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setIsUploaded(false);
    setTimeLeft(maxDuration);
    startCamera();
  };

  // Upload to the logged-in artisan's profile (saved as videoUrl)
  const handleManualUpload = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      const fileName = recordedBlob.name || (recordedBlob.type.includes('mp4') ? 'presentation.mp4' : 'presentation.webm');
      formData.append('video', recordedBlob, fileName);

      const data = await api('/upload/video', { method: 'POST', formData });
      const returnedUrl = data.data.url;

      setIsUploaded(true);
      onUploadSuccess?.(returnedUrl);
      onRecordComplete?.(returnedUrl);
      triggerToast?.(
        isFr ? '✓ Vidéo de présentation enregistrée !' : '✓ Presentation video uploaded!',
        '✅'
      );
    } catch (err) {
      triggerToast?.(
        (isFr ? 'Erreur lors du téléversement de la vidéo : ' : 'Failed to upload video: ') + err.message,
        '❌'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const progressPercent = ((maxDuration - timeLeft) / maxDuration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div style={styles.container}>
      {/* Dynamic Keyframes for Pulsing Red Dot & Shimmer */}
      <style>{`
        @keyframes recPulse {
          0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { transform: scale(1.15); opacity: 0.85; box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        .vc-btn-record:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45) !important;
        }
        .vc-btn-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(62, 180, 137, 0.35) !important;
        }
      `}</style>

      {/* Hidden File Input for video upload fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Header Info */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🎥</span>
          <div>
            <h4 style={styles.title}>
              {isFr ? 'Vidéo de Présentation en Direct' : 'Live Video Presentation'}
            </h4>
            <p style={styles.subtitle}>
              {isFr
                ? 'Présentez-vous en 1 minute (nom, métier, réalisations et méthode de travail).'
                : '1-minute pitch (name, trade, key achievements, and work ethics).'}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        {isRecording && (
          <div style={styles.recBadge}>
            <span style={styles.recDot} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              REC {formattedTime}
            </span>
          </div>
        )}
      </div>

      {/* Error Notice if any */}
      {errorMessage && (
        <div style={styles.errorBox}>
          <div>
            <span style={{ fontWeight: 700 }}>⚠️ </span>
            <span>{errorMessage}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button style={styles.btnSmall} onClick={startCamera}>
              🔄 {isFr ? 'Réessayer' : 'Retry'}
            </button>
            <button style={{ ...styles.btnSmall, background: '#10b981', color: '#fff' }} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              📁 {isFr ? 'Importer un fichier' : 'Upload file'}
            </button>
          </div>
        </div>
      )}

      {/* Video Viewport Area */}
      <div style={styles.viewport}>
        {/* Case 1: Recorded Video Preview ready for playback */}
        {recordedUrl ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
              ref={playbackRef}
              src={recordedUrl}
              controls
              playsInline
              style={styles.videoPlayer}
            />
            {isUploaded && (
              <div style={styles.uploadedBadgeOverlay}>
                <span style={{ fontSize: '1.4rem' }}>✓</span>
                <span>{isFr ? 'Vidéo validée & transmise au coffre' : 'Video verified & uploaded'}</span>
              </div>
            )}
          </div>
        ) : (
          /* Case 2: Live Camera View or Idle Screen */
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0d14' }}>
            {/* Live Camera View Element (Kept in DOM so stream attaches seamlessly) */}
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              style={{
                ...styles.videoPlayer,
                display: streamActive ? 'block' : 'none',
                transform: 'scaleX(-1)', // Mirror effect for natural webcam feeling
              }}
            />

            {/* Placeholder when Camera is Off */}
            {!streamActive && (
              <div style={styles.cameraOffPlaceholder}>
                <div style={styles.camIconCircle}>📹</div>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 1rem 0', maxWidth: '380px' }}>
                  {isFr
                    ? 'Activez votre caméra pour vous filmer en direct, ou importez une vidéo déjà prête.'
                    : 'Turn on camera to record live, or upload an existing video file.'}
                </p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    style={{
                      ...styles.btnPrimary,
                      opacity: isStartingCamera ? 0.7 : 1,
                      cursor: isStartingCamera ? 'wait' : 'pointer',
                    }}
                    onClick={startCamera}
                    disabled={isStartingCamera}
                  >
                    {isStartingCamera ? (
                      <>
                        <span style={styles.smallSpinner} />
                        {isFr ? 'Connexion à la caméra…' : 'Connecting to camera…'}
                      </>
                    ) : (
                      <>
                        📸 {isFr ? 'Activer la Caméra' : 'Turn On Camera'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    style={styles.btnSecondary}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    📁 {isFr ? 'Importer un Fichier Vidéo' : 'Upload Video File'}
                  </button>
                </div>
              </div>
            )}

            {/* Live Recording HUD overlay */}
            {streamActive && isRecording && (
              <div style={styles.hudOverlay}>
                <div style={styles.hudTop}>
                  <span style={styles.hudTimer}>{formattedTime}</span>
                  <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                    {isFr ? 'Max 60 secondes' : 'Max 60 seconds'}
                  </span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons Toolbar */}
      <div style={styles.toolbar}>
        {/* State A: Stream active & not recording yet */}
        {streamActive && !isRecording && !recordedUrl && (
          <div style={styles.btnGroup}>
            <button
              type="button"
              className="vc-btn-record"
              style={styles.btnRecord}
              onClick={startRecording}
            >
              <span style={styles.recordCircle} />
              {isFr ? 'Démarrer l\'Enregistrement (60s)' : 'Start Recording (60s)'}
            </button>
            <button
              type="button"
              style={styles.btnSecondary}
              onClick={stopStream}
            >
              {isFr ? 'Couper la caméra' : 'Disable Camera'}
            </button>
          </div>
        )}

        {/* State B: Currently recording */}
        {isRecording && (
          <button
            type="button"
            style={styles.btnStop}
            onClick={stopRecording}
          >
            <span style={styles.stopSquare} />
            {isFr ? 'Arrêter l\'Enregistrement' : 'Stop Recording'}
          </button>
        )}

        {/* State C: Recording complete, review & manual upload trigger */}
        {recordedUrl && (
          <div style={styles.btnGroupRecorded}>
            <button
              type="button"
              style={styles.btnSecondary}
              onClick={handleRetake}
              disabled={isUploading}
            >
              🔄 {isFr ? 'Recommencer' : 'Retake Video'}
            </button>

            {!isUploaded ? (
              <button
                type="button"
                className="vc-btn-action"
                style={{
                  ...styles.btnUpload,
                  opacity: isUploading ? 0.7 : 1,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
                onClick={handleManualUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span style={styles.smallSpinner} />
                    {isFr ? 'Téléversement & Chiffrement...' : 'Uploading & Encrypting...'}
                  </>
                ) : (
                  <>
                    📤 {isFr ? 'Valider et Téléverser la Vidéo' : 'Confirm & Upload Video'}
                  </>
                )}
              </button>
            ) : (
              <div style={styles.badgeSuccess}>
                ✓ {isFr ? 'Vidéo enregistrée et validée' : 'Video saved & validated'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles — Cyber-luxury Glassmorphism Design System
// ──────────────────────────────────────────────────────────────────────────────
const styles = {
  container: {
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(62, 180, 137, 0.3)',
    borderRadius: '16px',
    padding: '1.25rem',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
    marginBottom: '1.5rem',
    color: '#e2e8f0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#3eb489',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.8rem',
    color: '#94a3b8',
    maxWidth: '480px',
  },
  recBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.18)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#f87171',
  },
  recDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#ef4444',
    animation: 'recPulse 1.4s infinite',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    marginBottom: '0.85rem',
    lineHeight: 1.5,
  },
  viewport: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    maxHeight: '340px',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#07090e',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cameraOffPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
  camIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(62, 180, 137, 0.12)',
    border: '1px solid rgba(62, 180, 137, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
    marginBottom: '0.75rem',
  },
  hudOverlay: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    right: '12px',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  hudTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  hudTimer: {
    fontSize: '0.9rem',
    fontWeight: 800,
    color: '#ef4444',
    fontVariantNumeric: 'tabular-nums',
  },
  progressTrack: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
    transition: 'width 1s linear',
  },
  uploadedBadgeOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(5, 150, 105, 0.9)',
    backdropFilter: 'blur(8px)',
    color: '#ffffff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.4)',
  },
  toolbar: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.75rem',
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnGroupRecorded: {
    display: 'flex',
    gap: '0.75rem',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btnRecord: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.4rem',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  recordCircle: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#ffffff',
  },
  btnStop: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1e293b',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    padding: '0.65rem 1.4rem',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  stopSquare: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    background: '#ef4444',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.4rem',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnUpload: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #3eb489, #059669)',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.4rem',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnSecondary: {
    background: 'rgba(255, 255, 255, 0.07)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '0.65rem 1.2rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnSmall: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  badgeSuccess: {
    color: '#34d399',
    fontSize: '0.85rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(52, 211, 153, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(52, 211, 153, 0.3)',
  },
  smallSpinner: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    display: 'inline-block',
    animation: 'spinSlow 0.8s linear infinite',
  },
};

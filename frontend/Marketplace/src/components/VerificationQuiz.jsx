import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

// ──────────────────────────────────────────────────────────────────────────────
// VerificationQuiz — Skillora Automated Artisan Certification Quiz
// 10 AI-generated MCQs | 30s per question timer | 60% to pass
// ──────────────────────────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D'];
const TIME_PER_QUESTION = 30;
const TOTAL_QUESTIONS = 10;

export default function VerificationQuiz({
  artisan,        // { id, _id, professionalId, profession, name }
  profession: propProfession,
  lang = 'fr',
  triggerToast,
  onClose,        // called to close the modal
  onVerified,     // called with result data when badge is awarded
  onComplete,     // called when passing quiz to advance onboarding
  onResult,       // called with every graded result (pass or fail)
  isModal = false,
}) {
  const isFr = lang === 'fr';
  // Without an id the server uses the logged-in artisan's own profile
  const artisanId = artisan?.professionalId || artisan?.id || artisan?._id || null;
  const profession = propProfession || artisan?.profession || (isFr ? 'Artisan Général' : 'General Artisan');

  // ── Screen FSM ──────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState('intro'); // intro | loading | quiz | result | timeout

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [questions, setQuestions]       = useState([]);
  const [sessionToken, setSessionToken] = useState(null);
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [answers, setAnswers]           = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  // ── Timer ───────────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]   = useState(TIME_PER_QUESTION);
  const timerRef                  = useRef(null);
  const timedOutRef               = useRef(false);

  // ── Result ──────────────────────────────────────────────────────────────────
  const [result, setResult]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // ── Loading message cycling ─────────────────────────────────────────────────
  const loadingMsgs = isFr
    ? ['🔍 Analyse de votre profession…', '🧠 Génération IA en cours…', '📋 Calibrage niveau O-Level…', '✅ Préparation de l\'examen…']
    : ['🔍 Analyzing your profession…', '🧠 Generating AI questions…', '📋 Calibrating O-Level difficulty…', '✅ Preparing your assessment…'];

  // ── Start Quiz (questions and grading always come from the server) ─────────
  const startQuiz = useCallback(async () => {
    timedOutRef.current = false;
    setScreen('loading');
    let msgIdx = 0;
    setLoadingMsg(loadingMsgs[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMsgs.length;
      setLoadingMsg(loadingMsgs[msgIdx]);
    }, 900);

    try {
      const data = await api('/verifications/quiz/start', {
        method: 'POST',
        body: { artisanId: artisanId || undefined, lang },
      });
      if (!Array.isArray(data.data?.questions) || data.data.questions.length === 0) {
        throw new Error(isFr ? 'Questions invalides reçues.' : 'Invalid questions received.');
      }
      setQuestions(data.data.questions);
      setSessionToken(data.data.sessionToken);
      setCurrentIdx(0);
      setAnswers([]);
      setSelectedOption(null);
      setTimeLeft(TIME_PER_QUESTION);
      setScreen('quiz');
    } catch (err) {
      setScreen('intro');
      triggerToast?.(
        (isFr ? 'Impossible de démarrer le quiz : ' : 'Could not start the quiz: ') + err.message,
        '⚠️'
      );
    } finally {
      clearInterval(msgInterval);
    }
  }, [artisanId, lang, isFr, loadingMsgs, triggerToast]);

  // ── Timeout handler ─────────────────────────────────────────────────────────
  const handleTimeout = useCallback(async () => {
    if (timedOutRef.current) return;
    timedOutRef.current = true;
    clearInterval(timerRef.current);
    setScreen('timeout');
    try {
      await api('/verifications/quiz/submit', {
        method: 'POST',
        body: { sessionToken, answers: [], timedOut: true },
      });
    } catch { /* the server also expires unanswered sessions on its own */ }
  }, [sessionToken]);

  // ── Per-question countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'quiz') return;
    clearInterval(timerRef.current);
    setTimeLeft(TIME_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, currentIdx, handleTimeout]);

  // ── Select option ───────────────────────────────────────────────────────────
  const handleSelectOption = (idx) => {
    if (timedOutRef.current) return;
    setSelectedOption(idx);
  };

  // ── Confirm & advance ───────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (selectedOption === null || timedOutRef.current) return;
    clearInterval(timerRef.current);
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);
    if (currentIdx + 1 >= (questions.length || TOTAL_QUESTIONS)) {
      submitQuiz(newAnswers);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  // ── Submit answers; the server grades them and awards the badge ────────────
  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    setScreen('loading');
    setLoadingMsg(isFr ? '📊 Correction de vos réponses…' : '📊 Grading your answers…');

    try {
      const data = await api('/verifications/quiz/submit', {
        method: 'POST',
        body: { sessionToken, answers: finalAnswers, timedOut: false },
      });
      setResult(data.data);
      onResult?.(data.data);
      setScreen('result');
      if (data.data.passed) {
        onVerified?.(data.data);
        triggerToast?.(
          isFr
            ? `🏅 Badge Vérifié obtenu ! Score : ${data.data.scorePercent}%`
            : `🏅 Verified Badge earned! Score: ${data.data.scorePercent}%`,
          '✓'
        );
      }
    } catch (err) {
      setScreen('intro');
      triggerToast?.(
        (isFr ? "Échec de l'envoi du quiz, veuillez recommencer : " : 'Quiz submission failed, please retry: ') + err.message,
        '⚠️'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Timer arc geometry ──────────────────────────────────────────────────────
  const R = 24;
  const circ = 2 * Math.PI * R;
  const dashOffset = circ * (1 - timeLeft / TIME_PER_QUESTION);
  const timerColor = timeLeft > 15 ? '#22d3a8' : timeLeft > 7 ? '#f59e0b' : '#ef4444';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={isModal ? S.overlay : S.inlineContainer}>
      {/* CSS keyframe injector */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,211,168,0.4); } 50% { box-shadow: 0 0 0 12px rgba(34,211,168,0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .vq-option:hover { background: rgba(34, 160, 75,0.15) !important; border-color: rgba(127, 227, 160,0.5) !important; transform: translateX(3px); }
        .vq-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(34, 160, 75,0.6) !important; }
        .vq-btn-secondary:hover { background: rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }
      `}</style>

      <div style={isModal ? S.modal : S.inlineModal}>

        {/* ══ INTRO ══════════════════════════════════════════════════════════ */}
        {screen === 'intro' && (
          <div style={S.center}>
            <div style={S.heroBadge}>🎓</div>
            <h2 style={S.title}>
              {isFr ? 'Test de Certification Skillora' : 'Skillora Certification Quiz'}
            </h2>
            <p style={S.subtitle}>
              {isFr ? 'Profession évaluée : ' : 'Profession assessed: '}
              <strong style={{ color: '#7fe3a0' }}>{profession}</strong>
            </p>

            <div style={S.ruleBox}>
              {[
                { icon: '📋', text: isFr ? '10 questions à choix multiples (A, B, C, D)' : '10 multiple-choice questions (A, B, C, D)' },
                { icon: '⏱', text: isFr ? '30 secondes par question — expiration = réinitialisation automatique' : '30 seconds per question — timeout = automatic reset' },
                { icon: '✅', text: isFr ? 'Score ≥ 60% → Badge Vérifié accordé dans la base de données' : 'Score ≥ 60% → Verified Badge granted in the database' },
                { icon: '🔄', text: isFr ? 'Score < 60% → statut inchangé, nouvelle tentative autorisée' : 'Score < 60% → status unchanged, retry allowed' },
              ].map(({ icon, text }, i) => (
                <div key={i} style={S.ruleRow}>
                  <span style={S.ruleIcon}>{icon}</span>
                  <span style={S.ruleText}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {onClose && (
                <button className="vq-btn-secondary" style={S.btnSecondary} onClick={onClose}>
                  {isFr ? 'Plus tard' : 'Later'}
                </button>
              )}
              <button className="vq-btn-primary" style={{ ...S.btnPrimary, padding: '14px 36px', fontSize: '1rem' }} onClick={startQuiz}>
                🚀 {isFr ? 'Démarrer le test (10 QCM)' : 'Start Assessment (10 MCQs)'}
              </button>
            </div>
          </div>
        )}

        {/* ══ LOADING ════════════════════════════════════════════════════════ */}
        {screen === 'loading' && (
          <div style={S.center}>
            <div style={S.spinner} />
            <p style={{ ...S.subtitle, marginTop: 20, color: '#7fe3a0' }}>{loadingMsg}</p>
          </div>
        )}

        {/* ══ TIMEOUT ════════════════════════════════════════════════════════ */}
        {screen === 'timeout' && (
          <div style={S.center}>
            <div style={{ fontSize: '3.5rem', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }}>⏰</div>
            <h2 style={{ ...S.title, color: '#ef4444' }}>
              {isFr ? 'Temps écoulé !' : 'Time Expired!'}
            </h2>
            <p style={{ ...S.subtitle, maxWidth: 380 }}>
              {isFr
                ? 'Vous avez dépassé le délai imparti sur une question. La session a été réinitialisée pour prévenir la triche. Un nouveau jeu de 10 questions sera généré.'
                : 'You ran out of time on a question. The session has been reset to prevent cheating. A brand new set of 10 questions will be generated.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: 24 }}>
              <button className="vq-btn-secondary" style={S.btnSecondary} onClick={onClose}>
                {isFr ? 'Fermer' : 'Close'}
              </button>
              <button className="vq-btn-primary" style={S.btnPrimary} onClick={startQuiz}>
                🔄 {isFr ? 'Réessayer (nouvelles questions)' : 'Retry (new questions)'}
              </button>
            </div>
          </div>
        )}

        {/* ══ QUIZ ═══════════════════════════════════════════════════════════ */}
        {screen === 'quiz' && questions.length > 0 && (
          <div style={{ width: '100%', animation: 'fadeInUp 0.3s ease' }}>

            {/* Header row */}
            <div style={S.quizHeader}>
              <div>
                <div style={S.questionMeta}>
                  {isFr ? 'Question' : 'Question'}&nbsp;
                  <span style={{ color: '#7fe3a0' }}>{currentIdx + 1}</span>
                  <span style={{ color: '#475569' }}> / {TOTAL_QUESTIONS}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{profession}</div>
              </div>

              {/* Circular timer */}
              <div style={S.timerWrap}>
                <svg width={60} height={60} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                  <circle cx={30} cy={30} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
                  <circle
                    cx={30} cy={30} r={R} fill="none"
                    stroke={timerColor} strokeWidth={4}
                    strokeDasharray={circ} strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
                  />
                </svg>
                <div style={{ ...S.timerNum, color: timerColor }}>{timeLeft}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={S.progressBg}>
              <div style={{ ...S.progressFill, width: `${(currentIdx / TOTAL_QUESTIONS) * 100}%` }} />
            </div>

            {/* Question text */}
            <div style={S.questionBox}>
              <span style={S.qIndex}>{currentIdx + 1}.</span>
              {questions[currentIdx]?.q}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {questions[currentIdx]?.options?.map((opt, i) => (
                <button
                  key={i}
                  className="vq-option"
                  style={{
                    ...S.option,
                    ...(selectedOption === i ? S.optionSelected : {}),
                    transition: 'all 0.18s ease',
                  }}
                  onClick={() => handleSelectOption(i)}
                >
                  <span style={{ ...S.optLetter, ...(selectedOption === i ? S.optLetterSelected : {}) }}>
                    {LETTERS[i]}
                  </span>
                  <span style={S.optText}>{opt}</span>
                  {selectedOption === i && <span style={S.checkMark}>✓</span>}
                </button>
              ))}
            </div>

            {/* Confirm button */}
            <button
              className={selectedOption !== null ? 'vq-btn-primary' : ''}
              style={{
                ...S.btnPrimary,
                width: '100%',
                marginTop: 18,
                opacity: selectedOption === null ? 0.38 : 1,
                cursor: selectedOption === null ? 'not-allowed' : 'pointer',
              }}
              onClick={handleConfirm}
              disabled={selectedOption === null}
            >
              {currentIdx + 1 === TOTAL_QUESTIONS
                ? (isFr ? '📤 Soumettre le test' : '📤 Submit Quiz')
                : (isFr ? 'Confirmer →' : 'Confirm →')}
            </button>

            {/* Answer dot indicators */}
            <div style={S.dots}>
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...S.dot,
                    background: i < answers.length
                      ? '#22d3a8'
                      : i === currentIdx
                      ? '#7fe3a0'
                      : 'rgba(255,255,255,0.1)',
                    transform: i === currentIdx ? 'scale(1.4)' : 'scale(1)',
                    boxShadow: i === currentIdx ? '0 0 8px rgba(127, 227, 160,0.6)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ RESULT ═════════════════════════════════════════════════════════ */}
        {screen === 'result' && result && (
          <div style={{ ...S.center, animation: 'fadeInUp 0.4s ease' }}>
            {/* Pass / Fail badge */}
            {result.passed ? (
              <div style={S.resultBadgePass}>✓</div>
            ) : (
              <div style={S.resultBadgeFail}>✗</div>
            )}

            <h2 style={{ ...S.title, color: result.passed ? '#22d3a8' : '#f87171', marginTop: 4 }}>
              {result.passed
                ? (isFr ? 'Félicitations ! Badge Vérifié 🏅' : 'Congratulations! Verified Badge 🏅')
                : (isFr ? 'Score insuffisant' : 'Score Below Threshold')}
            </h2>

            {/* Score ring */}
            <div style={S.scoreRing}>
              <svg width={130} height={130} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                <circle cx={65} cy={65} r={54} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
                <circle
                  cx={65} cy={65} r={54} fill="none"
                  stroke={result.passed ? '#22d3a8' : '#f87171'}
                  strokeWidth={9}
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - result.scorePercent / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.6s ease-out' }}
                />
              </svg>
              <div style={S.scoreCenter}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: result.passed ? '#22d3a8' : '#f87171', lineHeight: 1 }}>
                  {result.scorePercent}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                  {result.score}/10
                </div>
              </div>
            </div>

            {/* Stats table */}
            <div style={S.statsBox}>
              {[
                { label: isFr ? 'Réponses correctes' : 'Correct answers', value: `${result.score} / 10`, color: '#22d3a8' },
                { label: isFr ? 'Seuil de réussite' : 'Passing threshold', value: '60%', color: '#7fe3a0' },
                { label: isFr ? 'Statut actuel' : 'Current status', value: result.passed ? (isFr ? '✓ Vérifié' : '✓ Verified') : (isFr ? '✗ Non vérifié' : '✗ Unverified'), color: result.passed ? '#22d3a8' : '#f87171' },
                { label: isFr ? 'Tentatives' : 'Total attempts', value: String(result.attempts), color: '#94a3b8' },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={S.statRow}>
                  <span style={S.statLabel}>{label}</span>
                  <span style={{ ...S.statValue, color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Per-question breakdown */}
            {result.detailed && (
              <div style={S.breakdown}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: 8, textAlign: 'left' }}>
                  {isFr ? 'Détail par question :' : 'Per-question breakdown:'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result.detailed.map((d, i) => (
                    <div
                      key={i}
                      title={`Q${d.question}: ${d.isCorrect ? 'Correct' : 'Wrong'} (Your: ${LETTERS[d.given] ?? '?'}, Correct: ${LETTERS[d.expected]})`}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: d.isCorrect ? 'rgba(34,211,168,0.15)' : 'rgba(248,113,113,0.15)',
                        border: `1px solid ${d.isCorrect ? '#22d3a8' : '#f87171'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700,
                        color: d.isCorrect ? '#22d3a8' : '#f87171',
                        cursor: 'default',
                      }}
                    >
                      {d.isCorrect ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encouragement message */}
            {!result.passed && (
              <p style={{ ...S.subtitle, marginTop: 12, color: '#94a3b8', fontSize: '0.83rem' }}>
                {isFr
                  ? `Vous avez obtenu ${result.score}/10. Il vous faut au moins 6/10 (60%) pour obtenir le badge. Réessayez avec de nouvelles questions !`
                  : `You scored ${result.score}/10. You need at least 6/10 (60%) for the badge. Retry with fresh questions!`}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {onClose && (
                <button className="vq-btn-secondary" style={S.btnSecondary} onClick={onClose}>
                  {isFr ? 'Fermer' : 'Close'}
                </button>
              )}
              {!result.passed && (
                <button className="vq-btn-primary" style={S.btnPrimary} onClick={startQuiz}>
                  🔄 {isFr ? 'Réessayer' : 'Try Again'}
                </button>
              )}
              {result.passed && (
                <button
                  className="vq-btn-primary"
                  style={{ ...S.btnPrimary, background: 'linear-gradient(135deg, #059669, #22d3a8)' }}
                  onClick={() => {
                    if (onComplete) onComplete(result);
                    else if (onClose) onClose();
                  }}
                >
                  🚀 {onComplete ? (isFr ? 'Continuer vers Étape 4 →' : 'Continue to Step 4 →') : (isFr ? 'Voir mon profil' : 'View My Profile')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Close button (hidden during quiz to prevent accidental exit, and only if onClose provided) */}
        {screen !== 'quiz' && onClose && (
          <button style={S.closeX} onClick={onClose}>✕</button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — Skillora cyber-luxury palette
// ──────────────────────────────────────────────────────────────────────────────
const S = {
  inlineContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 0',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inlineModal: {
    background: 'linear-gradient(160deg, #0a0f1e 0%, #1a1040 55%, #0a0f1e 100%)',
    border: '1px solid rgba(127, 227, 160, 0.22)',
    borderRadius: 20,
    boxShadow: '0 16px 50px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.1)',
    width: '100%',
    maxWidth: 680,
    padding: 28,
    position: 'relative',
    animation: 'fadeInUp 0.3s ease',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0, 0, 0, 0.82)',
    backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  modal: {
    background: 'linear-gradient(160deg, #0a0f1e 0%, #1a1040 55%, #0a0f1e 100%)',
    border: '1px solid rgba(127, 227, 160, 0.22)',
    borderRadius: 22,
    boxShadow: '0 30px 90px rgba(0,0,0,0.8), 0 0 80px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
    width: '100%', maxWidth: 540,
    maxHeight: '92vh', overflowY: 'auto',
    padding: 32, position: 'relative',
    animation: 'fadeInUp 0.3s ease',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(127, 227, 160,0.3) transparent',
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', textAlign: 'center', gap: 8,
  },
  heroBadge: {
    fontSize: '3.8rem', marginBottom: 8,
    filter: 'drop-shadow(0 0 24px rgba(127, 227, 160,0.7))',
  },
  title: {
    fontSize: '1.45rem', fontWeight: 800, color: '#f1f5f9',
    margin: '0 0 4px', letterSpacing: '-0.3px', lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.93rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: 420,
    margin: 0,
  },
  ruleBox: {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '16px 20px', marginTop: 16,
    display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left',
  },
  ruleRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  ruleIcon: { fontSize: '1rem', flexShrink: 0, marginTop: 1 },
  ruleText: { fontSize: '0.87rem', color: '#cbd5e1', lineHeight: 1.5 },
  btnPrimary: {
    padding: '12px 28px', borderRadius: 13, border: 'none',
    background: 'linear-gradient(135deg, #22a04b, #a855f7)',
    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
    cursor: 'pointer', boxShadow: '0 4px 22px rgba(34, 160, 75,0.45)',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    transition: 'all 0.2s ease',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  btnSecondary: {
    padding: '12px 20px', borderRadius: 13, cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    transition: 'all 0.2s ease',
  },
  closeX: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748b', width: 32, height: 32, borderRadius: 8,
    cursor: 'pointer', fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  spinner: {
    width: 52, height: 52, borderRadius: '50%',
    border: '3px solid rgba(127, 227, 160,0.12)',
    borderTopColor: '#7fe3a0',
    animation: 'spin 0.85s linear infinite',
  },
  // Quiz screen
  quizHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  questionMeta: {
    fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0',
  },
  timerWrap: {
    position: 'relative', width: 60, height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  timerNum: {
    fontSize: '1rem', fontWeight: 800, position: 'relative', zIndex: 1,
  },
  progressBg: {
    height: 3, background: 'rgba(255,255,255,0.07)',
    borderRadius: 999, marginBottom: 20, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22a04b, #22d3a8)',
    borderRadius: 999, transition: 'width 0.45s ease',
  },
  questionBox: {
    fontSize: '1.0rem', fontWeight: 600, color: '#f1f5f9',
    lineHeight: 1.65, marginBottom: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 13, padding: '16px 18px',
    display: 'flex', gap: 10,
  },
  qIndex: {
    color: '#7fe3a0', fontWeight: 800, fontSize: '1.05rem', flexShrink: 0,
  },
  option: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 13, width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    cursor: 'pointer', textAlign: 'left', color: '#cbd5e1',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  optionSelected: {
    background: 'rgba(34, 160, 75,0.18)',
    border: '1.5px solid rgba(127, 227, 160,0.65)',
    color: '#f1f5f9',
    boxShadow: '0 0 14px rgba(34, 160, 75,0.22)',
  },
  optLetter: {
    minWidth: 30, height: 30, borderRadius: 9,
    background: 'rgba(127, 227, 160,0.1)', border: '1px solid rgba(127, 227, 160,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '0.78rem', color: '#7fe3a0', flexShrink: 0,
  },
  optLetterSelected: {
    background: 'rgba(127, 227, 160,0.3)', border: '1px solid #7fe3a0', color: '#fff',
  },
  optText: { fontSize: '0.9rem', lineHeight: 1.45, flex: 1 },
  checkMark: { color: '#22d3a8', fontWeight: 800, fontSize: '0.95rem', marginLeft: 'auto' },
  dots: {
    display: 'flex', gap: 6, justifyContent: 'center',
    marginTop: 18, flexWrap: 'wrap',
  },
  dot: {
    width: 10, height: 10, borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  // Result screen
  resultBadgePass: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'rgba(34,211,168,0.12)',
    border: '2.5px solid #22d3a8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', color: '#22d3a8',
    boxShadow: '0 0 35px rgba(34,211,168,0.3)',
    marginBottom: 4,
  },
  resultBadgeFail: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'rgba(248,113,113,0.1)',
    border: '2.5px solid #f87171',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', color: '#f87171',
    boxShadow: '0 0 25px rgba(248,113,113,0.2)',
    marginBottom: 4,
  },
  scoreRing: {
    position: 'relative', width: 130, height: 130,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  scoreCenter: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', zIndex: 1,
  },
  statsBox: {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '14px 18px', marginTop: 16,
    display: 'flex', flexDirection: 'column', gap: 11,
  },
  statRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', fontSize: '0.9rem',
  },
  statLabel: { color: '#64748b' },
  statValue: { fontWeight: 700 },
  breakdown: {
    width: '100%', background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12, padding: '14px 16px', marginTop: 12,
  },
};

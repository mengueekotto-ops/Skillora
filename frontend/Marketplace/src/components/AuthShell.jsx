import React from 'react';
import './AuthShell.css';

/**
 * Shared frame for the client and artisan auth screens:
 * dark card, form on the left, "space" illustration panel on the right.
 *
 * - `aside` renders extra content on the art panel (e.g. the artisan sign-up steps)
 * - `wide` gives the form more room for long forms
 */
export default function AuthShell({ lang, setLang, onBack, wide = false, aside = null, tagline, children }) {
  const tr = (fr, en) => (lang === 'fr' ? fr : en);

  return (
    <div className="auth2-page">
      <div className={`auth2-card ${wide ? 'wide' : ''}`}>
        <div className="auth2-topbar">
          <div className="auth2-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="auth2-topbar-actions">
            {setLang && (
              <div className="auth2-lang" role="group" aria-label={tr('Langue', 'Language')}>
                <button type="button" className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
                <button type="button" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              </div>
            )}
            {onBack && (
              <button type="button" className="auth2-back" onClick={onBack}>
                ← {tr('Accueil', 'Home')}
              </button>
            )}
          </div>
        </div>

        <div className="auth2-body">
          <section className="auth2-form-pane">{children}</section>

          <aside className={`auth2-art ${aside ? 'has-aside' : ''}`} aria-hidden={aside ? undefined : 'true'}>
            <div className="auth2-stars" />
            <span className="auth2-comet c1" />
            <span className="auth2-comet c2" />
            <span className="auth2-planet big" />
            <span className="auth2-planet small" />
            {aside && <div className="auth2-art-content">{aside}</div>}
            <div className="auth2-wordmark">
              skillora
              {tagline && <small>{tagline}</small>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Label + input row in the auth style. Extra props go to the <input>. */
export function AuthField({ label, extra, children, id, ...inputProps }) {
  return (
    <div className="auth2-field">
      <div className="auth2-label-row">
        <label htmlFor={id}>{label}</label>
        {extra}
      </div>
      {children || <input id={id} className="auth2-input" {...inputProps} />}
    </div>
  );
}

/** Password input with a show/hide eye button. */
export function PasswordInput({ id, value, onChange, show, onToggle, lang, ...rest }) {
  return (
    <div className="auth2-input-wrap">
      <input
        id={id}
        className="auth2-input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        {...rest}
      />
      <button
        type="button"
        className="auth2-eye"
        onClick={onToggle}
        aria-label={show ? (lang === 'fr' ? 'Masquer le mot de passe' : 'Hide password') : (lang === 'fr' ? 'Afficher le mot de passe' : 'Show password')}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="m1 1 22 22" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        )}
      </button>
    </div>
  );
}

/** Password strength bar (score 0-100). */
export function StrengthMeter({ score, color, text }) {
  if (!score) return null;
  return (
    <div className="auth2-strength">
      <div className="auth2-strength-track">
        <div style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ color }}>{text}</span>
    </div>
  );
}

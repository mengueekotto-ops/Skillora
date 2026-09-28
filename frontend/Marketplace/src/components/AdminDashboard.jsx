import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, avatarFor, formatDate, formatFCFA, PAYMENT_STATUS_LABELS, shortRef } from '../api';
import './AdminDashboard.css';

/* ── Small helpers ─────────────────────────────────────────────────────────── */

const personName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—' : '—');

const timeAgo = (value, lang) => {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'fr' ? 'fr' : 'en', { numeric: 'auto', style: 'short' });
  if (diff < 3600) return rtf.format(-Math.max(1, Math.round(diff / 60)), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  return rtf.format(-Math.round(diff / 86400), 'day');
};

const REQUEST_STATUS = {
  PENDING: ['En attente', 'Pending', 'amber'],
  ACCEPTED: ['Acceptée', 'Accepted', 'blue'],
  IN_PROGRESS: ['En cours', 'In progress', 'green'],
  COMPLETED: ['Terminée', 'Completed', 'dark'],
  CANCELLED: ['Annulée', 'Cancelled', 'grey'],
  REJECTED: ['Refusée', 'Declined', 'grey'],
};

const VERIF_STATUS = {
  verified: ['Vérifié', 'Verified', 'green'],
  pending: ['En cours', 'In progress', 'amber'],
  failed: ['Échoué', 'Failed', 'red'],
  unverified: ['Non vérifié', 'Unverified', 'grey'],
};

const PAYMENT_PILL = {
  PENDING: 'amber', HELD: 'blue', PROCESSING: 'amber', SUCCESS: 'green',
  FAILED: 'grey', CANCELLED: 'grey', PAYOUT_FAILED: 'red', REFUND_PENDING: 'red',
};

function Pill({ map, value, lang }) {
  const [fr, en, cls] = map[value] || [value, value, 'grey'];
  return <span className={`ad-pill ${cls}`}>{lang === 'fr' ? fr : en}</span>;
}

/** Fetch a paginated admin list; re-runs when `params` change. */
function useAdminList(path, params, enabled) {
  const [state, setState] = useState({ rows: [], meta: { total: 0, page: 1, totalPages: 1 }, loading: false, error: '' });
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    if (!enabled) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    const qs = new URLSearchParams(
      Object.entries(JSON.parse(key)).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    ).toString();
    try {
      const res = await api(`${path}${qs ? `?${qs}` : ''}`);
      const meta = res.meta || {};
      const limit = meta.limit || 20;
      setState({
        rows: res.data || [],
        meta: { total: meta.total ?? (res.data || []).length, page: meta.page || 1, totalPages: meta.totalPages || Math.max(1, Math.ceil((meta.total || 0) / limit)) },
        loading: false,
        error: '',
      });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [path, key, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

/* ── Charts (inline SVG, no library) ───────────────────────────────────────── */

function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] || points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[i + 2] || points[i + 1];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${x2} ${y2}`;
  }
  return d;
}

function AreaChart({ labels, series, format = (v) => v }) {
  const W = 620;
  const H = 230;
  const pad = { l: 44, r: 12, t: 14, b: 28 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, labels.length - 1);
  const y = (v) => pad.t + (1 - v / niceMax) * (H - pad.t - pad.b);

  return (
    <svg className="ad-chart" viewBox={`0 0 ${W} ${H}`} role="img" preserveAspectRatio="none">
      <defs>
        {series.map((s) => (
          <linearGradient key={s.id} id={`ad-grad-${s.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (niceMax / 4) * i;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="ad-chart-grid" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="ad-chart-axis">{format(v)}</text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={l + i} x={x(i)} y={H - 6} textAnchor="middle" className="ad-chart-axis">{l}</text>
      ))}
      {series.map((s) => {
        const pts = s.values.map((v, i) => [x(i), y(v)]);
        const line = smoothPath(pts);
        return (
          <g key={s.id}>
            <path d={`${line} L ${x(pts.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`} fill={`url(#ad-grad-${s.id})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
            {pts.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2">
                <title>{`${labels[i]} : ${format(s.values[i])}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg className="ad-donut" viewBox="0 0 200 200" role="img">
      <circle cx="100" cy="100" r={R} className="ad-donut-track" />
      {total > 0 &&
        parts.map((p) => {
          const len = (p.value / total) * C;
          const el = (
            <circle
              key={p.label}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={p.color}
              strokeWidth="26"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 100 100)"
            >
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      <text x="100" y="96" textAnchor="middle" className="ad-donut-total">{total}</text>
      <text x="100" y="118" textAnchor="middle" className="ad-donut-label">comptes</text>
    </svg>
  );
}

function MiniBars({ values }) {
  const max = Math.max(1, ...values);
  return (
    <div className="ad-minibars" aria-hidden="true">
      {values.map((v, i) => <span key={i} style={{ height: `${Math.max(10, (v / max) * 100)}%` }} />)}
    </div>
  );
}

function Wave() {
  return (
    <svg className="ad-wave" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 40 C 30 10, 50 55, 80 30 S 130 5, 160 30 S 190 50, 200 20 L 200 60 L 0 60 Z" />
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export default function AdminDashboard({ onLogout, onBackToMarketplace, triggerToast, lang = 'fr', setLang, theme, setTheme, currentUser }) {
  const tr = (fr, en) => (lang === 'fr' ? fr : en);
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [topSearch, setTopSearch] = useState('');

  // Overview data
  const [overview, setOverview] = useState(null);
  const [stats, setStats] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [chartMode, setChartMode] = useState('missions');

  // List filters
  const [userQ, setUserQ] = useState({ page: 1, search: '', role: 'ALL', status: 'ALL' });
  const [artisanQ, setArtisanQ] = useState({ page: 1, search: '', verificationStatus: 'ALL' });
  const [verifQ, setVerifQ] = useState({ status: 'REVIEW' });
  const [paymentQ, setPaymentQ] = useState({ page: 1, status: 'ALL' });
  const [requestQ, setRequestQ] = useState({ page: 1, status: 'ALL' });
  const [serviceQ, setServiceQ] = useState({ page: 1, search: '', status: 'ALL' });
  const [reviewQ, setReviewQ] = useState({ page: 1, band: 'ALL' });

  const users = useAdminList('/admin/users', userQ, tab === 'users');
  const artisans = useAdminList('/admin/professionals', artisanQ, tab === 'artisans');
  const verifications = useAdminList('/admin/verification-requests', verifQ, tab === 'verifications' || tab === 'overview');
  const payments = useAdminList('/admin/payments', paymentQ, tab === 'payments');
  const requests = useAdminList('/admin/requests', tab === 'overview' ? { page: 1, limit: 6 } : requestQ, tab === 'requests' || tab === 'overview');
  const services = useAdminList('/admin/services', serviceQ, tab === 'services');
  const reviewParams = useMemo(() => {
    const bands = { LOW: { maxRating: 2 }, MID: { minRating: 3, maxRating: 3 }, HIGH: { minRating: 4 } };
    return { page: reviewQ.page, ...(bands[reviewQ.band] || {}) };
  }, [reviewQ]);
  const reviews = useAdminList('/admin/reviews', reviewParams, tab === 'reviews');

  // Dialogs
  const [detail, setDetail] = useState(null); // { kind: 'user'|'artisan', data }
  const [reviewing, setReviewing] = useState(null); // verification being decided
  const [decisionReason, setDecisionReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Broadcast
  const [broadcast, setBroadcast] = useState({ targetRole: 'ALL', title: '', message: '' });

  const loadOverview = useCallback(async () => {
    setOverviewError('');
    try {
      const [o, s] = await Promise.all([api('/admin/overview'), api('/admin/stats')]);
      setOverview(o.data);
      setStats(s.data);
    } catch (err) {
      setOverviewError(err.message);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const refreshAll = () => {
    loadOverview();
    ({ users, artisans, verifications, payments, requests, services, reviews })[tab]?.reload?.();
    triggerToast?.(tr('Données actualisées', 'Data refreshed'), '🔄');
  };

  const go = (id) => {
    setTab(id);
    setMenuOpen(false);
    document.querySelector('.ad-content')?.scrollTo?.({ top: 0 });
  };

  /* ── Actions ── */
  const run = async (fn, successMsg, after) => {
    setBusy(true);
    try {
      const res = await fn();
      triggerToast?.(successMsg || res?.message || tr('Fait', 'Done'), '✓');
      after?.();
      loadOverview();
    } catch (err) {
      triggerToast?.(err.message, '⚠️');
    } finally {
      setBusy(false);
    }
  };

  const toggleUser = (u) =>
    run(() => api(`/admin/users/${u._id}/status`, { method: 'PUT' }),
      u.isActive ? tr('Compte suspendu', 'Account suspended') : tr('Compte réactivé', 'Account reactivated'), users.reload);

  const deleteUser = (u) => {
    if (!window.confirm(tr(`Supprimer définitivement le compte ${u.email} ?`, `Permanently delete ${u.email}?`))) return;
    run(() => api(`/admin/users/${u._id}`, { method: 'DELETE' }), tr('Compte supprimé', 'Account deleted'), users.reload);
  };

  const decideVerification = (action) =>
    run(
      () => api(`/admin/verification/${reviewing._id}`, { method: 'PUT', body: { action, reason: decisionReason.trim() || undefined } }),
      action === 'approve' ? tr('Artisan vérifié ✓', 'Artisan verified ✓') : tr('Vérification refusée', 'Verification rejected'),
      () => { setReviewing(null); setDecisionReason(''); verifications.reload(); }
    );

  const toggleService = (s) => run(() => api(`/admin/services/${s._id}/status`, { method: 'PUT' }), null, services.reload);

  const deleteService = (s) => {
    if (!window.confirm(tr(`Supprimer le service « ${s.title} » ?`, `Delete service "${s.title}"?`))) return;
    run(() => api(`/admin/services/${s._id}`, { method: 'DELETE' }), tr('Service supprimé', 'Service deleted'), services.reload);
  };

  const deleteReview = (r) => {
    if (!window.confirm(tr('Supprimer cet avis ? La note de l’artisan sera recalculée.', "Delete this review? The artisan's rating will be recalculated."))) return;
    run(() => api(`/admin/reviews/${r._id}`, { method: 'DELETE' }), tr('Avis supprimé', 'Review deleted'), reviews.reload);
  };

  const sendBroadcast = (e) => {
    e.preventDefault();
    run(() => api('/admin/notifications/send', { method: 'POST', body: broadcast }), null, () => setBroadcast((b) => ({ ...b, title: '', message: '' })));
  };

  /* ── Navigation ── */
  const reviewCount = tab === 'overview' || tab === 'verifications' ? (verifQ.status === 'REVIEW' ? verifications.rows.length : null) : null;
  const NAV = [
    { id: 'overview', icon: '▦', label: tr('Tableau de bord', 'Dashboard') },
    { id: 'users', icon: '👥', label: tr('Utilisateurs', 'Users') },
    { id: 'artisans', icon: '🧑‍🔧', label: tr('Artisans', 'Artisans') },
    { id: 'verifications', icon: '🛡️', label: tr('Vérifications', 'Verifications'), badge: reviewCount || null },
    { id: 'payments', icon: '💳', label: tr('Paiements', 'Payments'), badge: overview?.money?.needsAttention || null, danger: true },
    { id: 'requests', icon: '📋', label: tr('Missions', 'Jobs') },
    { id: 'services', icon: '💼', label: tr('Services', 'Services') },
    { id: 'reviews', icon: '⭐', label: tr('Avis', 'Reviews') },
    { id: 'broadcast', icon: '📣', label: tr('Diffusion', 'Broadcast') },
  ];
  const current = NAV.find((n) => n.id === tab);

  const monthLabels = (overview?.months || []).map((m) =>
    new Date(m.year, m.month - 1, 1).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short' }).replace('.', '')
  );

  const chartSeries = {
    missions: [
      { id: 'req', label: tr('Demandes', 'Requests'), color: 'var(--ad-c1)', values: overview?.series.requests || [] },
      { id: 'done', label: tr('Terminées', 'Completed'), color: 'var(--ad-c3)', values: overview?.series.completed || [] },
    ],
    payments: [{ id: 'pay', label: tr('Volume (FCFA)', 'Volume (FCFA)'), color: 'var(--ad-c1)', values: overview?.series.paymentVolume || [] }],
    signups: [
      { id: 'cli', label: tr('Clients', 'Clients'), color: 'var(--ad-c1)', values: overview?.series.clients || [] },
      { id: 'art', label: tr('Artisans', 'Artisans'), color: 'var(--ad-c3)', values: overview?.series.artisans || [] },
    ],
  }[chartMode];

  const compact = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : Math.round(v));

  /* ── Reusable table pieces ── */
  const pager = (list, onPage) =>
    list.meta.totalPages > 1 ? (
      <div className="ad-pager">
        <span>{tr(`${list.meta.total} résultat(s)`, `${list.meta.total} result(s)`)}</span>
        <div>
          <button type="button" disabled={list.meta.page <= 1} onClick={() => onPage(list.meta.page - 1)}>‹</button>
          {Array.from({ length: Math.min(list.meta.totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={p === list.meta.page ? 'active' : ''} onClick={() => onPage(p)}>{p}</button>
          ))}
          <button type="button" disabled={list.meta.page >= list.meta.totalPages} onClick={() => onPage(list.meta.page + 1)}>›</button>
        </div>
      </div>
    ) : (
      <div className="ad-pager"><span>{tr(`${list.meta.total} résultat(s)`, `${list.meta.total} result(s)`)}</span></div>
    );
  const tableState = (list, cols, empty) =>
    list.loading ? (
      <tr><td colSpan={cols} className="ad-empty">{tr('Chargement…', 'Loading…')}</td></tr>
    ) : list.error ? (
      <tr><td colSpan={cols} className="ad-empty error">⚠️ {list.error} <button type="button" className="ad-link" onClick={list.reload}>{tr('Réessayer', 'Retry')}</button></td></tr>
    ) : list.rows.length === 0 ? (
      <tr><td colSpan={cols} className="ad-empty">{empty}</td></tr>
    ) : null;

  const adminName = currentUser?.name || tr('Administrateur', 'Administrator');

  return (
    <div className={`ad-layout ${menuOpen ? 'menu-open' : ''}`}>
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="ad-sidebar" aria-label={tr('Navigation admin', 'Admin navigation')}>
        <div className="ad-brand">
          <span className="ad-brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <div>
            <strong>Skillora</strong>
            <small>{tr('Administration', 'Administration')}</small>
          </div>
        </div>
        <nav className="ad-nav">
          {NAV.map((n) => (
            <button key={n.id} type="button" className={`ad-nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => go(n.id)} aria-current={tab === n.id ? 'page' : undefined}>
              <span className="ad-nav-icon">{n.icon}</span>
              <span>{n.label}</span>
              {n.badge ? <span className={`ad-nav-badge ${n.danger ? 'danger' : ''}`}>{n.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="ad-sidebar-foot">
          <button type="button" className="ad-nav-item" onClick={onBackToMarketplace}>
            <span className="ad-nav-icon">🏠</span>
            <span>{tr('Voir le site', 'View site')}</span>
          </button>
          <button type="button" className="ad-nav-item logout" onClick={onLogout}>
            <span className="ad-nav-icon">↪</span>
            <span>{tr('Déconnexion', 'Log out')}</span>
          </button>
        </div>
      </aside>
      {menuOpen && <div className="ad-scrim" onClick={() => setMenuOpen(false)} />}

      <div className="ad-main">
        {/* ── TOP BAR ───────────────────────────────────────── */}
        <header className="ad-topbar">
          <button type="button" className="ad-icon-btn ad-burger" onClick={() => setMenuOpen(true)} aria-label={tr('Menu', 'Menu')}>☰</button>
          <form
            className="ad-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setUserQ((q) => ({ ...q, page: 1, search: topSearch.trim() }));
              go('users');
            }}
          >
            <span aria-hidden="true">🔍</span>
            <input value={topSearch} onChange={(e) => setTopSearch(e.target.value)} placeholder={tr('Rechercher un utilisateur (nom, e-mail, téléphone)…', 'Search a user (name, email, phone)…')} aria-label={tr('Rechercher', 'Search')} />
          </form>
          <div className="ad-top-actions">
            <button type="button" className="ad-icon-btn" onClick={refreshAll} title={tr('Actualiser', 'Refresh')} aria-label={tr('Actualiser', 'Refresh')}>🔄</button>
            {setTheme && (
              <button type="button" className="ad-icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={tr('Thème', 'Theme')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
            )}
            {setLang && (
              <button type="button" className="ad-icon-btn ad-lang" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}>{lang === 'fr' ? 'EN' : 'FR'}</button>
            )}
            <div className="ad-me">
              <img src={avatarFor(adminName)} alt="" />
              <div>
                <strong>{adminName}</strong>
                <small>{currentUser?.email}</small>
              </div>
            </div>
          </div>
        </header>

        <main className="ad-content">
          <div className="ad-page-head">
            <div>
              <h1>{current?.label}</h1>
              <p>{tr('Skillora · console d’administration', 'Skillora · admin console')}</p>
            </div>
          </div>

          {/* ═══ OVERVIEW ═══ */}
          {tab === 'overview' && (
            <>
              {overviewError && <div className="ad-alert">⚠️ {overviewError} <button type="button" className="ad-link" onClick={loadOverview}>{tr('Réessayer', 'Retry')}</button></div>}

              <section className="ad-row ad-row-hero">
                <div className="ad-card ad-hero">
                  <div className="ad-hero-side">
                    <div>
                      <h3>{tr('Activité de la plateforme', 'Platform activity')}</h3>
                      <small>{tr('6 derniers mois', 'Last 6 months')}</small>
                    </div>
                    <div>
                      <strong className="ad-big">{overview ? formatFCFA(overview.money.volume) : '—'}</strong>
                      <small>{tr('Volume des paiements', 'Payment volume')}</small>
                    </div>
                    <div>
                      <strong className="ad-big">{overview ? overview.series.requests.at(-1) : '—'}</strong>
                      <small>{tr('Missions ce mois-ci', 'Jobs this month')}</small>
                    </div>
                    <button type="button" className="ad-btn" onClick={() => go('requests')}>{tr('Voir les missions', 'View jobs')}</button>
                  </div>
                  <div className="ad-hero-chart">
                    <div className="ad-chart-head">
                      <div className="ad-tabs" role="tablist">
                        {[['missions', tr('Missions', 'Jobs')], ['payments', tr('Paiements', 'Payments')], ['signups', tr('Inscriptions', 'Sign-ups')]].map(([id, label]) => (
                          <button key={id} type="button" role="tab" aria-selected={chartMode === id} className={chartMode === id ? 'active' : ''} onClick={() => setChartMode(id)}>{label}</button>
                        ))}
                      </div>
                      <div className="ad-legend">
                        {chartSeries.map((s) => <span key={s.id}><i style={{ background: s.color }} />{s.label}</span>)}
                      </div>
                    </div>
                    {overview ? (
                      <AreaChart labels={monthLabels} series={chartSeries} format={chartMode === 'payments' ? compact : (v) => Math.round(v)} />
                    ) : (
                      <div className="ad-chart-placeholder">{overviewError ? '—' : tr('Chargement…', 'Loading…')}</div>
                    )}
                  </div>
                  <div className="ad-hero-stats">
                    {[
                      ['👥', 'c1', tr('Utilisateurs', 'Users'), stats?.totalUsers ?? '—'],
                      ['🛡️', 'c2', tr('Artisans vérifiés', 'Verified artisans'), stats?.verifiedProfessionals ?? '—'],
                      ['💰', 'c3', tr('Frais plateforme', 'Platform fees'), overview ? formatFCFA(overview.money.platformFees) : '—'],
                      ['⭐', 'c4', tr('Note moyenne', 'Average rating'), stats ? `${stats.averagePlatformRating} / 5` : '—'],
                    ].map(([icon, cls, label, value]) => (
                      <div key={label} className="ad-mini">
                        <span className={`ad-mini-icon ${cls}`}>{icon}</span>
                        <div>
                          <small>{label}</small>
                          <strong>{value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ad-card ad-donut-card">
                  <h3>{tr('Répartition des comptes', 'Accounts split')}</h3>
                  {overview ? (
                    <>
                      <Donut
                        parts={[
                          { label: tr('Clients', 'Clients'), value: overview.usersByType.clients, color: 'var(--ad-c1)' },
                          { label: tr('Artisans vérifiés', 'Verified artisans'), value: overview.usersByType.verifiedArtisans, color: 'var(--ad-c3)' },
                          { label: tr('Autres artisans', 'Other artisans'), value: overview.usersByType.otherArtisans, color: 'var(--ad-c4)' },
                        ]}
                      />
                      <div className="ad-donut-legend">
                        {(() => {
                          const u = overview.usersByType;
                          const total = u.clients + u.verifiedArtisans + u.otherArtisans || 1;
                          return [
                            [tr('Clients', 'Clients'), u.clients, 'var(--ad-c1)'],
                            [tr('Vérifiés', 'Verified'), u.verifiedArtisans, 'var(--ad-c3)'],
                            [tr('Non vérifiés', 'Unverified'), u.otherArtisans, 'var(--ad-c4)'],
                          ].map(([label, v, color]) => (
                            <div key={label}>
                              <strong>{Math.round((v / total) * 100)}<sup>%</sup></strong>
                              <small><i style={{ background: color }} />{label}</small>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="ad-chart-placeholder">{tr('Chargement…', 'Loading…')}</div>
                  )}
                </div>
              </section>

              <section className="ad-row ad-row-4">
                <button type="button" className="ad-grad g1" onClick={() => go('verifications')}>
                  <small>{tr('Vérifications à examiner', 'Verifications to review')}</small>
                  <div className="ad-grad-body">
                    <MiniBars values={overview?.series.artisans || [0]} />
                    <strong>{verifQ.status === 'REVIEW' ? verifications.rows.length : '—'}</strong>
                  </div>
                  <span className="ad-grad-foot">{tr('Documents en attente', 'Documents pending')}</span>
                </button>
                <button type="button" className="ad-grad g2" onClick={() => go('payments')}>
                  <small>{tr('En séquestre', 'Held in escrow')}</small>
                  <strong>{overview ? formatFCFA(overview.money.inEscrow) : '—'}</strong>
                  <Wave />
                </button>
                <button type="button" className="ad-grad g3" onClick={() => { setPaymentQ({ page: 1, status: 'ATTENTION' }); go('payments'); }}>
                  <small>{tr('Paiements à traiter', 'Payments to handle')}</small>
                  <strong>{overview ? overview.money.needsAttention : '—'}</strong>
                  <span className="ad-grad-foot">
                    {overview ? tr(`${overview.money.refundPending} remboursement(s) · ${overview.money.payoutFailed} versement(s) échoué(s)`, `${overview.money.refundPending} refund(s) · ${overview.money.payoutFailed} failed payout(s)`) : ''}
                  </span>
                </button>
                <button type="button" className="ad-grad g4" onClick={() => go('reviews')}>
                  <small>{tr('Avis clients', 'Client reviews')}</small>
                  <div className="ad-grad-body">
                    <MiniBars values={overview?.series.completed || [0]} />
                    <strong>{stats?.totalReviews ?? '—'}</strong>
                  </div>
                  <span className="ad-grad-foot">★ {stats?.averagePlatformRating ?? '—'} / 5</span>
                </button>
              </section>

              <section className="ad-row ad-row-bottom">
                <div className="ad-card">
                  <h3>{tr('Activité récente', 'Recent activity')}</h3>
                  {!overview ? (
                    <p className="ad-muted">{tr('Chargement…', 'Loading…')}</p>
                  ) : overview.activity.length === 0 ? (
                    <p className="ad-muted">{tr('Aucune activité pour le moment.', 'No activity yet.')}</p>
                  ) : (
                    <ul className="ad-timeline">
                      {overview.activity.map((a, i) => {
                        const meta = {
                          CLIENT_SIGNUP: ['👤', 'c1', tr('Nouveau client', 'New client')],
                          ARTISAN_SIGNUP: ['🧑‍🔧', 'c3', tr('Nouvel artisan', 'New artisan')],
                          ADMIN_CREATED: ['🛡️', 'c2', tr('Admin créé', 'Admin created')],
                          REQUEST_CREATED: ['📋', 'c2', tr('Nouvelle demande', 'New request')],
                          REVIEW_POSTED: ['⭐', 'c4', tr('Nouvel avis', 'New review')],
                        }[a.title] || ['💳', 'c3', `${tr('Paiement', 'Payment')} · ${(PAYMENT_STATUS_LABELS[a.title.replace('PAYMENT_', '')] || {})[lang] || a.title.replace('PAYMENT_', '')}`];
                        return (
                          <li key={i}>
                            <span className="ad-time">{timeAgo(a.at, lang)}</span>
                            <span className={`ad-dot ${meta[1]}`}>{meta[0]}</span>
                            <div>
                              <strong>{meta[2]}</strong>
                              <small>
                                <b>{a.who}</b>
                                {a.type === 'PAYMENT' ? ` · ${formatFCFA(a.detail)}` : a.detail ? ` · ${String(a.detail).slice(0, 48)}` : ''}
                              </small>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="ad-card">
                  <div className="ad-card-head">
                    <div>
                      <h3>{tr('Dernières missions', 'Latest jobs')}</h3>
                      <small className="ad-muted">{tr('Demandes les plus récentes', 'Most recent requests')}</small>
                    </div>
                    <button type="button" className="ad-btn ghost" onClick={() => go('requests')}>{tr('Tout voir', 'View all')}</button>
                  </div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead><tr><th>{tr('Réf', 'Ref')}</th><th>{tr('Client', 'Client')}</th><th>{tr('Artisan', 'Artisan')}</th><th>{tr('Date', 'Date')}</th><th>{tr('Statut', 'Status')}</th></tr></thead>
                      <tbody>
                        {tableState(requests, 5, tr('Aucune mission.', 'No jobs yet.'))}
                        {!requests.loading && !requests.error && requests.rows.map((r) => (
                          <tr key={r._id}>
                            <td className="ad-mono">{shortRef(r._id)}</td>
                            <td>{personName(r.customerId)}</td>
                            <td>{personName(r.professionalId?.userId)}</td>
                            <td className="ad-muted">{formatDate(r.createdAt, lang)}</td>
                            <td><Pill map={REQUEST_STATUS} value={r.status} lang={lang} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ═══ USERS ═══ */}
          {tab === 'users' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <input className="ad-input" placeholder={tr('Nom, e-mail ou téléphone…', 'Name, email or phone…')} defaultValue={userQ.search}
                  onKeyDown={(e) => e.key === 'Enter' && setUserQ((q) => ({ ...q, page: 1, search: e.currentTarget.value.trim() }))} />
                <select className="ad-input" value={userQ.role} onChange={(e) => setUserQ((q) => ({ ...q, page: 1, role: e.target.value }))}>
                  <option value="ALL">{tr('Tous les rôles', 'All roles')}</option>
                  <option value="CUSTOMER">{tr('Clients', 'Clients')}</option>
                  <option value="PROFESSIONAL">{tr('Artisans', 'Artisans')}</option>
                  <option value="ADMIN">{tr('Admins', 'Admins')}</option>
                </select>
                <select className="ad-input" value={userQ.status} onChange={(e) => setUserQ((q) => ({ ...q, page: 1, status: e.target.value }))}>
                  <option value="ALL">{tr('Tous les statuts', 'All statuses')}</option>
                  <option value="active">{tr('Actifs', 'Active')}</option>
                  <option value="suspended">{tr('Suspendus', 'Suspended')}</option>
                </select>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Utilisateur', 'User')}</th><th>{tr('Rôle', 'Role')}</th><th>{tr('Téléphone', 'Phone')}</th><th>{tr('Inscrit le', 'Joined')}</th><th>{tr('Statut', 'Status')}</th><th className="right">{tr('Actions', 'Actions')}</th></tr></thead>
                  <tbody>
                    {tableState(users, 6, tr('Aucun utilisateur trouvé.', 'No users found.'))}
                    {!users.loading && !users.error && users.rows.map((u) => {
                      const isMe = u.email === currentUser?.email;
                      return (
                        <tr key={u._id}>
                          <td>
                            <div className="ad-person">
                              <img src={u.profileImage || avatarFor(personName(u))} alt="" />
                              <div><strong>{personName(u)}</strong><small>{u.email}</small></div>
                            </div>
                          </td>
                          <td><span className={`ad-pill ${u.role === 'ADMIN' ? 'dark' : u.role === 'PROFESSIONAL' ? 'green' : 'blue'}`}>{u.role === 'ADMIN' ? 'Admin' : u.role === 'PROFESSIONAL' ? tr('Artisan', 'Artisan') : tr('Client', 'Client')}</span></td>
                          <td className="ad-muted">{u.phone || '—'}</td>
                          <td className="ad-muted">{formatDate(u.createdAt, lang)}</td>
                          <td><span className={`ad-pill ${u.isActive ? 'green' : 'red'}`}>{u.isActive ? tr('Actif', 'Active') : tr('Suspendu', 'Suspended')}</span></td>
                          <td className="right">
                            <div className="ad-actions">
                              <button type="button" className="ad-btn ghost sm" onClick={() => setDetail({ kind: 'user', data: u })}>{tr('Détails', 'Details')}</button>
                              {!isMe && <button type="button" className="ad-btn ghost sm" disabled={busy} onClick={() => toggleUser(u)}>{u.isActive ? tr('Suspendre', 'Suspend') : tr('Réactiver', 'Reactivate')}</button>}
                              {!isMe && <button type="button" className="ad-btn danger sm" disabled={busy} onClick={() => deleteUser(u)} aria-label={tr('Supprimer', 'Delete')}>🗑</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pager(users, (p) => setUserQ((q) => ({ ...q, page: p })))}
            </div>
          )}

          {/* ═══ ARTISANS ═══ */}
          {tab === 'artisans' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <input className="ad-input" placeholder={tr('Métier, bio ou atelier…', 'Trade, bio or workshop…')} defaultValue={artisanQ.search}
                  onKeyDown={(e) => e.key === 'Enter' && setArtisanQ((q) => ({ ...q, page: 1, search: e.currentTarget.value.trim() }))} />
                <select className="ad-input" value={artisanQ.verificationStatus} onChange={(e) => setArtisanQ((q) => ({ ...q, page: 1, verificationStatus: e.target.value }))}>
                  <option value="ALL">{tr('Toutes les vérifications', 'All verification states')}</option>
                  <option value="verified">{tr('Vérifiés', 'Verified')}</option>
                  <option value="unverified">{tr('Non vérifiés', 'Unverified')}</option>
                  <option value="failed">{tr('Échoués', 'Failed')}</option>
                  <option value="pending">{tr('En cours', 'In progress')}</option>
                </select>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Artisan', 'Artisan')}</th><th>{tr('Métier', 'Trade')}</th><th>{tr('Type', 'Type')}</th><th>{tr('Vérification', 'Verification')}</th><th>{tr('Note', 'Rating')}</th><th>{tr('Missions', 'Jobs')}</th><th className="right" /></tr></thead>
                  <tbody>
                    {tableState(artisans, 7, tr('Aucun artisan trouvé.', 'No artisans found.'))}
                    {!artisans.loading && !artisans.error && artisans.rows.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <div className="ad-person">
                            <img src={p.userId?.profileImage || avatarFor(personName(p.userId))} alt="" />
                            <div><strong>{p.artisanType === 'GROUPED' && p.groupName ? p.groupName : personName(p.userId)}</strong><small>{p.userId?.email}</small></div>
                          </div>
                        </td>
                        <td>{p.profession}</td>
                        <td className="ad-muted">{p.artisanType === 'GROUPED' ? tr('Atelier', 'Workshop') : tr('Solo', 'Solo')}</td>
                        <td><Pill map={VERIF_STATUS} value={p.verifiedBadge ? 'verified' : p.verificationStatus} lang={lang} /></td>
                        <td>{p.rating ? `★ ${Number(p.rating).toFixed(1)}` : '—'}</td>
                        <td>{p.completedMissions || 0}</td>
                        <td className="right"><button type="button" className="ad-btn ghost sm" onClick={() => setDetail({ kind: 'artisan', data: p })}>{tr('Détails', 'Details')}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pager(artisans, (p) => setArtisanQ((q) => ({ ...q, page: p })))}
            </div>
          )}

          {/* ═══ VERIFICATIONS ═══ */}
          {tab === 'verifications' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <select className="ad-input" value={verifQ.status} onChange={(e) => setVerifQ({ status: e.target.value })}>
                  <option value="REVIEW">{tr('À examiner (documents en attente)', 'To review (documents pending)')}</option>
                  <option value="verified">{tr('Vérifiés', 'Verified')}</option>
                  <option value="failed">{tr('Échoués / refusés', 'Failed / rejected')}</option>
                  <option value="pending">{tr('En cours (quiz non terminé)', 'In progress (quiz not finished)')}</option>
                  <option value="ALL">{tr('Toutes', 'All')}</option>
                </select>
                <span className="ad-muted small">{tr('Les 100 plus récentes', 'The 100 most recent')}</span>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Artisan', 'Artisan')}</th><th>{tr('Métier', 'Trade')}</th><th>{tr('Quiz', 'Quiz')}</th><th>{tr('Documents', 'Documents')}</th><th>{tr('Date', 'Date')}</th><th>{tr('Statut', 'Status')}</th><th className="right" /></tr></thead>
                  <tbody>
                    {tableState(verifications, 7, verifQ.status === 'REVIEW' ? tr('🎉 Aucun dossier à examiner.', '🎉 Nothing to review.') : tr('Aucune vérification.', 'No verifications.'))}
                    {!verifications.loading && !verifications.error && verifications.rows.map((v) => (
                      <tr key={v._id}>
                        <td><strong>{personName(v.artisanId?.userId)}</strong></td>
                        <td>{v.artisanId?.profession || '—'}</td>
                        <td>{v.technicalAssessmentScore || v.mcqScore ? `${v.technicalAssessmentScore || v.mcqScore} %` : '—'}</td>
                        <td>{(v.documents || []).length}{v.videoUrl ? ' + 🎥' : ''}</td>
                        <td className="ad-muted">{formatDate(v.createdAt, lang)}</td>
                        <td><Pill map={VERIF_STATUS} value={v.status} lang={lang} /></td>
                        <td className="right"><button type="button" className="ad-btn sm" onClick={() => { setReviewing(v); setDecisionReason(''); }}>{tr('Examiner', 'Review')}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ PAYMENTS ═══ */}
          {tab === 'payments' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <select className="ad-input" value={paymentQ.status} onChange={(e) => setPaymentQ({ page: 1, status: e.target.value })}>
                  <option value="ALL">{tr('Tous les paiements', 'All payments')}</option>
                  <option value="ATTENTION">{tr('⚠️ À traiter (remboursements, versements échoués)', '⚠️ Needs action (refunds, failed payouts)')}</option>
                  {Object.keys(PAYMENT_STATUS_LABELS).map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s][lang]}</option>)}
                </select>
              </div>
              {paymentQ.status === 'ATTENTION' && (
                <p className="ad-note">
                  {tr(
                    'Remboursements et versements échoués se règlent depuis votre tableau de bord DigiPay. Une fois traité, vérifiez que le client ou l’artisan a bien reçu les fonds.',
                    'Refunds and failed payouts are settled from your DigiPay dashboard. Once handled, check that the client or artisan received the funds.'
                  )}
                </p>
              )}
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Réf', 'Ref')}</th><th>{tr('Client', 'Client')}</th><th>{tr('Artisan', 'Artisan')}</th><th className="right">{tr('Montant', 'Amount')}</th><th className="right">{tr('Frais', 'Fee')}</th><th>{tr('Mode', 'Method')}</th><th>{tr('Date', 'Date')}</th><th>{tr('Statut', 'Status')}</th></tr></thead>
                  <tbody>
                    {tableState(payments, 8, tr('Aucun paiement.', 'No payments.'))}
                    {!payments.loading && !payments.error && payments.rows.map((p) => (
                      <tr key={p._id}>
                        <td className="ad-mono" title={p.payinTransactionId}>{shortRef(p._id)}</td>
                        <td>{personName(p.customerId)}<small className="ad-sub">{p.customerPhone}</small></td>
                        <td>{personName(p.professionalId?.userId)}<small className="ad-sub">{p.artisanPhone || '—'}</small></td>
                        <td className="right"><strong>{formatFCFA(p.amount)}</strong></td>
                        <td className="right ad-muted">{formatFCFA(p.platformFee)}</td>
                        <td className="ad-muted">{p.paymentMethod === 'ORANGE' ? 'Orange' : p.paymentMethod === 'MTN' ? 'MTN' : 'MoMo'}</td>
                        <td className="ad-muted">{formatDate(p.createdAt, lang)}</td>
                        <td><span className={`ad-pill ${PAYMENT_PILL[p.status] || 'grey'}`} title={p.failureReason || ''}>{PAYMENT_STATUS_LABELS[p.status]?.[lang] || p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pager(payments, (p) => setPaymentQ((q) => ({ ...q, page: p })))}
            </div>
          )}

          {/* ═══ REQUESTS ═══ */}
          {tab === 'requests' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <select className="ad-input" value={requestQ.status} onChange={(e) => setRequestQ({ page: 1, status: e.target.value })}>
                  <option value="ALL">{tr('Tous les statuts', 'All statuses')}</option>
                  {Object.keys(REQUEST_STATUS).map((s) => <option key={s} value={s}>{REQUEST_STATUS[s][lang === 'fr' ? 0 : 1]}</option>)}
                </select>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Réf', 'Ref')}</th><th>{tr('Client', 'Client')}</th><th>{tr('Artisan', 'Artisan')}</th><th>{tr('Description', 'Description')}</th><th>{tr('Lieu', 'Location')}</th><th>{tr('Date', 'Date')}</th><th>{tr('Statut', 'Status')}</th></tr></thead>
                  <tbody>
                    {tableState(requests, 7, tr('Aucune mission.', 'No jobs.'))}
                    {!requests.loading && !requests.error && requests.rows.map((r) => (
                      <tr key={r._id}>
                        <td className="ad-mono">{shortRef(r._id)}</td>
                        <td>{personName(r.customerId)}</td>
                        <td>{personName(r.professionalId?.userId)}<small className="ad-sub">{r.professionalId?.profession}</small></td>
                        <td className="ad-ellipsis" title={r.description}>{r.description}</td>
                        <td className="ad-muted">{r.location || '—'}</td>
                        <td className="ad-muted">{formatDate(r.createdAt, lang)}</td>
                        <td><Pill map={REQUEST_STATUS} value={r.status} lang={lang} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pager(requests, (p) => setRequestQ((q) => ({ ...q, page: p })))}
            </div>
          )}

          {/* ═══ SERVICES ═══ */}
          {tab === 'services' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <input className="ad-input" placeholder={tr('Titre, description, lieu…', 'Title, description, location…')} defaultValue={serviceQ.search}
                  onKeyDown={(e) => e.key === 'Enter' && setServiceQ((q) => ({ ...q, page: 1, search: e.currentTarget.value.trim() }))} />
                <select className="ad-input" value={serviceQ.status} onChange={(e) => setServiceQ((q) => ({ ...q, page: 1, status: e.target.value }))}>
                  <option value="ALL">{tr('Tous', 'All')}</option>
                  <option value="ACTIVE">{tr('Actifs', 'Active')}</option>
                  <option value="INACTIVE">{tr('Masqués', 'Hidden')}</option>
                </select>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Service', 'Service')}</th><th>{tr('Artisan', 'Artisan')}</th><th>{tr('Catégorie', 'Category')}</th><th className="right">{tr('Prix', 'Price')}</th><th>{tr('Statut', 'Status')}</th><th className="right" /></tr></thead>
                  <tbody>
                    {tableState(services, 6, tr('Aucun service.', 'No services.'))}
                    {!services.loading && !services.error && services.rows.map((s) => (
                      <tr key={s._id}>
                        <td><strong>{s.title}</strong><small className="ad-sub ad-ellipsis">{s.description}</small></td>
                        <td>{personName(s.professionalId?.userId)}</td>
                        <td className="ad-muted">{s.categoryId?.name || '—'}</td>
                        <td className="right">{formatFCFA(s.price)}</td>
                        <td><span className={`ad-pill ${s.status === 'ACTIVE' ? 'green' : 'grey'}`}>{s.status === 'ACTIVE' ? tr('Actif', 'Active') : tr('Masqué', 'Hidden')}</span></td>
                        <td className="right">
                          <div className="ad-actions">
                            <button type="button" className="ad-btn ghost sm" disabled={busy} onClick={() => toggleService(s)}>{s.status === 'ACTIVE' ? tr('Masquer', 'Hide') : tr('Publier', 'Publish')}</button>
                            <button type="button" className="ad-btn danger sm" disabled={busy} onClick={() => deleteService(s)} aria-label={tr('Supprimer', 'Delete')}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pager(services, (p) => setServiceQ((q) => ({ ...q, page: p })))}
            </div>
          )}

          {/* ═══ REVIEWS ═══ */}
          {tab === 'reviews' && (
            <div className="ad-card">
              <div className="ad-toolbar">
                <select className="ad-input" value={reviewQ.band} onChange={(e) => setReviewQ({ page: 1, band: e.target.value })}>
                  <option value="ALL">{tr('Toutes les notes', 'All ratings')}</option>
                  <option value="LOW">{tr('★ 1–2 (à surveiller)', '★ 1–2 (watch)')}</option>
                  <option value="MID">★ 3</option>
                  <option value="HIGH">★ 4–5</option>
                </select>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>{tr('Client', 'Client')}</th><th>{tr('Artisan', 'Artisan')}</th><th>{tr('Note', 'Rating')}</th><th>{tr('Commentaire', 'Comment')}</th><th>{tr('Date', 'Date')}</th><th className="right" /></tr></thead>
                  <tbody>
                    {tableState(reviews, 6, tr('Aucun avis.', 'No reviews.'))}
                    {!reviews.loading && !reviews.error && reviews.rows.map((r) => (
                      <tr key={r._id}>
                        <td>{personName(r.customerId)}</td>
                        <td>{personName(r.professionalId?.userId)}</td>
                        <td className="ad-stars">{'★'.repeat(Math.round(r.rating))}<span>{'★'.repeat(5 - Math.round(r.rating))}</span></td>
                        <td className="ad-ellipsis wide" title={r.comment}>{r.comment || '—'}</td>
                        <td className="ad-muted">{formatDate(r.createdAt, lang)}</td>
                        <td className="right"><button type="button" className="ad-btn danger sm" disabled={busy} onClick={() => deleteReview(r)} aria-label={tr('Supprimer', 'Delete')}>🗑</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pager(reviews, (p) => setReviewQ((q) => ({ ...q, page: p })))}
            </div>
          )}

          {/* ═══ BROADCAST ═══ */}
          {tab === 'broadcast' && (
            <form className="ad-card ad-form" onSubmit={sendBroadcast}>
              <h3>{tr('Envoyer une notification', 'Send a notification')}</h3>
              <p className="ad-muted">{tr('Le message apparaît dans la cloche 🔔 des utilisateurs actifs ciblés.', 'The message appears in the 🔔 bell of the targeted active users.')}</p>
              <label>
                {tr('Destinataires', 'Recipients')}
                <select className="ad-input" value={broadcast.targetRole} onChange={(e) => setBroadcast((b) => ({ ...b, targetRole: e.target.value }))}>
                  <option value="ALL">{tr('Tous les utilisateurs actifs', 'All active users')}</option>
                  <option value="CUSTOMER">{tr('Clients', 'Clients')}</option>
                  <option value="PROFESSIONAL">{tr('Artisans', 'Artisans')}</option>
                </select>
              </label>
              <label>
                {tr('Titre', 'Title')}
                <input className="ad-input" required maxLength={120} value={broadcast.title} onChange={(e) => setBroadcast((b) => ({ ...b, title: e.target.value }))} />
              </label>
              <label>
                {tr('Message', 'Message')}
                <textarea className="ad-input" required rows={5} maxLength={1000} value={broadcast.message} onChange={(e) => setBroadcast((b) => ({ ...b, message: e.target.value }))} />
              </label>
              <button type="submit" className="ad-btn" disabled={busy}>{busy ? tr('Envoi…', 'Sending…') : tr('Envoyer', 'Send')}</button>
            </form>
          )}
        </main>
      </div>

      {/* ── DETAIL MODAL (user / artisan) ── */}
      {detail && (
        <div className="ad-modal-backdrop" onClick={() => setDetail(null)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ad-card-head">
              <h3>{detail.kind === 'user' ? personName(detail.data) : personName(detail.data.userId)}</h3>
              <button type="button" className="ad-icon-btn" onClick={() => setDetail(null)} aria-label={tr('Fermer', 'Close')}>✕</button>
            </div>
            {(() => {
              const u = detail.kind === 'user' ? detail.data : detail.data.userId || {};
              const p = detail.kind === 'artisan' ? detail.data : detail.data.professionalProfile;
              const rows = [
                [tr('E-mail', 'Email'), u.email],
                [tr('Téléphone', 'Phone'), u.phone],
                [tr('Localisation', 'Location'), u.location],
                [tr('Rôle', 'Role'), u.role],
                [tr('Inscrit le', 'Joined'), u.createdAt && formatDate(u.createdAt, lang)],
                ...(p
                  ? [
                      [tr('Métier', 'Trade'), p.profession],
                      [tr('Expérience', 'Experience'), p.experience ? `${p.experience} ${tr('ans', 'years')}` : null],
                      [tr('Vérification', 'Verification'), p.verifiedBadge ? tr('Vérifié ✓', 'Verified ✓') : p.verificationStatus],
                      [tr('Score quiz', 'Quiz score'), p.verificationScore ? `${p.verificationScore} %` : null],
                      [tr('Note', 'Rating'), p.rating ? `★ ${Number(p.rating).toFixed(1)}` : null],
                      [tr('Missions terminées', 'Completed jobs'), p.completedMissions],
                      [tr('Gains', 'Earnings'), p.walletBalance != null ? formatFCFA(p.walletBalance) : null],
                      [tr('Zone', 'Area'), p.serviceArea],
                    ]
                  : []),
              ].filter(([, v]) => v !== undefined && v !== null && v !== '');
              return (
                <>
                  <dl className="ad-dl">
                    {rows.map(([k, v]) => (
                      <React.Fragment key={k}><dt>{k}</dt><dd>{String(v)}</dd></React.Fragment>
                    ))}
                  </dl>
                  {p?.bio && <p className="ad-muted">{p.bio}</p>}
                  {p?.videoUrl && <a className="ad-link" href={p.videoUrl} target="_blank" rel="noreferrer">🎥 {tr('Vidéo de présentation', 'Presentation video')}</a>}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── VERIFICATION REVIEW MODAL ── */}
      {reviewing && (
        <div className="ad-modal-backdrop" onClick={() => setReviewing(null)}>
          <div className="ad-modal wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ad-card-head">
              <div>
                <h3>{personName(reviewing.artisanId?.userId)}</h3>
                <small className="ad-muted">{reviewing.artisanId?.profession} · {reviewing.artisanId?.userId?.email}</small>
              </div>
              <button type="button" className="ad-icon-btn" onClick={() => setReviewing(null)} aria-label={tr('Fermer', 'Close')}>✕</button>
            </div>
            <div className="ad-review-scores">
              <div><small>{tr('Quiz technique', 'Technical quiz')}</small><strong>{reviewing.technicalAssessmentScore || reviewing.mcqScore || 0} %</strong></div>
              <div><small>{tr('Statut actuel', 'Current status')}</small><Pill map={VERIF_STATUS} value={reviewing.status} lang={lang} /></div>
              <div><small>{tr('Décision', 'Decision')}</small><span className="ad-muted small">{reviewing.adminDecision || '—'}</span></div>
            </div>
            <h4>{tr('Documents', 'Documents')}</h4>
            {(reviewing.documents || []).length === 0 ? (
              <p className="ad-muted">{tr('Aucun document fourni.', 'No documents provided.')}</p>
            ) : (
              <div className="ad-docs">
                {reviewing.documents.map((d) => (
                  <a key={d._id} href={d.fileUrl} target="_blank" rel="noreferrer" className="ad-doc">
                    {/\.(jpe?g|png|webp|gif)(\?|$)/i.test(d.fileUrl) ? <img src={d.fileUrl} alt={d.documentType} /> : <span className="ad-doc-file">📄</span>}
                    <span>{d.documentType}</span>
                    <small className={`ad-pill ${d.reviewStatus === 'APPROVED' ? 'green' : d.reviewStatus === 'REJECTED' ? 'red' : 'amber'}`}>{d.reviewStatus}</small>
                  </a>
                ))}
              </div>
            )}
            {reviewing.videoUrl && <p><a className="ad-link" href={reviewing.videoUrl} target="_blank" rel="noreferrer">🎥 {tr('Voir la vidéo de présentation', 'Watch presentation video')}</a></p>}
            <label className="ad-form">
              {tr('Motif (envoyé avec la décision)', 'Reason (saved with the decision)')}
              <textarea className="ad-input" rows={3} value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)}
                placeholder={tr('ex : Pièce d’identité illisible, merci de la renvoyer.', 'e.g. ID unreadable, please upload again.')} />
            </label>
            <div className="ad-modal-actions">
              <button type="button" className="ad-btn danger" disabled={busy} onClick={() => decideVerification('reject')}>{tr('Refuser', 'Reject')}</button>
              <button type="button" className="ad-btn" disabled={busy} onClick={() => decideVerification('approve')}>{tr('Approuver ✓', 'Approve ✓')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

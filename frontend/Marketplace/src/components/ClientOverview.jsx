import React, { useMemo } from 'react';
import { formatDate, formatFCFA } from '../api';

const PAID_STATUSES = ['HELD', 'PROCESSING', 'SUCCESS'];
const MONTHS = 8;

const STATUS_PILL = {
  PENDING: { fr: 'En attente', en: 'Pending', cls: 'amber' },
  ACCEPTED: { fr: 'Acceptée', en: 'Accepted', cls: 'blue' },
  IN_PROGRESS: { fr: 'En cours', en: 'In progress', cls: 'green' },
  COMPLETED: { fr: 'Terminée', en: 'Completed', cls: 'dark' },
  CANCELLED: { fr: 'Annulée', en: 'Cancelled', cls: 'grey' },
  REJECTED: { fr: 'Refusée', en: 'Declined', cls: 'grey' },
};

/** Small decorative bar group used in the KPI cards (values 0..1). */
function MiniBars({ values, highlightLast = true }) {
  const max = Math.max(...values, 1);
  return (
    <div className="cd-minibars" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className={highlightLast && i === values.length - 1 ? 'hi' : ''}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** Last N calendar months as [{ key: 'YYYY-M', label }] (oldest first). */
function lastMonths(n, lang) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short' }).replace('.', ''),
    });
  }
  return out;
}

const monthKey = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : `${d.getFullYear()}-${d.getMonth()}`;
};

export default function ClientOverview({
  orders,
  payments,
  bookmarks,
  artisans,
  loading,
  tr,
  lang,
  onGoto,
  onSelectArtisan,
  onBook,
}) {
  const stats = useMemo(() => {
    const paid = payments.filter((p) => PAID_STATUSES.includes(p.status));
    const months = lastMonths(MONTHS, lang);

    const spendByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
    const bookingsByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));
    const completedByMonth = Object.fromEntries(months.map((m) => [m.key, 0]));

    paid.forEach((p) => {
      const k = monthKey(p.paidAt || p.createdAt);
      if (k in spendByMonth) spendByMonth[k] += p.amount;
    });
    orders.forEach((o) => {
      const k = monthKey(o.date);
      if (k in bookingsByMonth) bookingsByMonth[k] += 1;
      if (o.status === 'COMPLETED' && k in completedByMonth) completedByMonth[k] += 1;
    });

    return {
      months,
      spend: months.map((m) => spendByMonth[m.key]),
      bookings: months.map((m) => bookingsByMonth[m.key]),
      completedSeries: months.map((m) => completedByMonth[m.key]),
      active: orders.filter((o) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      totalPaid: paid.reduce((s, p) => s + p.amount, 0),
      inEscrow: paid.filter((p) => p.status === 'HELD').reduce((s, p) => s + p.amount, 0),
      released: paid.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0),
    };
  }, [orders, payments, lang]);

  const topArtisans = useMemo(
    () =>
      [...artisans]
        .sort((a, b) => Number(b.verified) - Number(a.verified) || b.rating - a.rating || b.reviews - a.reviews)
        .slice(0, 4),
    [artisans]
  );

  const recent = orders.slice(0, 5);
  const maxSpend = Math.max(...stats.spend, 1);
  const hasSpend = stats.spend.some((v) => v > 0);
  const currentIdx = stats.months.length - 1;

  return (
    <div className="cd-overview">
      {/* ── KPI row ─────────────────────────────────────────────── */}
      <section className="cd-kpis">
        <button type="button" className="cd-card cd-kpi dark" onClick={() => onGoto('ORDERS')}>
          <span className="cd-kpi-label">{tr('Réservations actives', 'Active bookings')}</span>
          <div className="cd-kpi-row">
            <div>
              <strong className="cd-kpi-value">{stats.active}</strong>
              <span className="cd-kpi-sub">{tr('en attente, acceptées ou en cours', 'pending, accepted or in progress')}</span>
            </div>
            <MiniBars values={stats.bookings.slice(-5)} />
          </div>
        </button>

        <button type="button" className="cd-card cd-kpi" onClick={() => onGoto('PAYMENTS')}>
          <span className="cd-kpi-label">{tr('En séquestre', 'Held in escrow')}</span>
          <div className="cd-kpi-row">
            <div>
              <strong className="cd-kpi-value">{formatFCFA(stats.inEscrow)}</strong>
              <span className="cd-kpi-sub">🔒 {tr('libéré à votre validation', 'released when you confirm')}</span>
            </div>
            <MiniBars values={stats.spend.slice(-5)} />
          </div>
        </button>

        <button type="button" className="cd-card cd-kpi" onClick={() => onGoto('ORDERS')}>
          <span className="cd-kpi-label">{tr('Travaux terminés', 'Completed jobs')}</span>
          <div className="cd-kpi-row">
            <div>
              <strong className="cd-kpi-value">{stats.completed}</strong>
              <span className="cd-kpi-sub">⭐ {bookmarks.length} {tr('artisan(s) en favoris', 'bookmarked artisan(s)')}</span>
            </div>
            <MiniBars values={stats.completedSeries.slice(-5)} />
          </div>
        </button>
      </section>

      {/* ── Chart + big stat ───────────────────────────────────── */}
      <section className="cd-grid-2">
        <div className="cd-card cd-chart-card">
          <div className="cd-card-head">
            <h3>{tr('Dépenses mensuelles', 'Monthly spending')}</h3>
            <span className="cd-chip">{MONTHS} {tr('mois', 'months')}</span>
          </div>
          <div className="cd-chart" role="img" aria-label={tr('Dépenses par mois', 'Spending per month')}>
            {stats.spend.map((v, i) => (
              <div key={stats.months[i].key} className="cd-chart-col">
                <div className="cd-chart-track">
                  {i === currentIdx && v > 0 && <span className="cd-chart-tip">{formatFCFA(v)}</span>}
                  <div
                    className={`cd-chart-bar ${i === currentIdx ? 'current' : ''}`}
                    style={{ height: `${hasSpend ? Math.max(4, (v / maxSpend) * 100) : 6}%` }}
                    title={`${stats.months[i].label} : ${formatFCFA(v)}`}
                  />
                </div>
                <span className="cd-chart-label">{stats.months[i].label}</span>
              </div>
            ))}
            {!hasSpend && !loading && (
              <p className="cd-chart-empty">{tr('Vos paiements apparaîtront ici.', 'Your payments will appear here.')}</p>
            )}
          </div>
        </div>

        <div className="cd-card cd-bigstat">
          <strong className="cd-bigstat-value">{formatFCFA(stats.totalPaid)}</strong>
          <span className="cd-bigstat-sub">↗ {tr('payés via Mobile Money', 'paid via Mobile Money')}</span>
          <div className="cd-bigstat-item">
            <span className="cd-bigstat-icon">✓</span>
            <div>
              <strong>{tr('Versé aux artisans', 'Paid to artisans')}</strong>
              <span>{formatFCFA(stats.released)}</span>
            </div>
          </div>
          <div className="cd-bigstat-item">
            <span className="cd-bigstat-icon">🔒</span>
            <div>
              <strong>{tr('En séquestre', 'In escrow')}</strong>
              <span>{formatFCFA(stats.inEscrow)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent bookings + top artisans ─────────────────────── */}
      <section className="cd-grid-2">
        <div className="cd-card cd-table-card">
          <div className="cd-card-head">
            <h3>{tr('Réservations récentes', 'Recent bookings')}</h3>
            <button type="button" className="cd-chip dark" onClick={() => onGoto('ORDERS')}>
              {tr('Tout voir', 'View all')} →
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="cd-empty">
              <p>{loading ? tr('Chargement…', 'Loading…') : tr("Vous n'avez pas encore de réservation.", 'No bookings yet.')}</p>
              {!loading && (
                <button type="button" className="cd-btn-primary" onClick={() => onGoto('EXPLORE')}>
                  {tr('Trouver un artisan', 'Find an artisan')}
                </button>
              )}
            </div>
          ) : (
            <div className="cd-table-scroll">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>{tr('Artisan', 'Artisan')}</th>
                    <th className="cd-col-job">{tr('Prestation', 'Job')}</th>
                    <th>{tr('Statut', 'Status')}</th>
                    <th className="num">{tr('Montant', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => {
                    const pill = STATUS_PILL[o.status] || { fr: o.status, en: o.status, cls: 'grey' };
                    return (
                      <tr key={o.id} onClick={() => onGoto('ORDERS')}>
                        <td>
                          <div className="cd-person">
                            <span className="cd-person-dot">{(o.artisan || '?').charAt(0)}</span>
                            <div>
                              <strong>{o.artisan}</strong>
                              <span>{o.profession}</span>
                            </div>
                          </div>
                        </td>
                        <td className="cd-col-job">
                          <div className="cd-job">
                            <strong title={o.title}>{o.title}</strong>
                            <span>{formatDate(o.date, lang)}</span>
                          </div>
                        </td>
                        <td><span className={`cd-pill ${pill.cls}`}>{lang === 'fr' ? pill.fr : pill.en}</span></td>
                        <td className="num">{o.amount ? formatFCFA(o.amount) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="cd-card cd-feature">
          <div className="cd-card-head">
            <h3>{tr('Artisans recommandés', 'Recommended artisans')}</h3>
            <button type="button" className="cd-chip light" onClick={() => onGoto('EXPLORE')}>
              {tr('Explorer', 'Explore')}
            </button>
          </div>
          {topArtisans.length === 0 ? (
            <p className="cd-feature-empty">{loading ? tr('Chargement…', 'Loading…') : tr('Aucun artisan pour le moment.', 'No artisans yet.')}</p>
          ) : (
            <ul className="cd-feature-list">
              {topArtisans.map((a) => (
                <li key={a.id}>
                  <button type="button" className="cd-feature-item" onClick={() => onSelectArtisan?.(a)}>
                    <img src={a.image} alt="" />
                    <div>
                      <strong>{a.name}{a.verified ? ' ✓' : ''}</strong>
                      <span>{a.profession}{a.city ? ` • ${a.city}` : ''}</span>
                    </div>
                    <span className="cd-feature-rating">★ {a.rating ? a.rating.toFixed(1) : '—'}</span>
                  </button>
                  <button type="button" className="cd-feature-book" onClick={() => onBook?.(a)} aria-label={`${tr('Réserver', 'Book')} ${a.name}`}>
                    →
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

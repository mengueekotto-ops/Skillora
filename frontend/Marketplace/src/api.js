// Shared API client and data mappers for the Skillora marketplace.
// Every component talks to the backend through `api()` so the token, errors
// and session expiry are handled the same way everywhere.

const API_BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'skillora_token';
const ADMIN_TOKEN_KEY = 'skillora_admin_token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const safeStorage = {
  get: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove: (key) => {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  },
};

export const getToken = () => safeStorage.get(TOKEN_KEY) || safeStorage.get(ADMIN_TOKEN_KEY);

export const saveSession = (token, user) => {
  if (!token) return;
  safeStorage.set(TOKEN_KEY, token);
  if (user?.role === 'ADMIN') safeStorage.set(ADMIN_TOKEN_KEY, token);
};

export const clearSession = () => {
  safeStorage.remove(TOKEN_KEY);
  safeStorage.remove(ADMIN_TOKEN_KEY);
};

/**
 * Call the backend. Throws ApiError with the server's message on failure.
 * @param {string} path  e.g. '/professionals'
 * @param {{method?: string, body?: any, formData?: FormData, auth?: boolean}} options
 */
export async function api(path, { method = 'GET', body, formData, auth = true } = {}) {
  const headers = {};
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Serveur injoignable. Vérifiez votre connexion. / Server unreachable.', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }

  if (res.status === 401 && token) {
    // Token expired or revoked: let the app log the user out
    window.dispatchEvent(new CustomEvent('skillora:unauthorized'));
  }

  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.message || `Erreur ${res.status}`, res.status, data);
  }
  return data;
}

// ── Formatting helpers ──────────────────────────────────────────────────────

export const formatFCFA = (amount) => `${Math.round(Number(amount) || 0).toLocaleString('fr-FR')} FCFA`;

export const formatDate = (value, lang = 'fr') => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const shortRef = (id) => `SK-${String(id || '').slice(-6).toUpperCase()}`;

/** Initials avatar as an inline SVG, so no external image is needed. */
export const avatarFor = (name = '?') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#1f3a34"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="#e8c77a">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80';

const toWhatsapp = (phone) => String(phone || '').replace(/[^\d]/g, '');

// ── Data mappers: backend documents → the shape the UI components use ─────────

/** Normalise the user object returned by /auth/login, /auth/register and /auth/me. */
export function normalizeUser(user) {
  if (!user) return null;
  const prof = user.professionalProfile || null;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return {
    id: user.id || user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isAdmin: user.role === 'ADMIN',
    city: user.location || '',
    location: user.location || '',
    profileImage: user.profileImage || null,
    professionalProfile: prof,
    professionalId: prof?._id || prof?.id || null,
    artisanType: prof?.artisanType || null,
    verificationStatus: prof?.verificationStatus || null,
    verifiedBadge: Boolean(prof?.verifiedBadge),
    verificationScore: prof?.verificationScore ?? null,
  };
}

/** Map a Professional document (with populated userId) to an artisan card/profile. */
export function mapProfessional(p) {
  if (!p) return null;
  const user = p.userId && typeof p.userId === 'object' ? p.userId : {};
  const personName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const isGrouped = p.artisanType === 'GROUPED';
  const name = (isGrouped && p.groupName) || personName || 'Artisan Skillora';
  const services = Array.isArray(p.services) ? p.services : [];
  const prices = services.map((s) => Number(s.price)).filter((n) => n > 0);
  const reviewList = Array.isArray(p.reviews) ? p.reviews : [];

  return {
    id: p._id || p.id,
    userId: user._id || user.id || p.userId,
    name,
    businessName: isGrouped ? p.groupName || name : `${p.profession} • ${name}`,
    type: isGrouped ? 'Grouped Artisan (Workshop)' : 'Single Artisan (Master Specialist)',
    isGrouped,
    profession: p.profession || '',
    city: p.serviceArea || user.location || '',
    location: p.serviceArea || user.location || '',
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    distanceText: p.distanceText || null,
    rating: Number(p.rating || 0),
    reviews: p.reviewCount ?? reviewList.length,
    reviewList,
    verified: Boolean(p.verifiedBadge),
    verificationStatus: p.verificationStatus,
    trustLevel: p.trustLevel || 'NEW',
    badge: p.verifiedBadge ? 'Artisan Vérifié' : 'Nouveau Pro',
    priceRate: prices.length ? `dès ${formatFCFA(Math.min(...prices))}` : 'Sur devis',
    phone: user.phone || '',
    whatsapp: toWhatsapp(user.phone),
    image: user.profileImage || avatarFor(name),
    coverPhoto: p.coverPhoto || DEFAULT_COVER,
    experience: p.experience ? `${p.experience} ans` : '—',
    experienceYears: Number(p.experience || 0),
    skills: Array.isArray(p.skills) ? p.skills : [],
    bio: p.bio || '',
    videoUrl: p.videoUrl || null,
    gallery: (Array.isArray(p.portfolio) ? p.portfolio : [])
      .map((item, idx) =>
        typeof item === 'string'
          ? { id: idx, title: '', img: item }
          : { id: item.id || idx, title: item.title || '', img: item.img || item.url || item.image }
      )
      .filter((g) => g.img),
    services,
    completedMissions: p.completedMissions || 0,
    isAvailable: p.availability?.isAvailable !== false,
  };
}

const STATUS_STEP = { PENDING: 1, ACCEPTED: 2, IN_PROGRESS: 4, COMPLETED: 5 };

/** Map a ServiceRequest (populated) + its payments to an order card. */
export function mapRequest(r, payments = []) {
  const prof = r.professionalId && typeof r.professionalId === 'object' ? r.professionalId : {};
  const proUser = prof.userId && typeof prof.userId === 'object' ? prof.userId : {};
  const customer = r.customerId && typeof r.customerId === 'object' ? r.customerId : {};
  const related = payments.filter((p) => String(p.serviceRequestId?._id || p.serviceRequestId) === String(r._id));
  const activePayment =
    related.find((p) => ['HELD', 'PROCESSING', 'SUCCESS'].includes(p.status)) ||
    related.find((p) => p.status === 'PENDING') ||
    null;
  const isPaid = Boolean(activePayment && activePayment.status !== 'PENDING');

  let step = STATUS_STEP[r.status] || 1;
  if (r.status === 'ACCEPTED' && isPaid) step = 3;

  const artisanName =
    (prof.artisanType === 'GROUPED' && prof.groupName) ||
    `${proUser.firstName || ''} ${proUser.lastName || ''}`.trim() ||
    'Artisan';

  return {
    id: r._id,
    ref: shortRef(r._id),
    title: r.serviceId?.title || r.description,
    description: r.description,
    artisan: artisanName,
    professionalId: prof._id || r.professionalId,
    profession: prof.profession || '',
    customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    customerPhone: customer.phone || '',
    date: r.scheduledDate || r.createdAt,
    location: r.location || '',
    status: r.status,
    step,
    whatsapp: toWhatsapp(proUser.phone),
    customerWhatsapp: toWhatsapp(customer.phone),
    suggestedAmount: Number(r.serviceId?.price || 0),
    payment: activePayment,
    amount: Number(activePayment?.amount || r.serviceId?.price || 0),
    isPaid,
    escrowLocked: activePayment?.status === 'HELD',
  };
}

export const PAYMENT_STATUS_LABELS = {
  PENDING: { fr: '⏳ En attente de validation MoMo', en: '⏳ Awaiting MoMo approval', cls: 'locked' },
  HELD: { fr: '🔒 Bloqué en séquestre', en: '🔒 Held in escrow', cls: 'locked' },
  PROCESSING: { fr: '⏳ Versement en cours', en: '⏳ Payout processing', cls: 'locked' },
  SUCCESS: { fr: "✓ Payé à l'artisan", en: '✓ Paid to artisan', cls: 'success' },
  FAILED: { fr: '✕ Échoué', en: '✕ Failed', cls: 'failed' },
  CANCELLED: { fr: '✕ Annulé', en: '✕ Cancelled', cls: 'failed' },
  PAYOUT_FAILED: { fr: '⚠️ Versement échoué (support)', en: '⚠️ Payout failed (support)', cls: 'failed' },
  REFUND_PENDING: { fr: '↩️ Remboursement en cours', en: '↩️ Refund pending', cls: 'locked' },
};

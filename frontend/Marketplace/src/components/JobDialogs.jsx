import React, { useState } from 'react';
import { api, formatFCFA } from '../api';

// Shared dialogs for booking an artisan, paying into escrow and reviewing a finished job.

export function Dialog({ title, onClose, children }) {
  return (
    <div className="modal-backdrop-luxury" onClick={onClose}>
      <div className="wallet-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="wallet-modal-header">
          <div className="wallet-header-title">
            <h2>{title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

export function BookingDialog({ artisan, defaultLocation, tr, onClose, onBooked, triggerToast }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [scheduledDate, setScheduledDate] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [sending, setSending] = useState(false);
  const services = artisan.services || [];

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api('/requests', {
        method: 'POST',
        body: {
          professionalId: artisan.id,
          serviceId: serviceId || undefined,
          description,
          location,
          scheduledDate: scheduledDate || undefined,
        },
      });
      triggerToast(tr(`Demande envoyée à ${artisan.name} !`, `Booking request sent to ${artisan.name}!`), '⭐');
      onBooked();
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog title={tr(`Réserver ${artisan.name}`, `Book ${artisan.name}`)} onClose={onClose}>
      <form onSubmit={submit} className="client-settings-form">
        {services.length > 0 && (
          <div className="field">
            <label className="field-label">{tr('Service', 'Service')}</label>
            <select className="input-field" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">{tr('— Demande personnalisée —', '— Custom request —')}</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>{s.title} — {formatFCFA(s.price)}</option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label className="field-label">{tr('Décrivez votre besoin', 'Describe what you need')}</label>
          <textarea className="input-field" rows={4} required minLength={10} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={tr("Ex : fuite d'eau sous l'évier de la cuisine", 'e.g. water leak under the kitchen sink')} />
        </div>
        <div className="form-two-col">
          <div className="field">
            <label className="field-label">{tr('Adresse / Quartier', 'Address / Area')}</label>
            <input className="input-field" required value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">{tr('Date souhaitée', 'Preferred date')}</label>
            <input type="date" className="input-field" min={new Date().toISOString().slice(0, 10)} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn-primary-gold" disabled={sending} style={{ marginTop: '1rem', width: '100%' }}>
          {sending ? tr('Envoi…', 'Sending…') : tr('Envoyer la demande →', 'Send request →')}
        </button>
      </form>
    </Dialog>
  );
}

export function PaymentDialog({ order, defaultPhone, tr, onClose, onDone, triggerToast }) {
  const [amount, setAmount] = useState(order.payment?.amount || order.suggestedAmount || '');
  const [phone, setPhone] = useState(defaultPhone);
  const [method, setMethod] = useState('MTN');
  const [payment, setPayment] = useState(order.payment?.status === 'PENDING' ? order.payment : null);
  const [working, setWorking] = useState(false);
  const fee = Math.round((Number(amount) || 0) * 0.02);

  const initiate = async (e) => {
    e.preventDefault();
    setWorking(true);
    try {
      const res = await api('/payments/initiate', {
        method: 'POST',
        body: { serviceRequestId: order.id, amount: Number(amount), customerPhone: phone, paymentMethod: method },
      });
      setPayment(res.data.payment);
      triggerToast(res.message, '📲');
    } catch (err) {
      if (err.data?.data?.payment?.status === 'PENDING') setPayment(err.data.data.payment);
      triggerToast(err.message, '⚠️');
    } finally {
      setWorking(false);
    }
  };

  const confirm = async () => {
    setWorking(true);
    try {
      const res = await api('/payments/confirm', { method: 'POST', body: { paymentId: payment._id } });
      if (res.pending) {
        triggerToast(res.message, '⏳');
      } else {
        triggerToast(res.message, '🔒');
        onDone();
      }
    } catch (err) {
      triggerToast(err.message, '⚠️');
      if (err.status === 400) onDone();
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog title={tr(`Paiement ${order.ref}`, `Payment ${order.ref}`)} onClose={onClose}>
      {!payment ? (
        <form onSubmit={initiate} className="client-settings-form">
          <div className="form-two-col">
            <div className="field">
              <label className="field-label">{tr('Montant convenu (FCFA)', 'Agreed amount (FCFA)')}</label>
              <input type="number" className="input-field" min={100} step={1} required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">{tr('Opérateur', 'Provider')}</label>
              <select className="input-field" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="MTN">MTN Mobile Money</option>
                <option value="ORANGE">Orange Money</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label">{tr('Numéro Mobile Money', 'Mobile Money number')}</label>
            <input type="tel" className="input-field" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XX XX XX XX" />
          </div>
          <p className="order-meta-info">
            {tr('Dont frais de service Skillora (2%)', 'Includes Skillora service fee (2%)')} : {formatFCFA(fee)} •{' '}
            {tr("Versé à l'artisan après validation", 'Paid to artisan after confirmation')} : {formatFCFA((Number(amount) || 0) - fee)}
          </p>
          <button type="submit" className="btn-primary-gold" disabled={working} style={{ marginTop: '1rem', width: '100%' }}>
            {working ? tr('Envoi…', 'Sending…') : tr('Envoyer la demande Mobile Money', 'Send Mobile Money request')}
          </button>
        </form>
      ) : (
        <div>
          <p className="order-meta-info">
            📲 {tr(
              `Une demande de ${formatFCFA(payment.amount)} a été envoyée au ${payment.customerPhone}. Validez-la sur votre téléphone, puis cliquez ci-dessous.`,
              `A request for ${formatFCFA(payment.amount)} was sent to ${payment.customerPhone}. Approve it on your phone, then click below.`
            )}
          </p>
          <button className="btn-primary-gold" disabled={working} onClick={confirm} style={{ marginTop: '1rem', width: '100%' }}>
            {working ? tr('Vérification…', 'Checking…') : tr("J'ai validé le paiement ✓", 'I approved the payment ✓')}
          </button>
        </div>
      )}
    </Dialog>
  );
}

export function ReviewDialog({ order, tr, onClose, onDone, triggerToast }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api('/reviews', {
        method: 'POST',
        body: { professionalId: order.professionalId, serviceRequestId: order.id, rating, comment },
      });
      triggerToast(tr('Merci ! Votre avis a été publié.', 'Thank you! Your review was published.'), '⭐');
      onDone();
    } catch (err) {
      triggerToast(err.message, '⚠️');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog title={tr(`Avis sur ${order.artisan}`, `Review ${order.artisan}`)} onClose={onClose}>
      <form onSubmit={submit} className="client-settings-form">
        <div className="field">
          <label className="field-label">{tr('Note', 'Rating')}</label>
          <div style={{ display: 'flex', gap: '0.4rem', fontSize: '1.8rem' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}/5`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: n <= rating ? '#e8b64a' : 'var(--text-dim)' }}>★</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field-label">{tr('Commentaire', 'Comment')}</label>
          <textarea className="input-field" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary-gold" disabled={sending} style={{ marginTop: '1rem', width: '100%' }}>
          {sending ? tr('Envoi…', 'Sending…') : tr("Publier l'avis", 'Publish review')}
        </button>
      </form>
    </Dialog>
  );
}

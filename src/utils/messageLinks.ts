import { Contact, DraftMessage } from '../types';

export function buildMessageLink(draft: DraftMessage, contact?: Contact): string {
  const phone = (contact?.phone || '').replace(/\D/g, '');
  const email = contact?.email || '';
  if (draft.channel === 'whatsapp') {
    if (!phone) throw new Error('A phone number is required for WhatsApp.');
    return `https://wa.me/${phone}?text=${encodeURIComponent(draft.body)}`;
  }
  if (draft.channel === 'sms') {
    if (!phone) throw new Error('A phone number is required for SMS.');
    return `sms:${phone}?body=${encodeURIComponent(draft.body)}`;
  }
  if (!email) throw new Error('An email address is required for email.');
  return `mailto:${email}?subject=${encodeURIComponent(draft.subject || 'Notice of Delay')}&body=${encodeURIComponent(draft.body)}`;
}

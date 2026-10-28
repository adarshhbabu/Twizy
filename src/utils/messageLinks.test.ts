import { describe, expect, it } from 'vitest';
import { Contact, DraftMessage } from '../types';
import { buildMessageLink } from './messageLinks';

const contact: Contact = {
  id: 'c1',
  name: 'Coach Rahul',
  relationship: 'Coach',
  phone: '+91 98765 43210',
  email: 'rahul@example.com',
  defaultTone: 'casual',
};

const draft = (channel: DraftMessage['channel']): DraftMessage => ({
  recipient_name: 'Coach Rahul',
  channel,
  tone: 'casual',
  subject: 'Late',
  body: 'I am 15 minutes late & moving.',
});

describe('message links', () => {
  it('encodes WhatsApp, SMS, and email links', () => {
    expect(buildMessageLink(draft('whatsapp'), contact)).toBe(
      'https://wa.me/919876543210?text=I%20am%2015%20minutes%20late%20%26%20moving.'
    );
    expect(buildMessageLink(draft('sms'), contact)).toContain('sms:919876543210?body=');
    expect(buildMessageLink(draft('email'), contact)).toBe(
      'mailto:rahul@example.com?subject=Late&body=I%20am%2015%20minutes%20late%20%26%20moving.'
    );
  });
});

import React, { useState } from 'react';
import { Contact, DraftMessage, MessageChannel, Tone } from '../types';
import { Send, MessageSquare, Mail, Smartphone, Edit2, Check, RefreshCw } from 'lucide-react';

interface DraftMessageCardProps {
  initialDraft: DraftMessage;
  contacts: Contact[];
  onToneChange?: (newTone: Tone) => void;
}

export const DraftMessageCard: React.FC<DraftMessageCardProps> = ({
  initialDraft,
  contacts,
}) => {
  const [recipient, setRecipient] = useState(initialDraft.recipient_name);
  const [channel, setChannel] = useState<MessageChannel>(initialDraft.channel);
  const [tone, setTone] = useState<Tone>(initialDraft.tone);
  const [subject, setSubject] = useState(initialDraft.subject || '');
  const [body, setBody] = useState(initialDraft.body);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Match contact to get phone/email
  const matchedContact = contacts.find(
    (c) => c.name.toLowerCase().includes(recipient.toLowerCase()) || recipient.toLowerCase().includes(c.name.toLowerCase())
  );

  // Switch tone variations
  const handleToneSelect = (selectedTone: Tone) => {
    setTone(selectedTone);
    if (selectedTone === 'casual') {
      setBody(
        recipient.toLowerCase().includes('coach')
          ? "Hey Coach, running 15 mins late due to transit chaos. Moving fast, see you at 4:15!"
          : recipient.toLowerCase().includes('mom')
          ? "Hey Mom, got caught up in lab. Will be home a bit later!"
          : `Hey ${recipient}, running a bit behind schedule. Heading over now!`
      );
    } else if (selectedTone === 'polite') {
      setBody(
        `Hi ${recipient}, apologies for the slight delay. I encountered an unexpected campus delay and will arrive in approximately 15 minutes.`
      );
    } else if (selectedTone === 'formal') {
      setBody(
        `Dear ${recipient},\n\nPlease accept my apologies for being delayed due to unexpected transit circumstances. I anticipate arriving within 15 minutes. Thank you for your understanding.`
      );
    }
  };

  const getCleanNumber = (phoneStr: string) => {
    return phoneStr.replace(/[^0-9]/g, '');
  };

  const handleSend = () => {
    const phone = matchedContact?.phone || '+919876543210';
    const cleanPhone = getCleanNumber(phone);
    const email = matchedContact?.email || 'student@university.edu';

    let url = '';
    if (channel === 'whatsapp') {
      url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(body)}`;
    } else if (channel === 'sms') {
      url = `sms:${cleanPhone}?body=${encodeURIComponent(body)}`;
    } else if (channel === 'email') {
      const emailSubject = subject || 'Notice of Delay';
      url = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-lg text-neutral-100">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            {channel === 'whatsapp' ? (
              <MessageSquare className="w-4 h-4" />
            ) : channel === 'email' ? (
              <Mail className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-300">
              Draft Message for <span className="text-emerald-400 font-bold">{recipient}</span>
            </div>
            {matchedContact && (
              <div className="text-[11px] text-neutral-500">
                {matchedContact.relationship} • {channel === 'email' ? matchedContact.email : matchedContact.phone}
              </div>
            )}
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl text-xs">
          {(['whatsapp', 'email', 'sms'] as MessageChannel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                channel === ch
                  ? 'bg-emerald-600 text-white font-medium shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Switcher */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-neutral-400">Tone:</span>
        <div className="flex items-center gap-1 bg-neutral-800/80 p-0.5 rounded-lg text-xs">
          {(['casual', 'polite', 'formal'] as Tone[]).map((t) => (
            <button
              key={t}
              onClick={() => handleToneSelect(t)}
              className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                tone === t
                  ? 'bg-neutral-700 text-emerald-300 font-semibold border border-neutral-600'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Email Subject line if applicable */}
      {channel === 'email' && (
        <div className="mb-2">
          <label className="text-[11px] text-neutral-400 block mb-1">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-emerald-500"
            placeholder="Subject..."
          />
        </div>
      )}

      {/* Body Area */}
      <div className="relative mb-3">
        {isEditing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full text-xs p-3 rounded-xl bg-neutral-800 border border-emerald-500/60 text-neutral-200 focus:outline-none resize-none font-sans leading-relaxed"
          />
        ) : (
          <div className="text-xs p-3 rounded-xl bg-neutral-800/70 border border-neutral-700/60 text-neutral-200 font-sans leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3 text-neutral-400" />
            <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <RefreshCw className="w-3 h-3 text-neutral-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <button
          onClick={handleSend}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send via {channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? 'Email' : 'SMS'}</span>
        </button>
      </div>

      <p className="text-[10px] text-neutral-500 mt-2 italic text-center">
        * Twizy never automatically transmits messages. Tapping Send opens your preferred app with pre-filled content.
      </p>
    </div>
  );
};

import { TwizyResponse } from '../types';

const EMPTY_RESPONSE: Omit<TwizyResponse, 'reply'> = {
  needs_confirmation: false,
  events_to_add: [],
  events_to_update: [],
  events_to_remove: [],
  change_log: [],
  draft_message: null,
  ask_user: null,
  preferences_update: null,
};

export function parseTwizyResponse(raw: string): TwizyResponse {
  const withoutCodeFence = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const parsed = JSON.parse(withoutCodeFence) as Partial<TwizyResponse>;
  if (!parsed || typeof parsed.reply !== 'string') {
    throw new Error('Gemini returned JSON without a reply field.');
  }

  const reply = parsed.reply;
  if (typeof reply !== 'string') {
    throw new Error('Gemini returned JSON without a reply field.');
  }
  return {
    ...EMPTY_RESPONSE,
    ...parsed,
    reply,
    needs_confirmation: Boolean(parsed.needs_confirmation),
    events_to_add: Array.isArray(parsed.events_to_add) ? parsed.events_to_add : [],
    events_to_update: Array.isArray(parsed.events_to_update) ? parsed.events_to_update : [],
    events_to_remove: Array.isArray(parsed.events_to_remove) ? parsed.events_to_remove : [],
    change_log: Array.isArray(parsed.change_log) ? parsed.change_log : [],
  };
}

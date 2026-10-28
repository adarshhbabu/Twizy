export type EventType = 'class' | 'graded' | 'deadline' | 'club' | 'personal';

export interface TwizyEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24h)
  duration_minutes: number;
  type: EventType;
  priority: number; // 1 - 5
  must_attend: boolean;
  source: string;
  location?: string;
}

export type Tone = 'casual' | 'polite' | 'formal';
export type MessageChannel = 'whatsapp' | 'sms' | 'email';

export interface DraftMessage {
  recipient_name: string;
  channel: MessageChannel;
  tone: Tone;
  subject?: string;
  body: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  defaultTone: Tone;
}

export interface StudentPreferences {
  transit_buffer_minutes: number;
  default_tone: Tone;
  sleep_start: string;
  wake_up: string;
  auto_gap_finding: boolean;
}

export interface TwizyResponse {
  reply: string;
  needs_confirmation: boolean;
  events_to_add: TwizyEvent[];
  events_to_update: TwizyEvent[];
  events_to_remove: string[];
  change_log: string[];
  draft_message: DraftMessage | null;
  ask_user: string | null;
  preferences_update: Partial<StudentPreferences> | null;
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'twizy';
  text: string;
  timestamp: string;
  image?: string;
  pendingConfirmation?: {
    eventsToAdd: TwizyEvent[];
    eventsToUpdate: TwizyEvent[];
    eventsToRemove: string[];
    changeLog: string[];
    summary: string;
  };
  draftMessage?: DraftMessage;
  askUser?: string;
  applied?: boolean;
  rejected?: boolean;
}

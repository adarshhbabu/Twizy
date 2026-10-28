import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { parseTwizyResponse } from './src/utils/assistantResponse';
import { TwizyEvent, TwizyResponse } from './src/types';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK
const configuredApiKey = process.env.GEMINI_API_KEY;
const apiKey =
  configuredApiKey && !configuredApiKey.includes('paste-your-gemini-api-key-here')
    ? configuredApiKey
    : undefined;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `You are Twizy, a blunt, efficient AI co-pilot for a college student's chaotic day. Think of a senior who has heard every excuse and doesn't do fluff.

PERSONALITY
- Short sentences. Dry humour. No lectures, no emojis spam.
- Prioritise graded work and sleep. Respect the student's time.
- Be blunt with the STUDENT only. Any message you draft for someone else (teacher, coach, friend, parent) must match the requested tone and be respectful. Never carry your bluntness into drafts.

INPUTS
- Each request includes the current date, time, timezone (Asia/Calcutta) and the current schedule. Resolve words like "tomorrow" and "Friday" against that date. Never guess a date; if it's ambiguous, ask.
- You may receive text, a voice transcript, a timetable photo, or a screenshot of a WhatsApp/email message. Extract events with: title, date, start_time, duration, type, priority, must_attend, source. If any detail is unreadable or uncertain, say so and ask. Never invent times.

BEHAVIOUR
- When you extract events from a message or image, set needs_confirmation = true and state what you understood. Only apply changes after the user confirms.
- Fixed classes and graded events never move. Deadlines get work blocks in free gaps. Resolve conflicts with a one-line reason in change_log (e.g. "Lab is graded, so I kept lab and moved club").
- If the user is tired or overloaded, suggest what to drop: lowest priority and not must_attend first.
- Mark must_attend = true only for graded classes, exams, and things the user says they can't skip.

MESSAGE DRAFTING
- When the user is late or can't make something, work out who to tell from the schedule.
- If you don't know the relationship or the tone (casual / polite / formal), set ask_user and ask before drafting.
- Use real numbers: compute arrival time from the schedule and travel buffer ("I'll be there by 4:15"). Keep drafts to 1-3 sentences. Never promise anything the schedule doesn't support.
- Never claim a message was sent. The user always taps Send.

LIMITS
- You cannot read the user's chats or send messages yourself. Say so plainly if asked.
- You are not a doctor or lawyer. Keep to scheduling and planning.

OUTPUT
- Respond ONLY with JSON matching the provided schema. Keep "reply" under 3 sentences unless the user asks for detail.`;

const EVENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    date: { type: Type.STRING, description: 'YYYY-MM-DD' },
    start_time: { type: Type.STRING, description: 'HH:MM in 24h format' },
    duration_minutes: { type: Type.INTEGER },
    type: {
      type: Type.STRING,
      enum: ['class', 'graded', 'deadline', 'club', 'personal'],
    },
    priority: { type: Type.INTEGER, description: '1 to 5' },
    must_attend: { type: Type.BOOLEAN },
    source: { type: Type.STRING },
  },
  required: ['id', 'title', 'date', 'start_time', 'duration_minutes', 'type', 'priority', 'must_attend', 'source'],
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: 'What Twizy says in chat. Blunt, concise, under 3 sentences.' },
    needs_confirmation: { type: Type.BOOLEAN, description: 'True when extracted events should be confirmed by user before applying.' },
    events_to_add: {
      type: Type.ARRAY,
      items: EVENT_SCHEMA,
    },
    events_to_update: {
      type: Type.ARRAY,
      items: EVENT_SCHEMA,
    },
    events_to_remove: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'Event ids to remove' },
    },
    change_log: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'One line per change, with the reason' },
    },
    draft_message: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        recipient_name: { type: Type.STRING },
        channel: { type: Type.STRING, enum: ['whatsapp', 'sms', 'email'] },
        tone: { type: Type.STRING, enum: ['casual', 'polite', 'formal'] },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
      },
      required: ['recipient_name', 'channel', 'tone', 'subject', 'body'],
    },
    ask_user: { type: Type.STRING, nullable: true },
    preferences_update: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        transit_buffer_minutes: { type: Type.INTEGER },
        default_tone: { type: Type.STRING },
        sleep_start: { type: Type.STRING },
        wake_up: { type: Type.STRING },
      },
    },
  },
  required: ['reply', 'needs_confirmation', 'events_to_add', 'events_to_update', 'events_to_remove', 'change_log'],
};

// Fallback logic when Gemini is offline or encounters an error
function generateFallbackResponse(prompt: string, schedule: any[], currentDate: string): TwizyResponse {
  const p = prompt.toLowerCase();
  
  if (p.includes('ds class') || p.includes('moved to 3 pm') || p.includes('assignment submission')) {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find next Friday
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diffToFriday = (5 - day + 7) % 7 || 7;
    const friday = new Date(curr);
    friday.setDate(curr.getDate() + diffToFriday);
    const fridayStr = friday.toISOString().split('T')[0];

    const dsClass = schedule.find((e) => e.title?.toLowerCase().includes('data structure') || e.title?.toLowerCase().includes('ds'));
    const updatedEvents: TwizyEvent[] = dsClass ? [{
      ...dsClass,
      date: tomorrowStr,
      start_time: '15:00',
      source: 'WhatsApp snippet',
    }] : [{
      id: 'ds-' + Date.now(),
      title: 'Data Structures Class (Moved)',
      date: tomorrowStr,
      start_time: '15:00',
      duration_minutes: 60,
      type: 'class',
      priority: 4,
      must_attend: false,
      source: 'WhatsApp snippet',
    }];

    const newAssignment: TwizyEvent = {
      id: 'assign-' + Date.now(),
      title: 'Assignment Submission Deadline',
      date: fridayStr,
      start_time: '17:00',
      duration_minutes: 30,
      type: 'deadline',
      priority: 5,
      must_attend: true,
      source: 'WhatsApp snippet',
    };

    return {
      reply: 'Got the update. DS class pushed to tomorrow 3 PM and assignment deadline shifted to Friday 5 PM. Confirm below so I update your calendar.',
      needs_confirmation: true,
      events_to_add: [newAssignment],
      events_to_update: updatedEvents,
      events_to_remove: [],
      change_log: [
        'Rescheduled DS Class to tomorrow 15:00 per WhatsApp notice.',
        'Registered Assignment Deadline for Friday 17:00.',
      ],
      draft_message: null,
      ask_user: null,
      preferences_update: null,
    };
  }

  if (p.includes('late') || p.includes('running late') || p.includes('cannot make it') || p.includes("can't make")) {
    const upcoming = schedule.find((e) => e.type === 'class' || e.type === 'graded' || e.type === 'club');
    const recipient = upcoming?.type === 'club' ? 'Coach Rahul' : 'Prof. Sharma';
    const isProf = recipient.includes('Prof');

    return {
      reply: `You're behind schedule. I've drafted a message to ${recipient}. Review tone and tap send.`,
      needs_confirmation: false,
      events_to_add: [],
      events_to_update: [],
      events_to_remove: [],
      change_log: [`Drafted quick delay notification for ${recipient}`],
      draft_message: {
        recipient_name: recipient,
        channel: isProf ? 'email' : 'whatsapp',
        tone: isProf ? 'formal' : 'casual',
        subject: isProf ? 'Unforeseen Delay - Class Attendance' : '',
        body: isProf
          ? 'Dear Prof. Sharma, I am experiencing an unavoidable transit delay and will arrive approximately 15 minutes late. My apologies for the interruption.'
          : "Hey Coach, got delayed in campus transit. Moving as fast as I can, will be at the court by 4:15.",
      },
      ask_user: null,
      preferences_update: null,
    };
  }

  if (p.includes('tired') || p.includes('exhausted') || p.includes('drop') || p.includes('overload')) {
    const skippable = schedule.filter((e) => !e.must_attend && e.priority <= 3);
    const dropItem = skippable[skippable.length - 1] || schedule[0];
    return {
      reply: `Drop the ${dropItem?.title || 'club sync'}. It's lowest priority and not graded. Protect your sleep.`,
      needs_confirmation: true,
      events_to_add: [],
      events_to_update: [],
      events_to_remove: dropItem ? [dropItem.id] : [],
      change_log: [`Recommended dropping ${dropItem?.title} to alleviate overload without hurting grades.`],
      draft_message: null,
      ask_user: null,
      preferences_update: null,
    };
  }

  return {
    reply: "I've checked your schedule. Keep moving; your graded blocks are locked in and travel buffers are active.",
    needs_confirmation: false,
    events_to_add: [],
    events_to_update: [],
    events_to_remove: [],
    change_log: ['Verified day timeline against transit constraints'],
    draft_message: null,
    ask_user: null,
    preferences_update: null,
  };
}

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { schedule, preferences, currentDate, currentTime, timezone, imageBase64, imageMimeType, history } = req.body;
    const prompt = req.body.prompt || req.body.message;

    const contextHeader = `CURRENT CONTEXT:
- Date: ${currentDate || new Date().toISOString().split('T')[0]}
- Time: ${currentTime || '12:00'}
- Timezone: ${timezone || 'Asia/Calcutta'}
- Preferences: ${JSON.stringify(preferences || {})}
- Current Full Schedule: ${JSON.stringify(schedule || [])}
`;

    if (!ai) {
      console.warn('GEMINI_API_KEY not configured, using fallback intelligent assistant');
      const fallback = generateFallbackResponse(prompt || '', schedule || [], currentDate || '2026-10-28');
      return res.json({
        ...fallback,
        error: 'GEMINI_API_KEY is missing. Add it to .env.local and restart the server for live Gemini responses.',
      });
    }

    const contents: any[] = [];

    // System context in prompt
    const fullUserText = `${contextHeader}\n\nStudent message: ${prompt || (imageBase64 ? 'Please extract schedule events and changes from this image.' : '')}`;

    if (imageBase64) {
      const cleanData = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      contents.push({
        parts: [
          {
            inlineData: {
              data: cleanData,
              mimeType: imageMimeType || 'image/png',
            },
          },
          { text: fullUserText },
        ],
      });
    } else {
      contents.push(fullUserText);
    }

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const request = {
      model: primaryModel,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    };
    let response;
    try {
      response = await ai.models.generateContent(request);
    } catch (modelErr: any) {
      if (primaryModel !== 'gemini-3.5-flash-lite') {
        console.warn('Primary model failed, attempting fallback to gemini-3.5-flash-lite...', modelErr.message);
        response = await ai.models.generateContent({
          ...request,
          model: 'gemini-3.5-flash-lite',
        });
      } else {
        throw modelErr;
      }
    }

    try {
      return res.json(parseTwizyResponse(response.text || ''));
    } catch {
      response = await ai.models.generateContent({
        ...request,
        contents: [...contents, { text: 'Return valid JSON only. Do not use markdown fences.' }],
      });
      return res.json(parseTwizyResponse(response.text || ''));
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const fallback = generateFallbackResponse(req.body.prompt || '', req.body.schedule || [], req.body.currentDate || '2026-10-28');
    return res.json({
      ...fallback,
      error: process.env.GEMINI_API_KEY
        ? 'Gemini is unavailable right now. Showing a local demo response.'
        : 'GEMINI_API_KEY is missing. Add it to .env.local and restart the server for live Gemini responses.',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Twizy server listening on http://0.0.0.0:${port}`);
  });
}

startServer();

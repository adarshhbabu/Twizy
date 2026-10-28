# Twizy

> **Your calendar remembers. Your buddy reacts.**

[![Build](https://img.shields.io/badge/build-passing-16a34a)](#verification)
[![Tests](https://img.shields.io/badge/tests-6%20passing-16a34a)](#verification)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

Twizy is a chat-first AI co-pilot for a student's chaotic day. Plans change constantly: a teacher's message lands in a WhatsApp group, a class gets cancelled, an assignment moves up. Nobody scrolls back through old chats, so things get missed. Twizy ingests that chaos, replans your day, and tells you what moved and why.

## The problem

Student schedules live across timetables, WhatsApp groups, emails and memory. When something changes, it's easy to miss it, and calendars don't help because they only store what you manually enter.

## Features

- **Living schedule:** Fixed classes stay fixed. Deadlines get work blocks in free gaps. Conflicts are resolved with an explicit reason ("Lab is graded, so I kept lab and moved club").
- **Ingest anything:** Paste a message, speak, or upload a timetable photo or WhatsApp/email screenshot. Gemini extracts the event and asks you to confirm before changing anything.
- **Smart interruption:** A simulated full-screen incoming call with a spoken heads-up fires only for must-attend events starting within 20 minutes.
- **Message drafting:** Say "I'm going to be late" and Twizy works out who to tell, asks for the tone (casual / polite / formal), writes a message with real times, and opens WhatsApp, SMS or email pre-filled. You tap Send.
- **Personality:** A blunt, efficient senior who prioritises graded work and sleep. Blunt with you, always respectful in messages to others.

## Safety and privacy

- No secret reading of your chats. You forward, paste or share.
- No silent auto-sending. Every message needs your one-tap approval.
- The call is simulated inside the app, not a real phone call.
- Session memory only (preferences are not persisted yet).

## Stack

- **Google AI Studio / Gemini API:** multimodal input (text, images), structured JSON output, schedule reasoning and message drafting
- **Web Speech API:** voice input
- **Browser text-to-speech:** Twizy's spoken heads-ups
- **Deep links:** `wa.me`, `sms:`, `mailto:` for one-tap sending

## How it works

1. Every user turn is sent to Gemini with the current date, time, timezone, schedule and preferences.
2. Gemini replies in a fixed JSON schema (events to add/update/remove, change log, draft message, follow-up question).
3. The app applies the changes, updates the timeline, and renders drafts or calls.

## Quick start

```powershell
git clone https://github.com/adarshhbabu/Twizy.git
cd Twizy
npm install
Copy-Item .env.example .env.local
```

Open `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY="your-real-gemini-api-key"
```

Start the app:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The server uses the current `gemini-3.8-flash` model, structured JSON output, and a single retry when Gemini returns malformed JSON. Never commit `.env.local`; it is ignored by git. If the key is missing or Gemini is unavailable, Twizy shows an explicit warning and keeps the local demo fallback usable.

## Verification

```powershell
npm test       # deterministic unit tests
npm run lint   # TypeScript validation
npm run build  # production build
```

The test suite covers date/time helpers, the 20-minute call trigger and once-per-event guard, protected schedule merges, malformed JSON handling, and WhatsApp/SMS/email link encoding.

## Roadmap

- Persistent memory (preferred work times, recurring conflicts)
- Gmail integration for automatic email ingestion
- Real phone-call alerts
- Calendar sync (Google Calendar import/export)

## Demo flow

1. Start with a messy sample day.
2. Load the sample WhatsApp message: "DS class tomorrow moved to 3 PM, assignment submission now Friday 5 PM."
3. Confirm, and watch the day rearrange with reasons.
4. Hit **Simulate call** to see the interruption.
5. Say "I'm going to be late" and send the drafted message in one tap.

## License

MIT

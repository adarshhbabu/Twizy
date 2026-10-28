# Twizy

> **Your calendar remembers. Your buddy reacts.**

Twizy is a chat-first AI co-pilot for a student's chaotic day. Plans change constantly: a teacher's message lands in a WhatsApp group, a class gets cancelled, an assignment moves up. Nobody scrolls back through old chats, so things get missed. Twizy ingests that chaos, replans your day, and tells you what moved and why.

## The problem

Student schedules live across timetables, WhatsApp groups, emails and memory. When something changes, it's easy to miss it, and calendars don't help because they only store what you manually enter.

## What Twizy does

- **Living schedule:** Fixed classes stay fixed. Deadlines get work blocks in free gaps. Conflicts are resolved with an explicit reason ("Lab is graded, so I kept lab and moved club").
- **Ingest anything:** Paste a message, speak, or upload a timetable photo or WhatsApp/email screenshot. Gemini extracts the event and asks you to confirm before changing anything.
- **Smart interruption:** A simulated full-screen incoming call with a spoken heads-up fires only for must-attend events starting within 20 minutes.
- **Message drafting:** Say "I'm going to be late" and Twizy works out who to tell, asks for the tone (casual / polite / formal), writes a message with real times, and opens WhatsApp, SMS or email pre-filled. You tap Send.
- **Personality:** A blunt, efficient senior who prioritises graded work and sleep. Blunt with you, always respectful in messages to others.

## Honest limits

- No secret reading of your chats. You forward, paste or share.
- No silent auto-sending. Every message needs your one-tap approval.
- The call is simulated inside the app, not a real phone call.
- Session memory only (preferences are not persisted yet).

## Tech stack

- **Google AI Studio / Gemini API:** multimodal input (text, images), structured JSON output, schedule reasoning and message drafting
- **Web Speech API:** voice input
- **Browser text-to-speech:** Twizy's spoken heads-ups
- **Deep links:** `wa.me`, `sms:`, `mailto:` for one-tap sending

## How it works

1. Every user turn is sent to Gemini with the current date, time, timezone, schedule and preferences.
2. Gemini replies in a fixed JSON schema (events to add/update/remove, change log, draft message, follow-up question).
3. The app applies the changes, updates the timeline, and renders drafts or calls.

## Running locally

1. Clone the repo
2. Add your Gemini API key to the environment config (`GEMINI_API_KEY`)
3. Install dependencies and start the dev server (`npm install && npm run dev`)

## Roadmap

- Persistent memory (preferred work times, recurring conflicts)
- Gmail integration for automatic email ingestion
- Real phone-call alerts
- Calendar sync (Google Calendar import/export)

## Demo

1. Start with a messy sample day.
2. Load the sample WhatsApp message: "DS class tomorrow moved to 3 PM, assignment submission now Friday 5 PM."
3. Confirm, and watch the day rearrange with reasons.
4. Hit **Simulate call** to see the interruption.
5. Say "I'm going to be late" and send the drafted message in one tap.

## Team

Built for [Hackathon Name] by [Your Name / Team].

## License

MIT

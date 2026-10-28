import { TwizyEvent } from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(mins: number): string {
  const normalized = Math.max(0, mins % 1440);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingEvents: [TwizyEvent, TwizyEvent][];
  suggestedAction?: string;
}

export function detectConflicts(events: TwizyEvent[], bufferMinutes = 10): ConflictResult {
  const result: ConflictResult = {
    hasConflict: false,
    conflictingEvents: [],
  };

  // Group by date
  const byDate: Record<string, TwizyEvent[]> = {};
  events.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  for (const date in byDate) {
    const dayEvents = [...byDate[date]].sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    for (let i = 0; i < dayEvents.length - 1; i++) {
      const e1 = dayEvents[i];
      const e2 = dayEvents[i + 1];

      const e1Start = timeToMinutes(e1.start_time);
      const e1End = e1Start + e1.duration_minutes;
      const e2Start = timeToMinutes(e2.start_time);

      // Conflict if overlapping or if transit buffer (10 mins) is violated
      if (e1End + bufferMinutes > e2Start) {
        result.hasConflict = true;
        result.conflictingEvents.push([e1, e2]);
      }
    }
  }

  return result;
}

/**
 * Finds a free gap in the schedule on the given date before a specified target time
 */
export function findFreeGap(
  events: TwizyEvent[],
  date: string,
  beforeTime: string,
  neededDuration = 60,
  bufferMinutes = 10
): { start_time: string; duration_minutes: number } | null {
  const dayEvents = events
    .filter((e) => e.date === date)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  const targetMins = timeToMinutes(beforeTime);
  const dayStart = 9 * 60; // 09:00 AM standard start

  // Try after the last event before target
  if (dayEvents.length === 0) {
    const candidate = Math.max(dayStart, targetMins - neededDuration - bufferMinutes);
    return {
      start_time: minutesToTime(candidate),
      duration_minutes: neededDuration,
    };
  }

  // Look for gaps between consecutive events
  let prevEnd = dayStart;
  for (const ev of dayEvents) {
    const evStart = timeToMinutes(ev.start_time);
    if (evStart >= targetMins) break;

    const availableGap = evStart - prevEnd - bufferMinutes;
    if (availableGap >= neededDuration) {
      return {
        start_time: minutesToTime(prevEnd + bufferMinutes),
        duration_minutes: neededDuration,
      };
    }
    prevEnd = Math.max(prevEnd, evStart + ev.duration_minutes);
  }

  // Or before the target if space permits
  if (targetMins - prevEnd - bufferMinutes >= neededDuration) {
    return {
      start_time: minutesToTime(prevEnd + bufferMinutes),
      duration_minutes: neededDuration,
    };
  }

  return null;
}

export function getEventTypeBadge(type: TwizyEvent['type']) {
  switch (type) {
    case 'graded':
      return {
        label: 'Graded Exam/Lab',
        bg: 'bg-amber-500/15 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/40',
        accentBar: 'bg-amber-500',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      };
    case 'deadline':
      return {
        label: 'Hard Deadline',
        bg: 'bg-rose-500/15 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/40',
        accentBar: 'bg-rose-500',
        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      };
    case 'class':
      return {
        label: 'Fixed Class',
        bg: 'bg-blue-500/15 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-500/30',
        accentBar: 'bg-blue-500',
        dot: 'bg-blue-500',
      };
    case 'club':
      return {
        label: 'Club / Sport',
        bg: 'bg-purple-500/15 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-500/30',
        accentBar: 'bg-purple-500',
        dot: 'bg-purple-500',
      };
    case 'personal':
    default:
      return {
        label: 'Personal / Study',
        bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        accentBar: 'bg-emerald-500',
        dot: 'bg-emerald-500',
      };
  }
}

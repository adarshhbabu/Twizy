import { TwizyEvent } from '../types';

export function exportToICS(events: TwizyEvent[], calendarName = 'Twizy Student Schedule'): void {
  const pad = (n: number) => String(n).padStart(2, '0');

  const formatICSDate = (dateStr: string, timeStr: string, durationMinutes: number) => {
    // dateStr: YYYY-MM-DD, timeStr: HH:MM
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const toICSString = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    return {
      start: toICSString(startDate),
      end: toICSString(endDate),
    };
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Twizy AI//Student Schedule Co-pilot//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((evt) => {
    const { start, end } = formatICSDate(evt.date, evt.start_time, evt.duration_minutes);
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${evt.id}@twizy.student`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${evt.title}`,
      `DESCRIPTION:Twizy Co-pilot Event | Type: ${evt.type} | Priority: ${evt.priority}/5 | Must Attend: ${evt.must_attend ? 'YES' : 'NO'} | Source: ${evt.source}`,
      `CATEGORIES:${evt.type.toUpperCase()}`,
      evt.location ? `LOCATION:${evt.location}` : 'LOCATION:Campus',
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `twizy_schedule_${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseICSContent(icsText: string): Partial<TwizyEvent>[] {
  const events: Partial<TwizyEvent>[] = [];
  const lines = icsText.split(/\r\n|\n|\r/);
  let inEvent = false;
  let currentEvent: Partial<TwizyEvent> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        id: 'ics-' + Math.random().toString(36).substring(2, 9),
        type: 'class',
        priority: 3,
        must_attend: false,
        source: 'Imported Calendar',
      };
    } else if (line === 'END:VEVENT') {
      if (inEvent && currentEvent.title && currentEvent.date) {
        events.push(currentEvent);
      }
      inEvent = false;
      currentEvent = {};
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9);
      } else if (line.startsWith('DTSTART:')) {
        const val = line.substring(8);
        // format YYYYMMDDTHHMMSS or YYYYMMDD
        if (val.length >= 8) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          currentEvent.date = `${y}-${m}-${d}`;
          if (val.includes('T')) {
            const timePart = val.split('T')[1];
            currentEvent.start_time = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
          } else {
            currentEvent.start_time = '09:00';
          }
        }
      }
    }
  }

  return events;
}

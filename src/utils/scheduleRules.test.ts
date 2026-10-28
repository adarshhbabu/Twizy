import { describe, expect, it } from 'vitest';
import { applyScheduleChanges, getUpcomingMustAttendEvent, minutesToTime, timeToMinutes } from './scheduleRules';
import { TwizyEvent } from '../types';

const event = (overrides: Partial<TwizyEvent> = {}): TwizyEvent => ({
  id: 'class-1',
  title: 'Class',
  date: '2026-10-29',
  start_time: '10:00',
  duration_minutes: 60,
  type: 'class',
  priority: 3,
  must_attend: true,
  source: 'Timetable',
  ...overrides,
});

describe('schedule rules', () => {
  it('converts valid 24-hour times and normalizes midnight wrapping', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(1500)).toBe('01:00');
    expect(minutesToTime(-1)).toBe('23:59');
  });

  it('triggers an upcoming must-attend event once per event', () => {
    const candidate = event({ start_time: '10:20' });
    expect(getUpcomingMustAttendEvent([candidate], '2026-10-29', 600, new Set())).toEqual(candidate);
    expect(getUpcomingMustAttendEvent([candidate], '2026-10-29', 600, new Set(['class-1']))).toBeNull();
    expect(getUpcomingMustAttendEvent([candidate], '2026-10-28', 600, new Set())).toBeNull();
  });

  it('merges adds and updates but protects graded events', () => {
    const graded = event({ id: 'graded-1', type: 'graded', title: 'Viva' });
    const updatedClass = event({ start_time: '15:00', source: 'WhatsApp snippet' });
    const result = applyScheduleChanges(
      [event(), graded],
      [event({ id: 'new-1', title: 'Study block' })],
      [updatedClass, { ...graded, start_time: '18:00' }],
      ['graded-1']
    );
    expect(result).toHaveLength(3);
    expect(result.find((item) => item.id === 'class-1')?.start_time).toBe('15:00');
    expect(result.find((item) => item.id === 'graded-1')?.start_time).toBe('10:00');
  });
});

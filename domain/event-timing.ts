import { z } from 'zod';
import { isCalendarDate } from './availability.ts';
import { taskTime } from './barn.ts';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const eventTimingSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('all-day'), date: z.string().refine(isCalendarDate) }),
  z.object({ mode: z.literal('timed'), date: z.string().refine(isCalendarDate), start: time, end: time }),
]);

export function eventWindow(input: unknown, zone: string) {
  const timing = eventTimingSchema.parse(input);
  const nextDay = new Date(timing.date + 'T12:00:00Z');
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const start = taskTime(timing.date, timing.mode === 'timed' ? timing.start : '00:00', zone);
  const end = timing.mode === 'timed'
    ? taskTime(timing.date, timing.end, zone)
    : taskTime(nextDay.toISOString().slice(0, 10), '00:00', zone);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw Error('Choose a valid event window with an end after its start.');
  }
  return { start, end, mode: timing.mode };
}

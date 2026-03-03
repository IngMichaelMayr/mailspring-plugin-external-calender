import { CalendarEvent } from '../google-calendar-api';

/**
 * Check if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Format time as HH:MM (24h).
 */
export function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Format time as h:mm AM/PM.
 */
export function formatTime12(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Get an array of day names starting from Monday.
 */
export function getWeekdayNames(short = true): string[] {
  if (short) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

/**
 * Get the month grid for a given date.
 * Returns a 2D array of Date objects (6 weeks × 7 days).
 * Week starts on Monday.
 */
export function getMonthGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=Sun..6=Sat → convert to Mon=0..Sun=6
  let startDay = firstOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const start = new Date(year, month, 1 - startDay);
  const weeks: Date[][] = [];

  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      week.push(date);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * Get the 7 dates for the week containing the given date.
 * Week starts on Monday.
 */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  let dayOfWeek = d.getDay() - 1;
  if (dayOfWeek < 0) dayOfWeek = 6;

  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(day);
  }
  return dates;
}

/**
 * Get the start Date of an event.
 */
export function getEventStart(event: CalendarEvent): Date {
  if (event.start.dateTime) return new Date(event.start.dateTime);
  if (event.start.date) return new Date(event.start.date + 'T00:00:00');
  return new Date();
}

/**
 * Get the end Date of an event.
 */
export function getEventEnd(event: CalendarEvent): Date {
  if (event.end.dateTime) return new Date(event.end.dateTime);
  if (event.end.date) {
    // All-day event end dates are exclusive
    const d = new Date(event.end.date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59);
    return d;
  }
  return new Date();
}

/**
 * Check if an event spans a given date.
 */
export function eventSpansDate(event: CalendarEvent, date: Date): boolean {
  const start = getEventStart(event);
  const end = getEventEnd(event);

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

  return start <= dayEnd && end >= dayStart;
}

/**
 * Filter events for a given date.
 */
export function eventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => eventSpansDate(e, date));
}

/**
 * Get the fractional hour position for a date (e.g. 9:30 → 9.5).
 */
export function getHourPosition(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/**
 * Format a month name for display.
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * Format a date for display (e.g., "Mon, Jan 5").
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to a date.
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Create an ISO datetime string for a given date and time.
 */
export function toISODateTime(date: Date, hours: number, minutes: number): string {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/**
 * Create an ISO date string (YYYY-MM-DD) for all-day events.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

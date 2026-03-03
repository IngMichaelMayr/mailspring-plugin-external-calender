import { startAuthFlow, clearTokens, restoreCredentials } from '../google-auth';
import * as CalendarAPI from '../google-calendar-api';
import * as CalendarCache from '../cache/calendar-cache';

export type ViewMode = 'month' | 'week' | 'day';

// Simple event emitter for actions
type Listener = (...args: any[]) => void;
const listeners: Record<string, Listener[]> = {};

export function on(event: string, fn: Listener): void {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(fn);
}

export function off(event: string, fn: Listener): void {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter((f) => f !== fn);
}

function emit(event: string, ...args: any[]): void {
  if (!listeners[event]) return;
  for (const fn of listeners[event]) {
    fn(...args);
  }
}

// --- Auth actions ---

export async function authenticate(): Promise<void> {
  emit('auth:start');
  try {
    console.log('[GoogleCalendar] Starting auth flow...');
    await startAuthFlow();
    console.log('[GoogleCalendar] Auth successful');
    emit('auth:success');
    await syncAll();
  } catch (err) {
    console.error('[GoogleCalendar] Auth failed:', err);
    emit('auth:error', err);
    throw err;
  }
}

export async function signOut(): Promise<void> {
  await clearTokens();
  CalendarCache.clearCache();
  emit('auth:signedout');
}

export async function tryRestoreAuth(): Promise<boolean> {
  try {
    const restored = await restoreCredentials();
    console.log('[GoogleCalendar] Restore auth:', restored);
    if (restored) {
      emit('auth:success');
    }
    return restored;
  } catch (err) {
    console.error('[GoogleCalendar] Restore auth failed:', err);
    return false;
  }
}

// --- Sync actions ---

function isInvalidGrant(err: any): boolean {
  const msg = (err?.message || err?.response?.data?.error || '').toLowerCase();
  return msg.includes('invalid_grant') || err?.response?.data?.error === 'invalid_grant';
}

export async function syncAll(): Promise<void> {
  emit('sync:start');
  try {
    console.log('[GoogleCalendar] Starting sync...');
    await syncCalendars();
    const calendars = CalendarCache.getCalendars().filter((c) => c.selected);
    console.log(`[GoogleCalendar] Syncing events for ${calendars.length} calendars:`, calendars.map(c => c.summary));
    // Sequential to avoid read-modify-write race conditions on the cache file
    for (const calendar of calendars) {
      try {
        await syncEventsForCalendar(calendar.id);
      } catch (err) {
        if (isInvalidGrant(err)) throw err; // bubble up to trigger re-auth
        console.error(`[GoogleCalendar] Failed to sync calendar ${calendar.id}:`, err);
      }
    }
    console.log('[GoogleCalendar] Sync complete');
    emit('sync:complete');
  } catch (err) {
    console.error('[GoogleCalendar] Sync failed:', err);
    if (isInvalidGrant(err)) {
      console.warn('[GoogleCalendar] Refresh token invalid – clearing credentials');
      await clearTokens();
      CalendarCache.clearCache();
      emit('auth:signedout');
      emit('sync:error', new Error('Verbindung zu Google abgelaufen. Bitte in den Einstellungen neu verbinden.'));
    } else {
      emit('sync:error', err);
    }
  }
}

export async function syncCalendars(): Promise<void> {
  const calendars = await CalendarAPI.listCalendars();
  CalendarCache.setCalendars(calendars);
  emit('calendars:updated', calendars);
}

export async function syncEventsForCalendar(calendarId: string): Promise<void> {
  const syncToken = CalendarCache.getSyncToken(calendarId);

  // For initial sync, fetch 3 months back and 6 months forward
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString();

  const result = await CalendarAPI.syncEvents(calendarId, syncToken, timeMin, timeMax);
  CalendarCache.mergeEvents(calendarId, result.events, result.deleted);

  if (result.nextSyncToken) {
    CalendarCache.setSyncToken(calendarId, result.nextSyncToken);
  }

  emit('events:updated');
}

// --- Event CRUD actions ---

export async function createEvent(
  calendarId: string,
  eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
    reminders?: { useDefault: boolean; overrides?: CalendarAPI.ReminderOverride[] };
  }
): Promise<CalendarAPI.CalendarEvent> {
  emit('event:creating');
  const event = await CalendarAPI.createEvent(calendarId, eventData);

  // Optimistic: add to cache immediately
  CalendarCache.mergeEvents(calendarId, [event], []);
  emit('events:updated');
  emit('event:created', event);
  return event;
}

export async function updateEvent(
  calendarId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime?: string; date?: string; timeZone?: string };
    end?: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
    reminders?: { useDefault: boolean; overrides?: CalendarAPI.ReminderOverride[] };
  }
): Promise<CalendarAPI.CalendarEvent> {
  emit('event:updating');
  const event = await CalendarAPI.updateEvent(calendarId, eventId, updates);
  CalendarCache.mergeEvents(calendarId, [event], []);
  emit('events:updated');
  emit('event:updated', event);
  return event;
}

export async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
  emit('event:deleting');

  // Optimistic: remove from cache before API call
  CalendarCache.mergeEvents(calendarId, [], [eventId]);
  emit('events:updated');

  try {
    await CalendarAPI.deleteEvent(calendarId, eventId);
    emit('event:deleted', eventId);
  } catch (err) {
    // Rollback: re-sync if delete failed
    await syncEventsForCalendar(calendarId);
    throw err;
  }
}

// --- UI actions ---

export function selectDate(date: Date): void {
  emit('ui:selectDate', date);
}

export function setViewMode(mode: ViewMode): void {
  emit('ui:setViewMode', mode);
}

export function setDayZoom(height: number): void {
  emit('ui:setDayZoom', height);
}

export function toggleCalendarVisibility(calendarId: string): void {
  emit('ui:toggleCalendar', calendarId);
}

export function showEventForm(eventData?: Partial<CalendarAPI.CalendarEvent>): void {
  emit('ui:showEventForm', eventData);
}

export function hideEventForm(): void {
  emit('ui:hideEventForm');
}

export function showEventDetail(event: CalendarAPI.CalendarEvent): void {
  emit('ui:showEventDetail', event);
}

export function hideEventDetail(): void {
  emit('ui:hideEventDetail');
}

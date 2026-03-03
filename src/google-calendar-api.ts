import { google, calendar_v3 } from 'googleapis';
import { getOAuth2Client } from './google-auth';

export interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  backgroundColor: string;
  foregroundColor: string;
  primary?: boolean;
  selected?: boolean;
  accessRole: string;
  defaultReminders?: ReminderOverride[];
}

export interface ReminderOverride {
  method: 'popup' | 'email';
  minutes: number;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status: string;
  htmlLink?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  creator?: { email: string; displayName?: string };
  organizer?: { email: string; displayName?: string };
  recurrence?: string[];
  colorId?: string;
  isAllDay: boolean;
  reminders?: {
    useDefault: boolean;
    overrides?: ReminderOverride[];
  };
}

export interface SyncResult {
  events: CalendarEvent[];
  nextSyncToken?: string;
  deleted: string[];
}

function getCalendarClient(): calendar_v3.Calendar {
  const auth = getOAuth2Client();
  return google.calendar({ version: 'v3', auth });
}

function toCalendarEvent(item: calendar_v3.Schema$Event, calendarId: string): CalendarEvent {
  const isAllDay = !item.start?.dateTime && !!item.start?.date;
  return {
    id: item.id || '',
    calendarId,
    summary: item.summary || '(No title)',
    description: item.description || undefined,
    location: item.location || undefined,
    start: {
      dateTime: item.start?.dateTime || undefined,
      date: item.start?.date || undefined,
      timeZone: item.start?.timeZone || undefined,
    },
    end: {
      dateTime: item.end?.dateTime || undefined,
      date: item.end?.date || undefined,
      timeZone: item.end?.timeZone || undefined,
    },
    status: item.status || 'confirmed',
    htmlLink: item.htmlLink || undefined,
    attendees: item.attendees?.map((a) => ({
      email: a.email || '',
      displayName: a.displayName || undefined,
      responseStatus: a.responseStatus || undefined,
    })),
    creator: item.creator
      ? { email: item.creator.email || '', displayName: item.creator.displayName || undefined }
      : undefined,
    organizer: item.organizer
      ? { email: item.organizer.email || '', displayName: item.organizer.displayName || undefined }
      : undefined,
    recurrence: item.recurrence || undefined,
    colorId: item.colorId || undefined,
    isAllDay,
    reminders: item.reminders ? {
      useDefault: item.reminders.useDefault ?? true,
      overrides: item.reminders.overrides?.map((o) => ({
        method: (o.method as 'popup' | 'email') || 'popup',
        minutes: o.minutes || 0,
      })),
    } : undefined,
  };
}

/**
 * List all calendars for the authenticated user.
 */
export async function listCalendars(): Promise<CalendarInfo[]> {
  const cal = getCalendarClient();
  const res = await cal.calendarList.list();
  const items = res.data.items || [];

  return items.map((item) => ({
    id: item.id || '',
    summary: item.summary || '',
    description: item.description || undefined,
    backgroundColor: item.backgroundColor || '#4285f4',
    foregroundColor: item.foregroundColor || '#ffffff',
    primary: item.primary || false,
    selected: item.selected !== false,
    accessRole: item.accessRole || 'reader',
    defaultReminders: item.defaultReminders?.map((r) => ({
      method: (r.method as 'popup' | 'email') || 'popup',
      minutes: r.minutes || 0,
    })),
  }));
}

/**
 * Sync events for a calendar using sync tokens for incremental updates.
 * On first sync (no syncToken), fetches events for the given time range.
 */
export async function syncEvents(
  calendarId: string,
  syncToken?: string,
  timeMin?: string,
  timeMax?: string
): Promise<SyncResult> {
  const cal = getCalendarClient();
  const allEvents: CalendarEvent[] = [];
  const deleted: string[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  do {
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      singleEvents: true,
      maxResults: 250,
    };

    if (syncToken) {
      // orderBy is incompatible with syncToken (Google returns 400)
      params.syncToken = syncToken;
    } else {
      params.orderBy = 'startTime';
      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;
    }

    if (pageToken) {
      params.pageToken = pageToken;
    }

    try {
      const res = await cal.events.list(params);
      const items = res.data.items || [];

      for (const item of items) {
        if (item.status === 'cancelled') {
          if (item.id) deleted.push(item.id);
        } else {
          allEvents.push(toCalendarEvent(item, calendarId));
        }
      }

      pageToken = res.data.nextPageToken || undefined;
      nextSyncToken = res.data.nextSyncToken || undefined;
    } catch (err: any) {
      // If sync token is invalid (410 Gone), do a full sync
      if (err.code === 410 && syncToken) {
        return syncEvents(calendarId, undefined, timeMin, timeMax);
      }
      throw err;
    }
  } while (pageToken);

  return { events: allEvents, nextSyncToken, deleted };
}

/**
 * Create a new event.
 */
export async function createEvent(
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
    reminders?: { useDefault: boolean; overrides?: ReminderOverride[] };
  }
): Promise<CalendarEvent> {
  const cal = getCalendarClient();
  const res = await cal.events.insert({
    calendarId,
    requestBody: event,
  });
  return toCalendarEvent(res.data, calendarId);
}

/**
 * Update an existing event.
 */
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
    reminders?: { useDefault: boolean; overrides?: ReminderOverride[] };
  }
): Promise<CalendarEvent> {
  const cal = getCalendarClient();
  const res = await cal.events.patch({
    calendarId,
    eventId,
    requestBody: updates,
  });
  return toCalendarEvent(res.data, calendarId);
}

/**
 * Delete an event.
 */
export async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
  const cal = getCalendarClient();
  await cal.events.delete({ calendarId, eventId });
}

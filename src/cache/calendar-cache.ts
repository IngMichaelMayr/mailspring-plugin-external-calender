import * as fs from 'fs';
import * as path from 'path';
import { CalendarInfo, CalendarEvent } from '../google-calendar-api';

// AppEnv is a global provided by Mailspring's renderer process, not an export
declare const AppEnv: { getConfigDirPath(): string };

interface CacheData {
  calendars: CalendarInfo[];
  events: Record<string, CalendarEvent[]>; // calendarId -> events
  syncTokens: Record<string, string>; // calendarId -> syncToken
  lastSync: number;
}

const CACHE_FILENAME = 'google-calendar-cache.json';

function getCachePath(): string {
  return path.join(AppEnv.getConfigDirPath(), CACHE_FILENAME);
}

function readCache(): CacheData {
  try {
    const raw = fs.readFileSync(getCachePath(), 'utf-8');
    return JSON.parse(raw) as CacheData;
  } catch {
    return {
      calendars: [],
      events: {},
      syncTokens: {},
      lastSync: 0,
    };
  }
}

function writeCache(data: CacheData): void {
  try {
    fs.writeFileSync(getCachePath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GoogleCalendar] Failed to write cache:', err);
  }
}

export function getCalendars(): CalendarInfo[] {
  return readCache().calendars;
}

export function setCalendars(calendars: CalendarInfo[]): void {
  const cache = readCache();
  cache.calendars = calendars;
  writeCache(cache);
}

export function getEventsForCalendar(calendarId: string): CalendarEvent[] {
  return readCache().events[calendarId] || [];
}

export function getAllEvents(): CalendarEvent[] {
  const cache = readCache();
  const all: CalendarEvent[] = [];
  for (const calId of Object.keys(cache.events)) {
    all.push(...cache.events[calId]);
  }
  return all;
}

/**
 * Merge synced events into the cache for a calendar.
 * Handles additions, updates, and deletions.
 */
export function mergeEvents(
  calendarId: string,
  newEvents: CalendarEvent[],
  deletedIds: string[]
): void {
  const cache = readCache();
  let existing = cache.events[calendarId] || [];

  // Remove deleted events
  if (deletedIds.length > 0) {
    const deletedSet = new Set(deletedIds);
    existing = existing.filter((e) => !deletedSet.has(e.id));
  }

  // Update or add events
  const existingMap = new Map(existing.map((e) => [e.id, e]));
  for (const evt of newEvents) {
    existingMap.set(evt.id, evt);
  }

  cache.events[calendarId] = Array.from(existingMap.values());
  cache.lastSync = Date.now();
  writeCache(cache);
}

export function getSyncToken(calendarId: string): string | undefined {
  return readCache().syncTokens[calendarId];
}

export function setSyncToken(calendarId: string, token: string): void {
  const cache = readCache();
  cache.syncTokens[calendarId] = token;
  writeCache(cache);
}

export function getLastSyncTime(): number {
  return readCache().lastSync;
}

export function clearCache(): void {
  try {
    fs.unlinkSync(getCachePath());
  } catch {
    // ignore
  }
}

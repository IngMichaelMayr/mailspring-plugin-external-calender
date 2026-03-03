import MailspringStore from 'mailspring-store';
import * as CalendarActions from './calendar-actions';
import * as CalendarCache from '../cache/calendar-cache';
import { loadPreferences, savePreferences } from '../cache/preferences';
import { CalendarInfo, CalendarEvent } from '../google-calendar-api';

export type ViewMode = 'month' | 'week' | 'day';

class CalendarStore extends MailspringStore {
  // Auth state
  private _authenticated = false;
  private _authError: string | null = null;
  private _syncing = false;
  private _syncError: string | null = null;
  private _lastSyncTime: number = 0;

  // Data
  private _calendars: CalendarInfo[] = [];
  private _events: CalendarEvent[] = [];
  private _hiddenCalendarIds: Set<string> = new Set();

  // UI state
  private _selectedDate: Date = new Date();
  private _viewMode: ViewMode = 'month';
  private _dayZoomHeight = 60;
  private _eventFormVisible = false;
  private _eventFormData: Partial<CalendarEvent> | null = null;
  private _eventDetailVisible = false;
  private _eventDetailData: CalendarEvent | null = null;

  // Sync
  private _syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this._loadPreferences();
    this._bindActions();
  }

  private _loadPreferences() {
    const prefs = loadPreferences();
    this._viewMode = prefs.viewMode;
    this._dayZoomHeight = prefs.dayZoomHeight;
    this._hiddenCalendarIds = new Set(prefs.hiddenCalendarIds);
  }

  private _savePreferences() {
    savePreferences({
      viewMode: this._viewMode,
      dayZoomHeight: this._dayZoomHeight,
      hiddenCalendarIds: Array.from(this._hiddenCalendarIds),
    });
  }

  private _bindActions() {
    CalendarActions.on('auth:success', () => {
      this._authenticated = true;
      this._authError = null;
      this._startSync();
      this.trigger();
    });

    CalendarActions.on('auth:error', (err: Error) => {
      this._authError = err.message;
      this.trigger();
    });

    CalendarActions.on('auth:signedout', () => {
      this._authenticated = false;
      this._calendars = [];
      this._events = [];
      this._stopSync();
      this.trigger();
    });

    CalendarActions.on('sync:start', () => {
      this._syncing = true;
      this._syncError = null;
      this.trigger();
    });

    CalendarActions.on('sync:complete', () => {
      this._syncing = false;
      this._syncError = null;
      this._lastSyncTime = Date.now();
      this._loadFromCache();
      this.trigger();
    });

    CalendarActions.on('sync:error', (err: Error) => {
      this._syncing = false;
      this._syncError = (err as any)?.message || String(err);
      this.trigger();
    });

    CalendarActions.on('calendars:updated', () => {
      this._loadFromCache();
      this.trigger();
    });

    CalendarActions.on('events:updated', () => {
      this._loadFromCache();
      this.trigger();
    });

    CalendarActions.on('ui:selectDate', (date: Date) => {
      this._selectedDate = date;
      this.trigger();
    });

    CalendarActions.on('ui:setViewMode', (mode: ViewMode) => {
      this._viewMode = mode;
      this._savePreferences();
      this.trigger();
    });

    CalendarActions.on('ui:setDayZoom', (height: number) => {
      this._dayZoomHeight = height;
      this._savePreferences();
      this.trigger();
    });

    CalendarActions.on('ui:toggleCalendar', (calendarId: string) => {
      if (this._hiddenCalendarIds.has(calendarId)) {
        this._hiddenCalendarIds.delete(calendarId);
      } else {
        this._hiddenCalendarIds.add(calendarId);
      }
      this._savePreferences();
      this.trigger();
    });

    CalendarActions.on('ui:showEventForm', (data?: Partial<CalendarEvent>) => {
      this._eventFormVisible = true;
      this._eventFormData = data || null;
      this.trigger();
    });

    CalendarActions.on('ui:hideEventForm', () => {
      this._eventFormVisible = false;
      this._eventFormData = null;
      this.trigger();
    });

    CalendarActions.on('ui:showEventDetail', (event: CalendarEvent) => {
      this._eventDetailVisible = true;
      this._eventDetailData = event;
      this.trigger();
    });

    CalendarActions.on('ui:hideEventDetail', () => {
      this._eventDetailVisible = false;
      this._eventDetailData = null;
      this.trigger();
    });
  }

  private _loadFromCache() {
    this._calendars = CalendarCache.getCalendars();
    this._events = CalendarCache.getAllEvents();
  }

  private _startSync() {
    if (this._syncInterval) return;
    // Poll every 5 minutes
    this._syncInterval = setInterval(() => {
      CalendarActions.syncAll();
    }, 5 * 60 * 1000);
  }

  private _stopSync() {
    if (this._syncInterval) {
      clearInterval(this._syncInterval);
      this._syncInterval = null;
    }
  }

  /**
   * Called from main.ts activate() to bootstrap the store.
   */
  async initialize() {
    // Load cached data first
    this._loadFromCache();
    this.trigger();

    // Try to restore authentication
    const restored = await CalendarActions.tryRestoreAuth();
    if (restored) {
      this._authenticated = true;
      this.trigger();
      // Do an initial sync, then start polling
      await CalendarActions.syncAll();
      this._startSync();
    }
  }

  cleanup() {
    this._stopSync();
  }

  // --- Getters ---

  isAuthenticated(): boolean {
    return this._authenticated;
  }

  authError(): string | null {
    return this._authError;
  }

  isSyncing(): boolean {
    return this._syncing;
  }

  syncError(): string | null {
    return this._syncError;
  }

  lastSyncTime(): number {
    return this._lastSyncTime;
  }

  calendars(): CalendarInfo[] {
    return this._calendars;
  }

  visibleCalendars(): CalendarInfo[] {
    return this._calendars.filter((c) => !this._hiddenCalendarIds.has(c.id));
  }

  hiddenCalendarIds(): Set<string> {
    return this._hiddenCalendarIds;
  }

  events(): CalendarEvent[] {
    const visibleIds = new Set(this.visibleCalendars().map((c) => c.id));
    return this._events.filter((e) => visibleIds.has(e.calendarId));
  }

  allEvents(): CalendarEvent[] {
    return this._events;
  }

  selectedDate(): Date {
    return this._selectedDate;
  }

  viewMode(): ViewMode {
    return this._viewMode;
  }

  dayZoomHeight(): number {
    return this._dayZoomHeight;
  }

  eventFormVisible(): boolean {
    return this._eventFormVisible;
  }

  eventFormData(): Partial<CalendarEvent> | null {
    return this._eventFormData;
  }

  eventDetailVisible(): boolean {
    return this._eventDetailVisible;
  }

  eventDetailData(): CalendarEvent | null {
    return this._eventDetailData;
  }

  /**
   * Get the calendar color for a given calendarId.
   */
  calendarColor(calendarId: string): string {
    const cal = this._calendars.find((c) => c.id === calendarId);
    return cal?.backgroundColor || '#4285f4';
  }

  /**
   * Get the account email (= primary calendar ID).
   */
  accountEmail(): string | null {
    const primary = this._calendars.find((c) => c.primary);
    return primary?.id || null;
  }

  /**
   * Get the primary calendar ID (or first writable one).
   */
  primaryCalendarId(): string | null {
    const primary = this._calendars.find((c) => c.primary);
    if (primary) return primary.id;
    const writable = this._calendars.find(
      (c) => c.accessRole === 'owner' || c.accessRole === 'writer'
    );
    return writable?.id || this._calendars[0]?.id || null;
  }
}

export default new CalendarStore();

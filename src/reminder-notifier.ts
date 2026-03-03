import { NativeNotifications, Actions, WorkspaceStore } from 'mailspring-exports';
import CalendarStore from './stores/calendar-store';
import * as CalendarActions from './stores/calendar-actions';
import { CalendarEvent, ReminderOverride } from './google-calendar-api';

const CHECK_INTERVAL_MS = 5 * 1000; // 30 seconds
const GRACE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes past event start

let intervalId: ReturnType<typeof setInterval> | null = null;
const firedReminders = new Set<string>();

function getEventStartTime(event: CalendarEvent): Date | null {
  if (event.isAllDay) return null;
  const dt = event.start.dateTime;
  if (!dt) return null;
  return new Date(dt);
}

function getEventEndTime(event: CalendarEvent): Date | null {
  if (event.isAllDay) return null;
  const dt = event.end.dateTime;
  if (!dt) return null;
  return new Date(dt);
}

function resolveReminders(event: CalendarEvent): number[] {
  if (!event.reminders) return [];

  if (event.reminders.useDefault) {
    const cal = CalendarStore.calendars().find((c) => c.id === event.calendarId);
    if (cal?.defaultReminders) {
      return cal.defaultReminders
        .filter((r: ReminderOverride) => r.method === 'popup')
        .map((r: ReminderOverride) => r.minutes);
    }
    return [];
  }

  if (event.reminders.overrides) {
    return event.reminders.overrides
      .filter((r) => r.method === 'popup')
      .map((r) => r.minutes);
  }

  return [];
}

function formatRelativeTime(minutes: number): string {
  if (minutes <= 0) return 'Now';
  if (minutes === 1) return 'in 1 minute';
  if (minutes < 60) return `in ${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'in 1 hour';
  return `in ${hours} hours`;
}

function checkReminders() {
  if (!CalendarStore.isAuthenticated()) {
    console.log('[GCal Reminders] Not authenticated, skipping check');
    return;
  }

  const now = Date.now();
  const events = CalendarStore.events();
  const calendars = CalendarStore.calendars();

  console.log(`[GCal Reminders] Checking ${events.length} events, ${calendars.length} calendars`);

  for (const event of events) {
    const startTime = getEventStartTime(event);
    if (!startTime) continue;

    const startMs = startTime.getTime();

    // Skip events that started more than grace window ago
    if (now > startMs + GRACE_WINDOW_MS) continue;

    const reminderMinutes = resolveReminders(event);

    if (reminderMinutes.length > 0) {
      const minsUntilStart = Math.round((startMs - now) / 60000);
      console.log(
        `[GCal Reminders] "${event.summary}" starts in ${minsUntilStart}min, ` +
        `reminders: [${reminderMinutes.join(', ')}]min, ` +
        `raw: ${JSON.stringify(event.reminders)}`
      );
    }

    for (const minutes of reminderMinutes) {
      const reminderTime = startMs - minutes * 60 * 1000;
      const key = `${event.id}:${minutes}`;

      if (now >= reminderTime && now < startMs + GRACE_WINDOW_MS && !firedReminders.has(key)) {
        firedReminders.add(key);

        console.log(`[GCal Reminders] FIRING notification for "${event.summary}" (${minutes}min reminder)`);

        NativeNotifications.displayNotification({
          title: event.summary,
          subtitle: formatRelativeTime(minutes),
          tag: `gcal-reminder-${event.id}-${minutes}`,
          onActivate: () => {
            Actions.selectRootSheet(WorkspaceStore.Sheet.GoogleCalendar);
            CalendarActions.selectDate(startTime);
            CalendarActions.showEventDetail(event);
          },
        });
      }
    }
  }

  // Clean up fired entries for events that have ended
  for (const key of firedReminders) {
    const eventId = key.split(':')[0];
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      // Event no longer in visible set — could be deleted or past the sync window
      firedReminders.delete(key);
      continue;
    }
    const endTime = getEventEndTime(event);
    if (endTime && now > endTime.getTime()) {
      firedReminders.delete(key);
    }
  }
}

export function startReminderNotifier() {
  if (intervalId) return;
  console.log(`[GCal Reminders] Starting notifier (interval: ${CHECK_INTERVAL_MS}ms)`);
  intervalId = setInterval(checkReminders, CHECK_INTERVAL_MS);
  // Run an initial check immediately
  checkReminders();
}

export function stopReminderNotifier() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  firedReminders.clear();
}

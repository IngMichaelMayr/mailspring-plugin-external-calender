import * as path from 'path';
import {
  ComponentRegistry,
  ExtensionRegistry,
  WorkspaceStore,
  AccountStore,
} from 'mailspring-exports';

import { CalendarRoot } from './components/calendar-root';
import { CalendarOverview } from './components/calendar-overview';
import { CalendarSettings } from './components/calendar-settings';
import { CreateEventButton } from './components/create-event-button';
import { CalendarSidebarExtension } from './calendar-mailbox-perspective';
import CalendarStore from './stores/calendar-store';
import { startReminderNotifier, stopReminderNotifier } from './reminder-notifier';

let styleEl: HTMLStyleElement | null = null;
let iconStyleEl: HTMLStyleElement | null = null;
let unsubCalendar: (() => void) | null = null;
let unsubAccount: (() => void) | null = null;

/**
 * Injects/updates a <style> element that hides sidebar children for
 * Mailspring accounts that don't match the connected Google Calendar email.
 *
 * In multi-account mode, Mailspring auto-creates a child sidebar item per
 * Mailspring account with DOM id "GoogleCalendar-{accId}". We use CSS :has()
 * to hide the wrapper div of non-matching items.
 */
function updateSidebarFilter() {
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'gcal-sidebar-filter';
    document.head.appendChild(styleEl);
  }

  const calEmail = CalendarStore.accountEmail();
  const accounts = AccountStore.accounts();

  // Build CSS rules to hide non-matching children
  const hideRules: string[] = [];
  for (const acc of accounts) {
    if (calEmail && acc.emailAddress === calEmail) continue;
    // Hide the OutlineViewItem wrapper div that contains this account's DropZone
    hideRules.push(
      `div:has(> .item-container #GoogleCalendar-${acc.id}) { display: none !important; }`
    );
  }

  styleEl.textContent = hideRules.join('\n');
}

/**
 * Injects a <style> element that overrides the sidebar icon for our calendar
 * entries. Mailspring's Utils.imageNamed() only scans its own static/images
 * directory, so plugin icons are never found and the fallback folder.png is
 * used. We override the -webkit-mask-image via CSS to use our own icon.
 */
function injectIconOverride() {
  if (iconStyleEl) return;
  iconStyleEl = document.createElement('style');
  iconStyleEl.id = 'gcal-icon-override';

  const iconPath = path
    .join(__dirname, '..', 'assets', 'icon-calendar@2x.png')
    .replace(/\\/g, '/');

  iconStyleEl.textContent = `
    [id^="GoogleCalendar"] .icon .retina-img.content-mask {
      -webkit-mask-image: url('file://${iconPath}') !important;
      -webkit-mask-size: contain !important;
    }
  `;
  document.head.appendChild(iconStyleEl);
}

function removeIconOverride() {
  if (iconStyleEl) {
    iconStyleEl.remove();
    iconStyleEl = null;
  }
}

function startSidebarFilter() {
  unsubCalendar = CalendarStore.listen(updateSidebarFilter);
  unsubAccount = AccountStore.listen(updateSidebarFilter);
  // Initial update (delayed to let sidebar render)
  setTimeout(updateSidebarFilter, 500);
}

function stopSidebarFilter() {
  unsubCalendar?.();
  unsubAccount?.();
  if (styleEl) {
    styleEl.remove();
    styleEl = null;
  }
}

export function activate() {
  // Register the sidebar extension (calendar icon in left sidebar)
  ExtensionRegistry.AccountSidebar.register(CalendarSidebarExtension);

  // Define the Google Calendar Overview sheet (parent sidebar entry)
  WorkspaceStore.defineSheet(
    'GoogleCalendarOverview',
    { root: true },
    { list: ['RootSidebar', 'GoogleCalendarOverviewContent'] }
  );

  // Define the Google Calendar sheet (full calendar view, child sidebar entries)
  WorkspaceStore.defineSheet(
    'GoogleCalendar',
    { root: true },
    { list: ['RootSidebar', 'GoogleCalendarContent'] }
  );

  // Define the Google Calendar Settings sheet
  WorkspaceStore.defineSheet(
    'GoogleCalendarSettings',
    { root: true },
    { list: ['RootSidebar', 'GoogleCalendarSettingsContent'] }
  );

  // Register components at their sheet-defined locations
  ComponentRegistry.register(CalendarOverview, {
    location: WorkspaceStore.Location.GoogleCalendarOverviewContent,
  });

  ComponentRegistry.register(CalendarRoot, {
    location: WorkspaceStore.Location.GoogleCalendarContent,
  });

  ComponentRegistry.register(CalendarSettings, {
    location: WorkspaceStore.Location.GoogleCalendarSettingsContent,
  });

  // Register toolbar button for creating events from emails
  ComponentRegistry.register(CreateEventButton, {
    role: 'ThreadActionsToolbarButton',
  });

  // Initialize the calendar store (starts sync if authenticated)
  CalendarStore.initialize();

  // Start checking for event reminders
  startReminderNotifier();

  // Start filtering non-calendar accounts from sidebar
  startSidebarFilter();

  // Override sidebar icon with our custom calendar icon
  injectIconOverride();
}

export function deactivate() {
  stopReminderNotifier();
  removeIconOverride();
  stopSidebarFilter();
  ExtensionRegistry.AccountSidebar.unregister(CalendarSidebarExtension);
  ComponentRegistry.unregister(CalendarOverview);
  ComponentRegistry.unregister(CalendarSettings);
  ComponentRegistry.unregister(CalendarRoot);
  ComponentRegistry.unregister(CreateEventButton);
  CalendarStore.cleanup();
}

export function serialize() {
  return {};
}

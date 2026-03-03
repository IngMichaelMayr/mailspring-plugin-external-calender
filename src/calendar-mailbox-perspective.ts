import {
  MailboxPerspective,
  WorkspaceStore,
  AccountStore,
  AccountSidebarExtension,
} from 'mailspring-exports';

/**
 * Perspective for the Overview sheet (parent sidebar entry "Calendars").
 */
class GoogleCalendarOverviewPerspective extends MailboxPerspective {
  sheet() {
    return WorkspaceStore.Sheet.GoogleCalendarOverview;
  }
  threads() {
    return null;
  }
  canReceiveThreadsFromAccountIds() {
    return false;
  }
  unreadCount() {
    return 0;
  }
}

/**
 * Perspective for the full calendar sheet (child sidebar entry = email address).
 */
class GoogleCalendarPerspective extends MailboxPerspective {
  sheet() {
    return WorkspaceStore.Sheet.GoogleCalendar;
  }
  threads() {
    return null;
  }
  canReceiveThreadsFromAccountIds() {
    return false;
  }
  unreadCount() {
    return 0;
  }
}

/**
 * Sidebar extension that adds "Calendars" to the account sidebar.
 *
 * Mailspring's sidebar calls sidebarItem() in two contexts:
 *   - With ALL account IDs → creates the parent item (or flat item in single-account mode)
 *   - With a SINGLE account ID → creates a child item per account (multi-account only)
 *
 * We use the overview perspective for the parent, and the calendar perspective for children.
 * Custom `children` on the return value are ignored by Mailspring — it auto-generates
 * children by calling sidebarItem() once per account.
 */
export const CalendarSidebarExtension: AccountSidebarExtension = {
  name: 'GoogleCalendar',

  sidebarItem(accountIds: string[]) {
    // Determine if this is the parent call (all accounts) or a child call (single account).
    // In single-account mode, there's only one call and it's always the parent.
    const allAccounts = AccountStore.accounts();
    const isParentCall = allAccounts.length === accountIds.length;

    if (isParentCall) {
      return {
        id: 'GoogleCalendar',
        name: 'Calendars',
        iconName: 'fa fa-calendar',
        perspective: new GoogleCalendarOverviewPerspective(accountIds),
      };
    }

    // Child call (multi-account mode): navigate to full calendar view
    return {
      id: 'GoogleCalendar',
      name: 'Calendars',
      iconName: 'fa fa-calendar',
      perspective: new GoogleCalendarPerspective(accountIds),
    };
  },
};

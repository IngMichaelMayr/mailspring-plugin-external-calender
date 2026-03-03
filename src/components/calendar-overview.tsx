import * as React from 'react';
import { ScrollRegion } from 'mailspring-component-kit';
import { Actions, WorkspaceStore } from 'mailspring-exports';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { AuthPrompt } from './auth-prompt';
import { CalendarEvent } from '../google-calendar-api';
import { getEventStart, formatTime } from '../utils/date-helpers';

interface CalendarOverviewState {
  authenticated: boolean;
  events: CalendarEvent[];
}

export class CalendarOverview extends React.Component<{}, CalendarOverviewState> {
  static displayName = 'CalendarOverview';
  private _unsubscribe?: () => void;

  state: CalendarOverviewState = {
    authenticated: CalendarStore.isAuthenticated(),
    events: CalendarStore.events(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => this._onStoreChange());
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  _onStoreChange = () => {
    this.setState({
      authenticated: CalendarStore.isAuthenticated(),
      events: CalendarStore.events(),
    });
  };

  _onOpenCalendar = () => {
    Actions.selectRootSheet(WorkspaceStore.Sheet.GoogleCalendar);
  };

  _onOpenSettings = () => {
    Actions.selectRootSheet(WorkspaceStore.Sheet.GoogleCalendarSettings);
  };

  _getUpcomingEvents(): CalendarEvent[] {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);

    return this.state.events
      .filter((e) => {
        const start = getEventStart(e);
        return start >= now && start <= endDate;
      })
      .sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());
  }

  _formatEventDate(event: CalendarEvent): string {
    const start = getEventStart(event);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel: string;
    if (start.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (start.toDateString() === tomorrow.toDateString()) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    if (event.isAllDay) {
      return `${dayLabel} (all day)`;
    }
    return `${dayLabel}, ${formatTime(start)}`;
  }

  _renderUpcomingEvents() {
    const upcoming = this._getUpcomingEvents();

    if (upcoming.length === 0) {
      return (
        <div className="gcal-overview-empty">
          No upcoming events in the next 7 days.
        </div>
      );
    }

    return (
      <ul className="gcal-overview-event-list">
        {upcoming.map((event) => (
          <li
            key={event.id}
            className="gcal-overview-event-item"
            onClick={() => CalendarActions.showEventDetail(event)}
          >
            <span
              className="gcal-overview-event-dot"
              style={{ background: CalendarStore.calendarColor(event.calendarId) }}
            />
            <div className="gcal-overview-event-info">
              <span className="gcal-overview-event-title">{event.summary}</span>
              <span className="gcal-overview-event-time">
                {this._formatEventDate(event)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    if (!this.state.authenticated) {
      return <AuthPrompt />;
    }

    return (
      <div className="gcal-overview">
        <button
          className="gcal-overview-settings-btn"
          onClick={this._onOpenSettings}
          title="Settings"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11.078 0c.294 0 .557.183.656.46l.575 1.61c.352.12.69.27 1.01.449l1.611-.577a.693.693 0 0 1 .762.187l.764.764a.693.693 0 0 1 .187.762l-.577 1.611c.18.32.33.658.45 1.01l1.609.575a.693.693 0 0 1 .46.656v1.08a.693.693 0 0 1-.46.657l-1.61.575c-.12.352-.27.69-.449 1.01l.577 1.611a.693.693 0 0 1-.187.762l-.764.764a.693.693 0 0 1-.762.187l-1.611-.577c-.32.18-.658.33-1.01.45l-.575 1.609a.693.693 0 0 1-.656.46H9.998a.693.693 0 0 1-.657-.46l-.575-1.61a5.924 5.924 0 0 1-1.01-.449l-1.611.577a.693.693 0 0 1-.762-.187l-.764-.764a.693.693 0 0 1-.187-.762l.577-1.611a5.963 5.963 0 0 1-.45-1.01l-1.609-.575a.693.693 0 0 1-.46-.656V9.46c0-.294.183-.557.46-.656l1.61-.575c.12-.352.27-.69.449-1.01l-.577-1.611a.693.693 0 0 1 .187-.762l.764-.764a.693.693 0 0 1 .762-.187l1.611.577c.32-.18.658-.33 1.01-.45L9.34.46A.693.693 0 0 1 9.998 0h1.08zM10.538 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
          </svg>
          Settings
        </button>
        <ScrollRegion className="gcal-overview-scroll">
          <div className="gcal-overview-inner">
            <div className="gcal-overview-header">
              <h1 className="gcal-overview-title">Calendars</h1>
              <button className="btn btn-emphasis" onClick={this._onOpenCalendar}>
                Open Calendar
              </button>
            </div>
            <section className="gcal-overview-section">
              <h2 className="gcal-overview-section-title">Upcoming Events</h2>
              {this._renderUpcomingEvents()}
            </section>
          </div>
        </ScrollRegion>
      </div>
    );
  }
}

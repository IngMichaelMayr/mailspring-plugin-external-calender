import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { CalendarEvent } from '../google-calendar-api';
import { getEventStart, getEventEnd, formatTime, formatDateShort } from '../utils/date-helpers';

interface EventDetailState {
  event: CalendarEvent | null;
}

export class EventDetailPopover extends React.Component<{}, EventDetailState> {
  private _unsubscribe?: () => void;

  state: EventDetailState = {
    event: CalendarStore.eventDetailData(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => {
      this.setState({ event: CalendarStore.eventDetailData() });
    });
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  _onClose = () => {
    CalendarActions.hideEventDetail();
  };

  _onEdit = () => {
    const { event } = this.state;
    if (!event) return;
    CalendarActions.hideEventDetail();
    CalendarActions.showEventForm(event);
  };

  _onDelete = async () => {
    const { event } = this.state;
    if (!event) return;

    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await CalendarActions.deleteEvent(event.calendarId, event.id);
      CalendarActions.hideEventDetail();
    } catch (err: any) {
      console.error('Failed to delete event:', err);
    }
  };

  _formatReminder(minutes: number): string {
    if (minutes === 0) return 'At time of event';
    if (minutes < 60) return `${minutes} minutes before`;
    if (minutes < 1440) {
      const h = minutes / 60;
      return h === 1 ? '1 hour before' : `${h} hours before`;
    }
    const d = minutes / 1440;
    return d === 1 ? '1 day before' : `${d} days before`;
  }

  _onOpenInBrowser = () => {
    const { event } = this.state;
    if (!event?.htmlLink) return;
    const { shell } = require('electron');
    shell.openExternal(event.htmlLink);
  };

  render() {
    const { event } = this.state;
    if (!event) return null;

    const start = getEventStart(event);
    const end = getEventEnd(event);
    const color = CalendarStore.calendarColor(event.calendarId);
    const calendar = CalendarStore.calendars().find((c) => c.id === event.calendarId);
    const isWritable =
      calendar?.accessRole === 'owner' || calendar?.accessRole === 'writer';

    let timeDisplay: string;
    if (event.isAllDay) {
      timeDisplay = formatDateShort(start);
    } else {
      timeDisplay = `${formatDateShort(start)}, ${formatTime(start)} – ${formatTime(end)}`;
    }

    return (
      <div className="gcal-event-detail-overlay" onClick={this._onClose}>
        <div className="gcal-event-detail" onClick={(e) => e.stopPropagation()}>
          <div className="gcal-detail-header">
            <span
              className="gcal-detail-color-dot"
              style={{ backgroundColor: color }}
            />
            <h3 className="gcal-detail-title">{event.summary}</h3>
            <button className="btn btn-icon gcal-detail-close" onClick={this._onClose}>
              &times;
            </button>
          </div>

          <div className="gcal-detail-body">
            <div className="gcal-detail-row">
              <span className="gcal-detail-icon">&#128337;</span>
              <span>{timeDisplay}</span>
            </div>

            {event.location && (
              <div className="gcal-detail-row">
                <span className="gcal-detail-icon">&#128205;</span>
                <span>{event.location}</span>
              </div>
            )}

            {event.description && (
              <div className="gcal-detail-row">
                <span className="gcal-detail-icon">&#128196;</span>
                <span className="gcal-detail-description">{event.description}</span>
              </div>
            )}

            {event.attendees && event.attendees.length > 0 && (
              <div className="gcal-detail-row">
                <span className="gcal-detail-icon">&#128101;</span>
                <div className="gcal-detail-attendees">
                  {event.attendees.map((a, i) => (
                    <div key={i} className="gcal-detail-attendee">
                      <span className="gcal-attendee-name">
                        {a.displayName || a.email}
                      </span>
                      {a.responseStatus && (
                        <span className={`gcal-attendee-status ${a.responseStatus}`}>
                          {a.responseStatus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.reminders && !event.reminders.useDefault && event.reminders.overrides && event.reminders.overrides.length > 0 && (
              <div className="gcal-detail-row">
                <span className="gcal-detail-icon">&#128276;</span>
                <span>{this._formatReminder(event.reminders.overrides[0].minutes)}</span>
              </div>
            )}

            {calendar && (
              <div className="gcal-detail-row">
                <span
                  className="gcal-detail-icon gcal-detail-cal-dot"
                  style={{ color }}
                >
                  &#9679;
                </span>
                <span>{calendar.summary}</span>
              </div>
            )}
          </div>

          <div className="gcal-detail-footer">
            {event.htmlLink && (
              <button className="btn btn-small" onClick={this._onOpenInBrowser}>
                Open in Google Calendar
              </button>
            )}
            {isWritable && (
              <>
                <button className="btn btn-small" onClick={this._onEdit}>
                  Edit
                </button>
                <button className="btn btn-small btn-danger" onClick={this._onDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

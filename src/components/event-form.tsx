import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { CalendarInfo, CalendarEvent } from '../google-calendar-api';
import { toISODateTime, toISODate } from '../utils/date-helpers';

const REMINDER_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'none', label: 'No reminder' },
  { value: '0', label: 'At time of event' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '120', label: '2 hours before' },
  { value: '1440', label: '1 day before' },
  { value: '2880', label: '2 days before' },
  { value: '10080', label: '1 week before' },
];

interface EventFormState {
  summary: string;
  description: string;
  location: string;
  calendarId: string;
  allDay: boolean;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string;
  endTime: string;
  attendees: string; // comma-separated emails
  reminder: string; // 'default', 'none', or minutes as string
  saving: boolean;
  error: string | null;
  editingEventId: string | null;
}

export class EventForm extends React.Component<{}, EventFormState> {
  constructor(props: {}) {
    super(props);

    const formData = CalendarStore.eventFormData();
    const now = new Date();
    const defaultStart = formData?.start?.dateTime
      ? new Date(formData.start.dateTime)
      : now;
    const defaultEnd = formData?.end?.dateTime
      ? new Date(formData.end.dateTime)
      : new Date(now.getTime() + 60 * 60 * 1000);

    const isAllDay = formData?.isAllDay || (!formData?.start?.dateTime && !!formData?.start?.date);

    // Determine reminder value from existing event data
    let reminder = 'default';
    if (formData?.reminders) {
      if (formData.reminders.useDefault) {
        reminder = 'default';
      } else if (!formData.reminders.overrides || formData.reminders.overrides.length === 0) {
        reminder = 'none';
      } else {
        reminder = String(formData.reminders.overrides[0].minutes);
      }
    }

    this.state = {
      summary: formData?.summary || '',
      description: formData?.description || '',
      location: formData?.location || '',
      calendarId: formData?.calendarId || CalendarStore.primaryCalendarId() || '',
      allDay: isAllDay,
      startDate: this._formatDateInput(defaultStart),
      startTime: this._formatTimeInput(defaultStart),
      endDate: this._formatDateInput(defaultEnd),
      endTime: this._formatTimeInput(defaultEnd),
      attendees: formData?.attendees?.map((a) => a.email).join(', ') || '',
      reminder,
      saving: false,
      error: null,
      editingEventId: formData?.id || null,
    };
  }

  _formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  _formatTimeInput(d: Date): string {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  _onClose = () => {
    CalendarActions.hideEventForm();
  };

  _buildReminders() {
    const { reminder } = this.state;
    if (reminder === 'default') {
      return { useDefault: true };
    }
    if (reminder === 'none') {
      return { useDefault: false, overrides: [] as Array<{ method: 'popup' | 'email'; minutes: number }> };
    }
    return {
      useDefault: false,
      overrides: [{ method: 'popup' as const, minutes: parseInt(reminder, 10) }],
    };
  }

  _onSave = async () => {
    const {
      summary,
      description,
      location,
      calendarId,
      allDay,
      startDate,
      startTime,
      endDate,
      endTime,
      attendees,
      editingEventId,
    } = this.state;

    if (!summary.trim()) {
      this.setState({ error: 'Please enter a title' });
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const start = allDay
      ? { date: startDate }
      : { dateTime: toISODateTime(new Date(startDate), parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1])), timeZone };
    const end = allDay
      ? { date: endDate || startDate }
      : { dateTime: toISODateTime(new Date(endDate), parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1])), timeZone };

    const attendeeList = attendees
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
      .map((email) => ({ email }));

    const reminders = this._buildReminders();

    this.setState({ saving: true, error: null });

    try {
      if (editingEventId) {
        await CalendarActions.updateEvent(calendarId, editingEventId, {
          summary: summary.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start,
          end,
          attendees: attendeeList.length > 0 ? attendeeList : undefined,
          reminders,
        });
      } else {
        await CalendarActions.createEvent(calendarId, {
          summary: summary.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start,
          end,
          attendees: attendeeList.length > 0 ? attendeeList : undefined,
          reminders,
        });
      }
      CalendarActions.hideEventForm();
    } catch (err: any) {
      this.setState({ saving: false, error: err.message || 'Failed to save event' });
    }
  };

  _onDelete = async () => {
    const { editingEventId, calendarId } = this.state;
    if (!editingEventId) return;

    if (!confirm('Are you sure you want to delete this event?')) return;

    this.setState({ saving: true, error: null });
    try {
      await CalendarActions.deleteEvent(calendarId, editingEventId);
      CalendarActions.hideEventForm();
    } catch (err: any) {
      this.setState({ saving: false, error: err.message || 'Failed to delete event' });
    }
  };

  render() {
    const {
      summary,
      description,
      location,
      calendarId,
      allDay,
      startDate,
      startTime,
      endDate,
      endTime,
      attendees,
      reminder,
      saving,
      error,
      editingEventId,
    } = this.state;
    const calendars = CalendarStore.calendars().filter(
      (c) => c.accessRole === 'owner' || c.accessRole === 'writer'
    );

    return (
      <div className="gcal-event-form-overlay" onClick={this._onClose}>
        <div className="gcal-event-form" onClick={(e) => e.stopPropagation()}>
          <div className="gcal-event-form-header">
            <h3>{editingEventId ? 'Edit Event' : 'New Event'}</h3>
            <button className="btn btn-icon gcal-form-close" onClick={this._onClose}>
              &times;
            </button>
          </div>

          {error && <div className="gcal-form-error">{error}</div>}

          <div className="gcal-form-body">
            <input
              type="text"
              className="gcal-form-title"
              placeholder="Add title"
              value={summary}
              onChange={(e) => this.setState({ summary: e.target.value })}
              autoFocus
            />

            <div className="gcal-form-row">
              <label className="gcal-form-checkbox">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => this.setState({ allDay: e.target.checked })}
                />
                All day
              </label>
            </div>

            <div className="gcal-form-row gcal-form-datetime">
              <input
                type="date"
                value={startDate}
                onChange={(e) => this.setState({ startDate: e.target.value })}
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => this.setState({ startTime: e.target.value })}
                />
              )}
              <span className="gcal-form-separator">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => this.setState({ endDate: e.target.value })}
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => this.setState({ endTime: e.target.value })}
                />
              )}
            </div>

            <input
              type="text"
              className="gcal-form-input"
              placeholder="Add location"
              value={location}
              onChange={(e) => this.setState({ location: e.target.value })}
            />

            <textarea
              className="gcal-form-textarea"
              placeholder="Add description"
              value={description}
              onChange={(e) => this.setState({ description: e.target.value })}
              rows={3}
            />

            <input
              type="text"
              className="gcal-form-input"
              placeholder="Add guests (comma-separated emails)"
              value={attendees}
              onChange={(e) => this.setState({ attendees: e.target.value })}
            />

            <div className="gcal-form-row">
              <label className="gcal-form-label">Reminder</label>
              <select
                className="gcal-form-select"
                value={reminder}
                onChange={(e) => this.setState({ reminder: e.target.value })}
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="gcal-form-select"
              value={calendarId}
              onChange={(e) => this.setState({ calendarId: e.target.value })}
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary}
                </option>
              ))}
            </select>
          </div>

          <div className="gcal-form-footer">
            {editingEventId && (
              <button
                className="btn btn-danger gcal-form-delete"
                onClick={this._onDelete}
                disabled={saving}
              >
                Delete
              </button>
            )}
            <div className="gcal-form-footer-right">
              <button className="btn" onClick={this._onClose} disabled={saving}>
                Cancel
              </button>
              <button
                className="btn btn-emphasis"
                onClick={this._onSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

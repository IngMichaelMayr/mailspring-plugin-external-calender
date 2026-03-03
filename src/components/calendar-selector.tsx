import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { CalendarInfo } from '../google-calendar-api';

interface CalendarSelectorState {
  calendars: CalendarInfo[];
  hiddenIds: Set<string>;
}

export class CalendarSelector extends React.Component<{}, CalendarSelectorState> {
  private _unsubscribe?: () => void;

  state: CalendarSelectorState = {
    calendars: CalendarStore.calendars(),
    hiddenIds: CalendarStore.hiddenCalendarIds(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => {
      this.setState({
        calendars: CalendarStore.calendars(),
        hiddenIds: CalendarStore.hiddenCalendarIds(),
      });
    });
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  _onToggle = (calendarId: string) => {
    CalendarActions.toggleCalendarVisibility(calendarId);
  };

  _onSignOut = async () => {
    await CalendarActions.signOut();
  };

  render() {
    const { calendars, hiddenIds } = this.state;

    return (
      <div className="gcal-calendar-selector">
        <h3 className="gcal-selector-title">My Calendars</h3>
        <div className="gcal-selector-list">
          {calendars.map((cal) => (
            <label key={cal.id} className="gcal-selector-item">
              <input
                type="checkbox"
                checked={!hiddenIds.has(cal.id)}
                onChange={() => this._onToggle(cal.id)}
              />
              <span
                className="gcal-selector-color"
                style={{ backgroundColor: cal.backgroundColor }}
              />
              <span className="gcal-selector-name">{cal.summary}</span>
            </label>
          ))}
        </div>
        <button className="btn btn-small gcal-btn-signout" onClick={this._onSignOut}>
          Disconnect Google
        </button>
      </div>
    );
  }
}

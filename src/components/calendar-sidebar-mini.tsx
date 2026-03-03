import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { getMonthGrid, isSameDay, isToday, addMonths, formatMonthYear } from '../utils/date-helpers';

interface MiniCalendarState {
  selectedDate: Date;
  displayMonth: Date;
}

export class CalendarSidebarMini extends React.Component<{}, MiniCalendarState> {
  private _unsubscribe?: () => void;

  state: MiniCalendarState = {
    selectedDate: CalendarStore.selectedDate(),
    displayMonth: CalendarStore.selectedDate(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => {
      this.setState({
        selectedDate: CalendarStore.selectedDate(),
        displayMonth: CalendarStore.selectedDate(),
      });
    });
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  _onPrevMonth = () => {
    this.setState((prev) => ({ displayMonth: addMonths(prev.displayMonth, -1) }));
  };

  _onNextMonth = () => {
    this.setState((prev) => ({ displayMonth: addMonths(prev.displayMonth, 1) }));
  };

  _onSelectDate = (date: Date) => {
    CalendarActions.selectDate(date);
  };

  render() {
    const { selectedDate, displayMonth } = this.state;
    const grid = getMonthGrid(displayMonth.getFullYear(), displayMonth.getMonth());
    const currentMonth = displayMonth.getMonth();

    return (
      <div className="gcal-mini-calendar">
        <div className="gcal-mini-header">
          <button className="btn btn-icon gcal-mini-nav" onClick={this._onPrevMonth}>
            &lsaquo;
          </button>
          <span className="gcal-mini-title">{formatMonthYear(displayMonth)}</span>
          <button className="btn btn-icon gcal-mini-nav" onClick={this._onNextMonth}>
            &rsaquo;
          </button>
        </div>
        <div className="gcal-mini-grid">
          <div className="gcal-mini-weekdays">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="gcal-mini-weekday">
                {d}
              </div>
            ))}
          </div>
          {grid.map((week, wi) => (
            <div key={wi} className="gcal-mini-week">
              {week.map((date, di) => {
                const otherMonth = date.getMonth() !== currentMonth;
                const selected = isSameDay(date, selectedDate);
                const today = isToday(date);
                const classes = [
                  'gcal-mini-day',
                  otherMonth ? 'other-month' : '',
                  selected ? 'selected' : '',
                  today ? 'today' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={di}
                    className={classes}
                    onClick={() => this._onSelectDate(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

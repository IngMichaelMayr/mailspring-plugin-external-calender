import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { CalendarEvent } from '../google-calendar-api';
import {
  getMonthGrid,
  isSameDay,
  isToday,
  eventsForDate,
  getEventStart,
  formatTime,
  getWeekdayNames,
} from '../utils/date-helpers';

const MAX_EVENTS_PER_CELL = 3;

interface MonthViewState {
  selectedDate: Date;
  events: CalendarEvent[];
}

export class CalendarMonthView extends React.Component<{}, MonthViewState> {
  private _unsubscribe?: () => void;
  private _timer: ReturnType<typeof setInterval> | null = null;

  state: MonthViewState = {
    selectedDate: CalendarStore.selectedDate(),
    events: CalendarStore.events(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => {
      this.setState({
        selectedDate: CalendarStore.selectedDate(),
        events: CalendarStore.events(),
      });
    });

    // Update once per minute so "today" stays correct if the app runs past midnight
    this._timer = setInterval(() => {
      this.forceUpdate();
    }, 60_000);
  }

  componentWillUnmount() {
    this._unsubscribe?.();
    if (this._timer) clearInterval(this._timer);
  }

  _onClickDate = (date: Date) => {
    CalendarActions.selectDate(date);
  };

  _onDoubleClickDate = (date: Date) => {
    CalendarActions.selectDate(date);
    CalendarActions.setViewMode('day');
  };

  _onClickEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    CalendarActions.showEventDetail(event);
  };

  _renderEventPill(event: CalendarEvent) {
    const color = CalendarStore.calendarColor(event.calendarId);
    const start = getEventStart(event);
    const timeStr = event.isAllDay ? '' : formatTime(start);

    return (
      <div
        key={event.id}
        className={`gcal-month-event ${event.isAllDay ? 'all-day' : ''}`}
        style={{ borderLeftColor: color }}
        onClick={(e) => this._onClickEvent(event, e)}
        title={event.summary}
      >
        {!event.isAllDay && <span className="gcal-event-time">{timeStr}</span>}
        <span className="gcal-event-title">{event.summary}</span>
      </div>
    );
  }

  render() {
    const { selectedDate, events } = this.state;
    const grid = getMonthGrid(selectedDate.getFullYear(), selectedDate.getMonth());
    const currentMonth = selectedDate.getMonth();

    return (
      <div className="gcal-month-view">
        <div className="gcal-month-header">
          {getWeekdayNames().map((name) => (
            <div key={name} className="gcal-month-weekday">
              {name}
            </div>
          ))}
        </div>
        <div className="gcal-month-grid">
          {grid.map((week, wi) => (
            <div key={wi} className="gcal-month-week">
              {week.map((date, di) => {
                const dayEvents = eventsForDate(events, date).sort(
                  (a, b) => getEventStart(a).getTime() - getEventStart(b).getTime()
                );
                const otherMonth = date.getMonth() !== currentMonth;
                const selected = isSameDay(date, selectedDate);
                const today = isToday(date);
                const overflow = dayEvents.length > MAX_EVENTS_PER_CELL;

                const classes = [
                  'gcal-month-cell',
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
                    style={today ? { boxShadow: 'inset 0 0 0 2px #e74c3c' } : undefined}
                    onClick={() => this._onClickDate(date)}
                    onDoubleClick={() => this._onDoubleClickDate(date)}
                  >
                    <div
                      className="gcal-month-day-number"
                      style={today ? {
                        background: '#e74c3c',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      } : undefined}
                    >
                      {date.getDate()}
                    </div>
                    <div className="gcal-month-events">
                      {dayEvents.slice(0, MAX_EVENTS_PER_CELL).map((evt) =>
                        this._renderEventPill(evt)
                      )}
                      {overflow && (
                        <div className="gcal-month-more">
                          +{dayEvents.length - MAX_EVENTS_PER_CELL} more
                        </div>
                      )}
                    </div>
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

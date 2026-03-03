import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { CalendarEvent } from '../google-calendar-api';
import {
  getWeekDates,
  isToday,
  isSameDay,
  eventsForDate,
  getEventStart,
  getEventEnd,
  getHourPosition,
  formatTime,
  formatDateShort,
} from '../utils/date-helpers';

const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const MIN_DRAG_PX = 5;
const MIN_EVENT_MINUTES = 30;

function yToSnappedDate(y: number, hourHeight: number, date: Date): Date {
  const totalMinutes = (y / hourHeight) * 60;
  const snapped = Math.round(totalMinutes / 15) * 15;
  const clamped = Math.max(0, Math.min(snapped, 23 * 60 + 45));
  const result = new Date(date);
  result.setHours(Math.floor(clamped / 60), clamped % 60, 0, 0);
  return result;
}

interface DragState {
  startY: number;
  currentY: number;
  rectTop: number;
  colHeight: number;
  colDate: Date;
}

interface WeekViewState {
  selectedDate: Date;
  events: CalendarEvent[];
  drag: DragState | null;
  now: Date;
}

export class CalendarWeekView extends React.Component<{}, WeekViewState> {
  private _unsubscribe?: () => void;
  private _scrollRef = React.createRef<HTMLDivElement>();
  private _timer: ReturnType<typeof setInterval> | null = null;

  state: WeekViewState = {
    selectedDate: CalendarStore.selectedDate(),
    events: CalendarStore.events(),
    drag: null,
    now: new Date(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => {
      this.setState({
        selectedDate: CalendarStore.selectedDate(),
        events: CalendarStore.events(),
      });
    });

    this._timer = setInterval(() => {
      this.setState({ now: new Date() });
    }, 60_000);

    // Scroll to current hour on mount
    if (this._scrollRef.current) {
      const now = new Date();
      this._scrollRef.current.scrollTop = now.getHours() * HOUR_HEIGHT - 100;
    }
  }

  componentWillUnmount() {
    this._unsubscribe?.();
    if (this._timer) clearInterval(this._timer);
    document.removeEventListener('mousemove', this._onDocMouseMove);
    document.removeEventListener('mouseup', this._onDocMouseUp);
  }

  _onClickEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    CalendarActions.showEventDetail(event);
  };

  _onMouseDown = (e: React.MouseEvent<HTMLDivElement>, date: Date) => {
    if ((e.target as HTMLElement).closest('.gcal-week-event')) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    this.setState({
      drag: {
        startY: y,
        currentY: y,
        rectTop: rect.top,
        colHeight: e.currentTarget.offsetHeight,
        colDate: date,
      },
    });
    document.addEventListener('mousemove', this._onDocMouseMove);
    document.addEventListener('mouseup', this._onDocMouseUp);
  };

  _onDocMouseMove = (e: MouseEvent) => {
    const { drag } = this.state;
    if (!drag) return;
    const y = Math.max(0, Math.min(e.clientY - drag.rectTop, drag.colHeight));
    this.setState({ drag: { ...drag, currentY: y } });
  };

  _onDocMouseUp = (_e: MouseEvent) => {
    document.removeEventListener('mousemove', this._onDocMouseMove);
    document.removeEventListener('mouseup', this._onDocMouseUp);
    const { drag } = this.state;
    if (!drag) return;

    const rawDist = Math.abs(drag.currentY - drag.startY);
    const minPx = (MIN_EVENT_MINUTES / 60) * HOUR_HEIGHT;
    const topY = Math.min(drag.startY, drag.currentY);
    let bottomY = Math.max(drag.startY, drag.currentY);

    CalendarActions.selectDate(drag.colDate);

    if (rawDist < MIN_DRAG_PX) {
      const startTime = yToSnappedDate(drag.startY, HOUR_HEIGHT, drag.colDate);
      const endTime = new Date(startTime.getTime() + MIN_EVENT_MINUTES * 60 * 1000);
      CalendarActions.showEventForm({
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      });
    } else {
      if (bottomY - topY < minPx) bottomY = topY + minPx;
      const startTime = yToSnappedDate(topY, HOUR_HEIGHT, drag.colDate);
      const endTime = yToSnappedDate(bottomY, HOUR_HEIGHT, drag.colDate);
      CalendarActions.showEventForm({
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      });
    }

    this.setState({ drag: null });
  };

  _renderDragPreview() {
    const { drag } = this.state;
    if (!drag) return null;
    const topY = Math.min(drag.startY, drag.currentY);
    const rawHeight = Math.abs(drag.currentY - drag.startY);
    const minPx = (MIN_EVENT_MINUTES / 60) * HOUR_HEIGHT;
    const height = Math.max(rawHeight, minPx);
    const startTime = yToSnappedDate(topY, HOUR_HEIGHT, drag.colDate);
    const endTime = yToSnappedDate(topY + height, HOUR_HEIGHT, drag.colDate);
    return (
      <div className="gcal-drag-preview" style={{ top: topY, height }}>
        <span className="gcal-drag-preview-label">
          {formatTime(startTime)} – {formatTime(endTime)}
        </span>
      </div>
    );
  }

  _renderTimeColumn() {
    return (
      <div className="gcal-week-time-col">
        {HOURS.map((h) => (
          <div key={h} className="gcal-week-time-label" style={{ height: HOUR_HEIGHT }}>
            {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
          </div>
        ))}
      </div>
    );
  }

  _renderAllDayRow(weekDates: Date[]) {
    return (
      <div className="gcal-week-allday-row">
        <div className="gcal-week-allday-label">All day</div>
        {weekDates.map((date, i) => {
          const dayEvents = eventsForDate(this.state.events, date).filter((e) => e.isAllDay);
          return (
            <div key={i} className="gcal-week-allday-cell">
              {dayEvents.map((evt) => {
                const color = CalendarStore.calendarColor(evt.calendarId);
                return (
                  <div
                    key={evt.id}
                    className="gcal-week-allday-event"
                    style={{ backgroundColor: color }}
                    onClick={(e) => this._onClickEvent(evt, e)}
                    title={evt.summary}
                  >
                    {evt.summary}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  _renderDayColumn(date: Date) {
    const { drag, now } = this.state;
    const isDragging = drag !== null && isSameDay(date, drag.colDate);
    const dayEvents = eventsForDate(this.state.events, date).filter((e) => !e.isAllDay);

    return (
      <div
        className={`gcal-week-day-col${isDragging ? ' dragging' : ''}`}
        onMouseDown={(e) => this._onMouseDown(e, date)}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            className="gcal-week-hour-cell"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}
        {isToday(date) && (
          <div
            className="gcal-week-current-time"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: '#e74c3c',
              zIndex: 10,
              pointerEvents: 'none',
              top: getHourPosition(now) * HOUR_HEIGHT,
            }}
          >
            <div style={{
              position: 'absolute',
              left: -4,
              top: -3,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e74c3c',
            }} />
          </div>
        )}
        {dayEvents.map((evt) => {
          const start = getEventStart(evt);
          const end = getEventEnd(evt);
          const top = getHourPosition(start) * HOUR_HEIGHT;
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          const height = Math.max(duration * HOUR_HEIGHT, 20);
          const color = CalendarStore.calendarColor(evt.calendarId);

          return (
            <div
              key={evt.id}
              className="gcal-week-event"
              style={{
                top,
                height,
                backgroundColor: color,
              }}
              onClick={(e) => this._onClickEvent(evt, e)}
              title={evt.summary}
            >
              <div className="gcal-week-event-time">{formatTime(start)}</div>
              <div className="gcal-week-event-title">{evt.summary}</div>
            </div>
          );
        })}
        {isDragging && this._renderDragPreview()}
      </div>
    );
  }

  render() {
    const { selectedDate } = this.state;
    const weekDates = getWeekDates(selectedDate);

    return (
      <div className="gcal-week-view">
        <div className="gcal-week-header">
          <div className="gcal-week-time-col-header" />
          {weekDates.map((date, i) => {
            const today = isToday(date);
            const selected = isSameDay(date, selectedDate);
            return (
              <div
                key={i}
                className={`gcal-week-day-header ${today ? 'today' : ''} ${selected ? 'selected' : ''}`}
                onClick={() => CalendarActions.selectDate(date)}
              >
                <div className="gcal-week-day-name">
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div className="gcal-week-day-num">{date.getDate()}</div>
              </div>
            );
          })}
        </div>
        {this._renderAllDayRow(weekDates)}
        <div className="gcal-week-body" ref={this._scrollRef}>
          {this._renderTimeColumn()}
          <div className="gcal-week-days">
            {weekDates.map((date, i) => (
              <React.Fragment key={i}>{this._renderDayColumn(date)}</React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

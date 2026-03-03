import * as React from 'react';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { CalendarEvent } from '../google-calendar-api';
import {
  eventsForDate,
  getEventStart,
  getEventEnd,
  getHourPosition,
  formatTime,
  isToday,
} from '../utils/date-helpers';

const DEFAULT_HOUR_HEIGHT = 60;
const MIN_HOUR_HEIGHT = 30;
const MAX_HOUR_HEIGHT = 180;
const ZOOM_STEP = 15;
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
}

interface DayViewState {
  selectedDate: Date;
  events: CalendarEvent[];
  hourHeight: number;
  drag: DragState | null;
  now: Date;
}

export class CalendarDayView extends React.Component<{}, DayViewState> {
  private _unsubscribe?: () => void;
  private _scrollRef = React.createRef<HTMLDivElement>();
  private _timer: ReturnType<typeof setInterval> | null = null;

  state: DayViewState = {
    selectedDate: CalendarStore.selectedDate(),
    events: CalendarStore.events(),
    hourHeight: CalendarStore.dayZoomHeight(),
    drag: null,
    now: new Date(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => {
      this.setState({
        selectedDate: CalendarStore.selectedDate(),
        events: CalendarStore.events(),
        hourHeight: CalendarStore.dayZoomHeight(),
      });
    });

    this._timer = setInterval(() => {
      this.setState({ now: new Date() });
    }, 60_000);

    if (this._scrollRef.current) {
      const now = new Date();
      this._scrollRef.current.scrollTop = now.getHours() * this.state.hourHeight - 100;
    }
  }

  componentWillUnmount() {
    this._unsubscribe?.();
    if (this._timer) clearInterval(this._timer);
    document.removeEventListener('mousemove', this._onDocMouseMove);
    document.removeEventListener('mouseup', this._onDocMouseUp);
  }

  _setZoom(newHeight: number) {
    const clamped = Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, newHeight));
    if (clamped !== this.state.hourHeight) {
      CalendarActions.setDayZoom(clamped);
    }
  }

  _onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const scrollEl = this._scrollRef.current;
    if (!scrollEl) return;

    const rect = scrollEl.getBoundingClientRect();
    const cursorY = e.clientY - rect.top;
    const scrollRatio = (scrollEl.scrollTop + cursorY) / (this.state.hourHeight * 24);

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newHeight = Math.min(MAX_HOUR_HEIGHT, Math.max(MIN_HOUR_HEIGHT, this.state.hourHeight + delta));

    if (newHeight !== this.state.hourHeight) {
      CalendarActions.setDayZoom(newHeight);
      // Restore scroll after re-render
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollRatio * (newHeight * 24) - cursorY;
        }
      });
    }
  };

  _onZoomIn = () => {
    this._setZoom(this.state.hourHeight + ZOOM_STEP);
  };

  _onZoomOut = () => {
    this._setZoom(this.state.hourHeight - ZOOM_STEP);
  };

  _onZoomReset = () => {
    this._setZoom(DEFAULT_HOUR_HEIGHT);
  };

  _onClickEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    CalendarActions.showEventDetail(event);
  };

  _onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.gcal-day-event')) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    this.setState({
      drag: {
        startY: y,
        currentY: y,
        rectTop: rect.top,
        colHeight: e.currentTarget.offsetHeight,
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
    const { drag, selectedDate, hourHeight } = this.state;
    if (!drag) return;

    const rawDist = Math.abs(drag.currentY - drag.startY);
    const minPx = (MIN_EVENT_MINUTES / 60) * hourHeight;
    const topY = Math.min(drag.startY, drag.currentY);
    let bottomY = Math.max(drag.startY, drag.currentY);

    if (rawDist < MIN_DRAG_PX) {
      const startTime = yToSnappedDate(drag.startY, hourHeight, selectedDate);
      const endTime = new Date(startTime.getTime() + MIN_EVENT_MINUTES * 60 * 1000);
      CalendarActions.showEventForm({
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      });
    } else {
      if (bottomY - topY < minPx) bottomY = topY + minPx;
      const startTime = yToSnappedDate(topY, hourHeight, selectedDate);
      const endTime = yToSnappedDate(bottomY, hourHeight, selectedDate);
      CalendarActions.showEventForm({
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      });
    }

    this.setState({ drag: null });
  };

  _renderDragPreview() {
    const { drag, selectedDate, hourHeight } = this.state;
    if (!drag) return null;
    const topY = Math.min(drag.startY, drag.currentY);
    const rawHeight = Math.abs(drag.currentY - drag.startY);
    const minPx = (MIN_EVENT_MINUTES / 60) * hourHeight;
    const height = Math.max(rawHeight, minPx);
    const startTime = yToSnappedDate(topY, hourHeight, selectedDate);
    const endTime = yToSnappedDate(topY + height, hourHeight, selectedDate);
    return (
      <div className="gcal-drag-preview" style={{ top: topY, height }}>
        <span className="gcal-drag-preview-label">
          {formatTime(startTime)} – {formatTime(endTime)}
        </span>
      </div>
    );
  }

  _renderCurrentTimeLine() {
    if (!isToday(this.state.selectedDate)) return null;
    const { now, hourHeight } = this.state;
    const top = getHourPosition(now) * hourHeight;
    return <div className="gcal-day-current-time" style={{ top }} />;
  }

  render() {
    const { selectedDate, events, hourHeight, drag } = this.state;
    const dayEvents = eventsForDate(events, selectedDate);
    const allDayEvents = dayEvents.filter((e) => e.isAllDay);
    const timedEvents = dayEvents.filter((e) => !e.isAllDay);
    const canZoomIn = hourHeight < MAX_HOUR_HEIGHT;
    const canZoomOut = hourHeight > MIN_HOUR_HEIGHT;

    return (
      <div className="gcal-day-view">
        {allDayEvents.length > 0 && (
          <div className="gcal-day-allday">
            <span className="gcal-day-allday-label">All day</span>
            <div className="gcal-day-allday-events">
              {allDayEvents.map((evt) => {
                const color = CalendarStore.calendarColor(evt.calendarId);
                return (
                  <div
                    key={evt.id}
                    className="gcal-day-allday-event"
                    style={{ backgroundColor: color }}
                    onClick={(e) => this._onClickEvent(evt, e)}
                  >
                    {evt.summary}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="gcal-day-zoom-controls">
          <button
            className="btn btn-icon gcal-zoom-btn"
            onClick={this._onZoomOut}
            disabled={!canZoomOut}
            title="Zoom out"
          >
            &#x2212;
          </button>
          <button
            className="btn btn-icon gcal-zoom-btn gcal-zoom-reset"
            onClick={this._onZoomReset}
            title="Reset zoom"
          >
            {Math.round((hourHeight / DEFAULT_HOUR_HEIGHT) * 100)}%
          </button>
          <button
            className="btn btn-icon gcal-zoom-btn"
            onClick={this._onZoomIn}
            disabled={!canZoomIn}
            title="Zoom in"
          >
            +
          </button>
        </div>
        <div className="gcal-day-body" ref={this._scrollRef} onWheel={this._onWheel}>
          <div className="gcal-day-time-col">
            {HOURS.map((h) => (
              <div key={h} className="gcal-day-time-label" style={{ height: hourHeight }}>
                {h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          <div
            className={`gcal-day-events-col${drag ? ' dragging' : ''}`}
            onMouseDown={this._onMouseDown}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="gcal-day-hour-cell"
                style={{ height: hourHeight }}
              />
            ))}
            {this._renderCurrentTimeLine()}
            {timedEvents.map((evt) => {
              const start = getEventStart(evt);
              const end = getEventEnd(evt);
              const top = getHourPosition(start) * hourHeight;
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              const height = Math.max(duration * hourHeight, 24);
              const color = CalendarStore.calendarColor(evt.calendarId);

              return (
                <div
                  key={evt.id}
                  className="gcal-day-event"
                  style={{
                    top,
                    height,
                    backgroundColor: color,
                  }}
                  onClick={(e) => this._onClickEvent(evt, e)}
                >
                  <div className="gcal-day-event-time">
                    {formatTime(start)} – {formatTime(end)}
                  </div>
                  <div className="gcal-day-event-title">{evt.summary}</div>
                  {evt.location && (
                    <div className="gcal-day-event-location">{evt.location}</div>
                  )}
                </div>
              );
            })}
            {this._renderDragPreview()}
          </div>
        </div>
      </div>
    );
  }
}

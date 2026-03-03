import * as React from 'react';
import { ScrollRegion } from 'mailspring-component-kit';
import CalendarStore, { ViewMode } from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { AuthPrompt } from './auth-prompt';
import { CalendarSidebarMini } from './calendar-sidebar-mini';
import { CalendarMonthView } from './calendar-month-view';
import { CalendarWeekView } from './calendar-week-view';
import { CalendarDayView } from './calendar-day-view';
import { CalendarSelector } from './calendar-selector';
import { EventForm } from './event-form';
import { EventDetailPopover } from './event-detail-popover';
import { formatMonthYear, addMonths, addDays, getWeekDates } from '../utils/date-helpers';

interface CalendarRootState {
  authenticated: boolean;
  syncing: boolean;
  viewMode: ViewMode;
  selectedDate: Date;
  eventFormVisible: boolean;
  eventDetailVisible: boolean;
}

export class CalendarRoot extends React.Component<{}, CalendarRootState> {
  static displayName = 'CalendarRoot';
  private _unsubscribe?: () => void;

  state: CalendarRootState = {
    authenticated: CalendarStore.isAuthenticated(),
    syncing: CalendarStore.isSyncing(),
    viewMode: CalendarStore.viewMode(),
    selectedDate: CalendarStore.selectedDate(),
    eventFormVisible: CalendarStore.eventFormVisible(),
    eventDetailVisible: CalendarStore.eventDetailVisible(),
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
      syncing: CalendarStore.isSyncing(),
      viewMode: CalendarStore.viewMode(),
      selectedDate: CalendarStore.selectedDate(),
      eventFormVisible: CalendarStore.eventFormVisible(),
      eventDetailVisible: CalendarStore.eventDetailVisible(),
    });
  };

  _onNavigatePrev = () => {
    const { viewMode, selectedDate } = this.state;
    if (viewMode === 'month') {
      CalendarActions.selectDate(addMonths(selectedDate, -1));
    } else if (viewMode === 'week') {
      CalendarActions.selectDate(addDays(selectedDate, -7));
    } else {
      CalendarActions.selectDate(addDays(selectedDate, -1));
    }
  };

  _onNavigateNext = () => {
    const { viewMode, selectedDate } = this.state;
    if (viewMode === 'month') {
      CalendarActions.selectDate(addMonths(selectedDate, 1));
    } else if (viewMode === 'week') {
      CalendarActions.selectDate(addDays(selectedDate, 7));
    } else {
      CalendarActions.selectDate(addDays(selectedDate, 1));
    }
  };

  _onToday = () => {
    CalendarActions.selectDate(new Date());
  };

  _onSetView = (mode: ViewMode) => {
    CalendarActions.setViewMode(mode);
  };

  _onNewEvent = () => {
    CalendarActions.showEventForm();
  };

  _onSync = () => {
    CalendarActions.syncAll();
  };

  _renderHeader() {
    const { viewMode, selectedDate, syncing } = this.state;

    let title = '';
    if (viewMode === 'month') {
      title = formatMonthYear(selectedDate);
    } else if (viewMode === 'week') {
      const weekDates = getWeekDates(selectedDate);
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        title = `${start.toLocaleDateString(undefined, { month: 'long' })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        title = `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()} – ${end.toLocaleDateString(undefined, { month: 'short' })} ${end.getDate()}, ${end.getFullYear()}`;
      }
    } else {
      title = selectedDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return (
      <div className="gcal-header">
        <div className="gcal-header-left">
          <button className="btn gcal-btn-today" onClick={this._onToday}>
            Today
          </button>
          <button className="btn btn-icon gcal-nav-btn" onClick={this._onNavigatePrev}>
            &lsaquo;
          </button>
          <button className="btn btn-icon gcal-nav-btn" onClick={this._onNavigateNext}>
            &rsaquo;
          </button>
          <h2 className="gcal-header-title">{title}</h2>
        </div>
        <div className="gcal-header-right">
          <button
            className={`btn gcal-btn-sync ${syncing ? 'syncing' : ''}`}
            onClick={this._onSync}
            disabled={syncing}
            title="Sync calendars"
          >
            <span className="gcal-sync-icon">&#x21bb;</span>
          </button>
          <div className="gcal-view-switcher">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                className={`btn gcal-view-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => this._onSetView(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-emphasis gcal-btn-new-event" onClick={this._onNewEvent}>
            + New Event
          </button>
        </div>
      </div>
    );
  }

  _renderMainView() {
    switch (this.state.viewMode) {
      case 'month':
        return <CalendarMonthView />;
      case 'week':
        return <CalendarWeekView />;
      case 'day':
        return <CalendarDayView />;
    }
  }

  render() {
    if (!this.state.authenticated) {
      return <AuthPrompt />;
    }

    return (
      <div className="gcal-root">
        {this._renderHeader()}
        <div className="gcal-body">
          <div className="gcal-sidebar">
            <CalendarSidebarMini />
            <CalendarSelector />
          </div>
          <ScrollRegion className="gcal-main-content">
            {this._renderMainView()}
          </ScrollRegion>
        </div>
        {this.state.eventFormVisible && <EventForm />}
        {this.state.eventDetailVisible && <EventDetailPopover />}
      </div>
    );
  }
}

import * as React from 'react';
import { FocusedContentStore, Thread, MessageStore } from 'mailspring-exports';
import { RetinaImg } from 'mailspring-component-kit';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';
import { parseThreadForEvent } from '../utils/email-parser';

interface CreateEventButtonProps {
  thread?: Thread;
  items?: Thread[];
}

export class CreateEventButton extends React.Component<CreateEventButtonProps> {
  static displayName = 'CreateEventButton';
  _onClick = () => {
    if (!CalendarStore.isAuthenticated()) return;

    // Get the focused thread
    const thread =
      this.props.thread ||
      (this.props.items && this.props.items[0]) ||
      (FocusedContentStore.focused('thread') as Thread | null);

    if (!thread) return;

    // Get the latest message for extra context
    const messages = MessageStore.items();
    const latestMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

    // Parse the thread for event data
    const parsed = parseThreadForEvent(thread, latestMessage);

    // Build pre-filled event data
    const now = parsed.suggestedDate || new Date();
    const startTime = new Date(now);
    if (!parsed.suggestedDate) {
      // Default to next hour
      startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
    }
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    CalendarActions.showEventForm({
      summary: parsed.summary,
      description: parsed.description,
      attendees: parsed.attendees,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    } as any);
  };

  render() {
    if (!CalendarStore.isAuthenticated()) return null;

    return (
      <button
        className="btn btn-toolbar gcal-create-event-btn"
        title="Create calendar event from this email"
        onClick={this._onClick}
      >
        <RetinaImg
          name="icon-calendar.png"
          mode={RetinaImg.Mode.ContentIsMask}
        />
      </button>
    );
  }
}

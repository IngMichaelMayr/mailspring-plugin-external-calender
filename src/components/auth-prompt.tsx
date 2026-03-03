import * as React from 'react';
import { Spinner } from 'mailspring-component-kit';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';

interface AuthPromptState {
  connecting: boolean;
  error: string | null;
}

export class AuthPrompt extends React.Component<{}, AuthPromptState> {
  state: AuthPromptState = {
    connecting: false,
    error: null,
  };

  private _unsubscribe?: () => void;

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => this.forceUpdate());
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  _onConnect = async () => {
    this.setState({ connecting: true, error: null });
    try {
      await CalendarActions.authenticate();
      this.setState({ connecting: false });
    } catch (err: any) {
      this.setState({
        connecting: false,
        error: err.message || 'Failed to connect',
      });
    }
  };

  render() {
    const { connecting, error } = this.state;

    return (
      <div className="gcal-auth-prompt">
        <div className="gcal-auth-prompt-inner">
          <div className="gcal-auth-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="4" y="8" width="56" height="52" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="4" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="2" />
              <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="44" y1="8" x2="44" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2>Connect Google Calendar</h2>
          <p>
            Sign in with your Google account to view and manage your calendar
            events directly in Mailspring.
          </p>
          {error && <div className="gcal-auth-error">{error}</div>}
          <button
            className="btn btn-large btn-emphasis"
            onClick={this._onConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Spinner visible={true} style={{ display: 'inline-block' }} />
                Connecting...
              </>
            ) : (
              'Connect Google Account'
            )}
          </button>
        </div>
      </div>
    );
  }
}

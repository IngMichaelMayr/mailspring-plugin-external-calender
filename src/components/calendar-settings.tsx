import * as React from 'react';
import { ScrollRegion } from 'mailspring-component-kit';
import { Actions, WorkspaceStore } from 'mailspring-exports';
import CalendarStore from '../stores/calendar-store';
import * as CalendarActions from '../stores/calendar-actions';

interface CalendarSettingsState {
  accountEmail: string | null;
  syncing: boolean;
  syncError: string | null;
  lastSyncTime: number;
}

export class CalendarSettings extends React.Component<{}, CalendarSettingsState> {
  static displayName = 'CalendarSettings';
  private _unsubscribe?: () => void;

  state: CalendarSettingsState = {
    accountEmail: CalendarStore.accountEmail(),
    syncing: CalendarStore.isSyncing(),
    syncError: CalendarStore.syncError(),
    lastSyncTime: CalendarStore.lastSyncTime(),
  };

  componentDidMount() {
    this._unsubscribe = CalendarStore.listen(() => this._onStoreChange());
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  _onStoreChange = () => {
    this.setState({
      accountEmail: CalendarStore.accountEmail(),
      syncing: CalendarStore.isSyncing(),
      syncError: CalendarStore.syncError(),
      lastSyncTime: CalendarStore.lastSyncTime(),
    });
  };

  _onBack = () => {
    Actions.selectRootSheet(WorkspaceStore.Sheet.GoogleCalendarOverview);
  };

  _onAddAccount = () => {
    CalendarActions.authenticate();
  };

  _onDisconnect = () => {
    CalendarActions.signOut();
  };

  _onSyncNow = () => {
    CalendarActions.syncAll();
  };

  _formatLastSync(): string {
    const t = this.state.lastSyncTime;
    if (!t) return 'Noch nie';
    const d = new Date(t);
    return d.toLocaleString();
  }

  render() {
    const { accountEmail, syncing, syncError, lastSyncTime } = this.state;

    return (
      <ScrollRegion className="gcal-settings">
        <div className="gcal-settings-inner">
          <div className="gcal-settings-header">
            <button className="gcal-settings-back" onClick={this._onBack}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.354 3.354a.5.5 0 0 0-.708-.708l-5 5a.5.5 0 0 0 0 .708l5 5a.5.5 0 0 0 .708-.708L5.707 8l4.647-4.646z" />
              </svg>
              Back
            </button>
            <h1 className="gcal-settings-title">Settings</h1>
          </div>

          <section className="gcal-settings-section">
            <h2 className="gcal-settings-section-title">Connected Accounts</h2>
            <div className="gcal-settings-accounts">
              {accountEmail && (
                <div className="gcal-settings-account-row">
                  <span className="gcal-settings-account-email">{accountEmail}</span>
                  <button className="btn btn-small btn-danger" onClick={this._onDisconnect}>
                    Disconnect
                  </button>
                </div>
              )}
              {!accountEmail && (
                <div className="gcal-settings-empty">No Google account connected.</div>
              )}
            </div>
            <button className="btn btn-small gcal-settings-add" onClick={this._onAddAccount}>
              + Add Google Account
            </button>
          </section>

          {accountEmail && (
            <section className="gcal-settings-section">
              <h2 className="gcal-settings-section-title">Sync</h2>
              <div className="gcal-sync-status" style={{ marginBottom: 8, fontSize: 13, opacity: 0.7 }}>
                Letzter Sync: {this._formatLastSync()}
              </div>
              {syncError && (
                <div className="gcal-sync-error" style={{
                  background: 'rgba(200,50,50,0.15)',
                  border: '1px solid rgba(200,50,50,0.4)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  marginBottom: 8,
                  fontSize: 12,
                  color: '#e05050',
                  wordBreak: 'break-all',
                }}>
                  <strong>Sync-Fehler:</strong> {syncError}
                </div>
              )}
              <button
                className="btn btn-small"
                onClick={this._onSyncNow}
                disabled={syncing}
              >
                {syncing ? 'Synchronisiert...' : 'Jetzt synchronisieren'}
              </button>
            </section>
          )}
        </div>
      </ScrollRegion>
    );
  }
}

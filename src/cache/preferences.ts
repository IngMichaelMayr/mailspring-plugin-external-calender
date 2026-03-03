import * as fs from 'fs';
import * as path from 'path';

declare const AppEnv: { getConfigDirPath(): string };

export interface UserPreferences {
  viewMode: 'month' | 'week' | 'day';
  dayZoomHeight: number;
  hiddenCalendarIds: string[];
}

const PREFS_FILENAME = 'google-calendar-prefs.json';

const DEFAULTS: UserPreferences = {
  viewMode: 'month',
  dayZoomHeight: 60,
  hiddenCalendarIds: [],
};

function getPrefsPath(): string {
  return path.join(AppEnv.getConfigDirPath(), PREFS_FILENAME);
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = fs.readFileSync(getPrefsPath(), 'utf-8');
    const saved = JSON.parse(raw);
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    fs.writeFileSync(getPrefsPath(), JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GoogleCalendar] Failed to save preferences:', err);
  }
}

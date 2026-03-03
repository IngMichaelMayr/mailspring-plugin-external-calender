import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { OAuth2Client, Credentials } from 'google-auth-library';

// AppEnv is a global provided by Mailspring's renderer process
declare const AppEnv: { getConfigDirPath(): string };

const CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET || '';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const TOKEN_FILENAME = 'google-calendar-tokens.json';

function getTokenPath(): string {
  return path.join(AppEnv.getConfigDirPath(), TOKEN_FILENAME);
}

let oauth2Client: OAuth2Client | null = null;

/**
 * Returns the singleton OAuth2Client, creating it if necessary.
 * The redirect URI is set lazily when the auth flow starts.
 */
export function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, 'http://127.0.0.1');
  }
  return oauth2Client;
}

/**
 * Save tokens securely using Mailspring's KeyManager (Electron safeStorage).
 */
async function saveTokens(tokens: Credentials): Promise<void> {
  try {
    console.log('[GoogleCalendar] Saving tokens, has refresh_token:', !!tokens.refresh_token);
    fs.writeFileSync(getTokenPath(), JSON.stringify(tokens, null, 2), 'utf-8');
    console.log('[GoogleCalendar] Tokens saved to', getTokenPath());
  } catch (err) {
    console.error('[GoogleCalendar] Failed to save tokens:', err);
    throw err;
  }
}

/**
 * Load tokens from file. Returns null if none stored.
 */
export async function loadTokens(): Promise<Credentials | null> {
  try {
    console.log('[GoogleCalendar] Loading tokens from', getTokenPath());
    const raw = fs.readFileSync(getTokenPath(), 'utf-8');
    const tokens = JSON.parse(raw) as Credentials;
    console.log('[GoogleCalendar] Tokens loaded, has refresh_token:', !!tokens.refresh_token);
    return tokens;
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('[GoogleCalendar] Failed to load tokens:', err);
    }
    return null;
  }
}

/**
 * Clear stored tokens (for sign-out).
 */
export async function clearTokens(): Promise<void> {
  try {
    fs.unlinkSync(getTokenPath());
  } catch {
    // ignore if nothing to delete
  }
  if (oauth2Client) {
    oauth2Client.credentials = {};
  }
}

/**
 * Check if we have valid (or refreshable) credentials.
 */
export async function isAuthenticated(): Promise<boolean> {
  const tokens = await loadTokens();
  if (!tokens || !tokens.refresh_token) return false;

  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return true;
}

/**
 * Restore credentials from storage and set them on the client.
 * Returns true if credentials were restored.
 */
export async function restoreCredentials(): Promise<boolean> {
  const tokens = await loadTokens();
  if (!tokens || !tokens.refresh_token) return false;

  const client = getOAuth2Client();
  client.setCredentials(tokens);

  // Listen for token refresh events to persist updated tokens
  client.on('tokens', async (newTokens: Credentials) => {
    const merged = { ...tokens, ...newTokens };
    await saveTokens(merged);
  });

  return true;
}

/**
 * Run the OAuth2 authorization flow.
 * Opens a loopback HTTP server on a dynamic port, opens the browser,
 * and waits for the authorization code callback.
 */
export function startAuthFlow(): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        return reject(new Error('Failed to get server address'));
      }

      const port = address.port;
      const redirectUri = `http://127.0.0.1:${port}`;

      // Create a fresh client with the correct redirect URI
      const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);

      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });

      // Handle the OAuth callback
      server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
        try {
          const queryParams = new url.URL(req.url || '', redirectUri).searchParams;
          const code = queryParams.get('code');
          const error = queryParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h2>Authorization denied.</h2><p>You can close this window.</p></body></html>'
            );
            server.close();
            return reject(new Error(`Authorization denied: ${error}`));
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h2>No authorization code received.</h2></body></html>'
            );
            return;
          }

          // Exchange code for tokens
          const { tokens } = await client.getToken(code);
          client.setCredentials(tokens);

          // Update the singleton
          oauth2Client = client;

          // Persist tokens
          await saveTokens(tokens);

          // Listen for future token refreshes
          client.on('tokens', async (newTokens: Credentials) => {
            const merged = { ...tokens, ...newTokens };
            await saveTokens(merged);
          });

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body><h2>Google Calendar connected!</h2><p>You can close this window and return to Mailspring.</p></body></html>'
          );
          server.close();
          resolve(tokens);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body><h2>Authentication failed.</h2><p>Please try again.</p></body></html>'
          );
          server.close();
          reject(err);
        }
      });

      // Set a timeout for the auth flow (5 minutes)
      const timeout = setTimeout(() => {
        server.close();
        reject(new Error('Authentication timed out'));
      }, 5 * 60 * 1000);

      server.on('close', () => clearTimeout(timeout));

      // Open the browser
      const { shell } = require('electron');
      shell.openExternal(authUrl);
    });

    server.on('error', (err: Error) => {
      reject(err);
    });
  });
}

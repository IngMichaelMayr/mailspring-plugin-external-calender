# Mailspring Google Calendar Plugin

Ein natives Google-Calendar-Plugin für den [Mailspring](https://getmailspring.com/) E-Mail-Client. Kalender-Termine direkt neben den E-Mails verwalten – ohne Medienwechsel.

## Features

- **Kalenderansicht** in der Mailspring-Sidebar (Tag / Woche / Monat)
- **Full CRUD** – Termine erstellen, bearbeiten, verschieben (Drag & Drop), löschen
- **Multi-Kalender** – alle Google-Kalender eines Accounts auf einen Blick
- **E-Mail-Integration** – Termin direkt aus einer E-Mail erstellen (Smart Scheduling)
- **ICS-Anhänge** – Kalendereinladungen direkt in Google Calendar übernehmen
- **Bidirektionaler Sync** – Änderungen werden sofort mit Google synchronisiert
- **Erinnerungen** – Desktop-Benachrichtigungen für bevorstehende Termine
- **Theme-Support** – passt sich automatisch an Light- und Dark-Theme an

## Voraussetzungen

| Anforderung | Version |
|---|---|
| Mailspring | >= 1.6.3 |
| Node.js | >= 14 |
| Google-Account | mit Zugang zur Google Cloud Console |

## Schnellstart

### 1. Google OAuth2-Credentials erstellen

Folge der detaillierten Anleitung in [SETUP.md](SETUP.md#schritt-1-google-cloud-projekt-einrichten), um ein Google Cloud Projekt anzulegen und OAuth2-Credentials zu erstellen.

### 2. Credentials eintragen

```bash
cp .env.example .env
```

Öffne `.env` und trage deine Credentials ein:

```dotenv
GOOGLE_CLIENT_ID=DEINE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DEIN_CLIENT_SECRET
```

### 3. Abhängigkeiten installieren & bauen

```bash
npm install
npm run build
```

### 4. Plugin in Mailspring installieren

```bash
# Pfad je nach Installation anpassen (Flatpak / Native / macOS / Windows):
MAILSPRING_PACKAGES=~/.var/app/com.getmailspring.Mailspring/config/Mailspring/packages

mkdir -p "$MAILSPRING_PACKAGES/google-calendar"
cp -r lib/ styles/ assets/ package.json node_modules/ "$MAILSPRING_PACKAGES/google-calendar/"
```

Mailspring neu starten – in der Sidebar erscheint der Kalender-Eintrag.

> Vollständige Installationsanleitung (alle Plattformen, Fehlerbehebung): [SETUP.md](SETUP.md)

## Entwicklung

```bash
# TypeScript im Watch-Modus kompilieren:
npm run watch

# Entwicklungs-Build (mit Source Maps):
npm run build:dev

# Produktions-Build:
npm run build

# Kompilate aufräumen:
npm run clean
```

Nach einem Rebuild in Mailspring neu laden: **Ctrl+Shift+R** (Linux/Windows) bzw. **Cmd+Shift+R** (macOS).

## Projektstruktur

```
.
├── src/
│   ├── main.ts                        # Einstiegspunkt & Plugin-Registrierung
│   ├── google-auth.ts                 # OAuth2-Flow & Token-Verwaltung
│   ├── google-calendar-api.ts         # Google Calendar API Client
│   ├── reminder-notifier.ts           # Desktop-Benachrichtigungen
│   ├── components/                    # React-Komponenten
│   ├── stores/                        # Flux/Reflux Stores
│   ├── cache/                         # Lokales Caching
│   └── utils/                         # Hilfsfunktionen
├── styles/
│   └── index.less                     # Plugin-Styling
├── assets/
│   └── icon-calendar.png              # Plugin-Icon
├── lib/                               # Kompiliertes JavaScript (Build-Artefakt)
├── package.json
├── tsconfig.json
├── webpack.config.js
├── SETUP.md                           # Detaillierte Installationsanleitung
└── dsgvo.md                           # Datenschutz-Dokumentation
```

## Datenschutz

Das Plugin speichert OAuth-Tokens lokal auf dem Gerät. Kalenderdaten werden ausschließlich zwischen Mailspring und der Google Calendar API übertragen. Weitere Informationen: [dsgvo.md](dsgvo.md).

## Lizenz

[MIT](LICENSE)

---

---

# Mailspring Google Calendar Plugin *(English)*

A native Google Calendar plugin for the [Mailspring](https://getmailspring.com/) email client. Manage calendar events directly alongside your emails – without switching applications.

## Features

- **Calendar view** in the Mailspring sidebar (Day / Week / Month)
- **Full CRUD** – create, edit, move (drag & drop), and delete events
- **Multi-calendar** – all Google calendars of one account at a glance
- **Email integration** – create events directly from an email (Smart Scheduling)
- **ICS attachments** – accept calendar invitations directly into Google Calendar
- **Bidirectional sync** – changes are immediately synchronized with Google
- **Reminders** – desktop notifications for upcoming events
- **Theme support** – automatically adapts to light and dark themes

## Requirements

| Requirement | Version |
|---|---|
| Mailspring | >= 1.6.3 |
| Node.js | >= 14 |
| Google account | with access to Google Cloud Console |

## Quick Start

### 1. Create Google OAuth2 credentials

Follow the detailed instructions in [SETUP.md](SETUP.md#schritt-1-google-cloud-projekt-einrichten) to set up a Google Cloud project and create OAuth2 credentials.

### 2. Enter credentials

```bash
cp .env.example .env
```

Open `.env` and enter your credentials:

```dotenv
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

### 3. Install dependencies & build

```bash
npm install
npm run build
```

### 4. Install the plugin in Mailspring

```bash
# Adjust the path depending on your installation (Flatpak / Native / macOS / Windows):
MAILSPRING_PACKAGES=~/.var/app/com.getmailspring.Mailspring/config/Mailspring/packages

mkdir -p "$MAILSPRING_PACKAGES/google-calendar"
cp -r lib/ styles/ assets/ package.json node_modules/ "$MAILSPRING_PACKAGES/google-calendar/"
```

Restart Mailspring – the calendar entry will appear in the sidebar.

> Full installation guide (all platforms, troubleshooting): [SETUP.md](SETUP.md)

## Development

```bash
# Compile TypeScript in watch mode:
npm run watch

# Development build (with source maps):
npm run build:dev

# Production build:
npm run build

# Clean build artifacts:
npm run clean
```

After rebuilding, reload in Mailspring: **Ctrl+Shift+R** (Linux/Windows) or **Cmd+Shift+R** (macOS).

## Project Structure

```
.
├── src/
│   ├── main.ts                        # Entry point & plugin registration
│   ├── google-auth.ts                 # OAuth2 flow & token management
│   ├── google-calendar-api.ts         # Google Calendar API client
│   ├── reminder-notifier.ts           # Desktop notifications
│   ├── components/                    # React components
│   ├── stores/                        # Flux/Reflux stores
│   ├── cache/                         # Local caching
│   └── utils/                         # Helper functions
├── styles/
│   └── index.less                     # Plugin styling
├── assets/
│   └── icon-calendar.png              # Plugin icon
├── lib/                               # Compiled JavaScript (build artifact)
├── package.json
├── tsconfig.json
├── webpack.config.js
├── SETUP.md                           # Detailed installation guide
└── dsgvo.md                           # Privacy documentation
```

## Privacy

The plugin stores OAuth tokens locally on the device. Calendar data is only transferred between Mailspring and the Google Calendar API. For more information: [dsgvo.md](dsgvo.md).

## License

[MIT](LICENSE)

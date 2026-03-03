# Setup-Anleitung: mailspring-google-calendar-plugin

## Voraussetzungen

- **Mailspring** >= 1.6.3 (installiert und lauffaehig)
- **Node.js** >= 14 mit npm
- **Google-Account** mit Zugang zur Google Cloud Console

---

## Schritt 1: Google Cloud Projekt einrichten

Das Plugin benoetigt eigene OAuth2-Credentials, da Google keine generischen Client-IDs fuer Drittanbieter-Plugins erlaubt.

### 1.1 Projekt erstellen

1. Oeffne die [Google Cloud Console](https://console.cloud.google.com/)
2. Klicke oben links auf das Projekt-Dropdown und dann auf **Neues Projekt**
3. Name: z.B. `Mailspring Calendar Plugin`
4. Klicke **Erstellen** und warte bis das Projekt aktiv ist

### 1.2 Google Calendar API aktivieren

1. Gehe zu **APIs & Dienste > Bibliothek** (oder direkt: https://console.cloud.google.com/apis/library)
2. Suche nach **Google Calendar API**
3. Klicke darauf und dann auf **Aktivieren**

### 1.3 OAuth-Zustimmungsbildschirm konfigurieren

1. Gehe zu **APIs & Dienste > OAuth-Zustimmungsbildschirm**
2. Waehle **Extern** als User-Typ und klicke **Erstellen**
3. Fuelle die Pflichtfelder aus:
   - App-Name: `Mailspring Calendar`
   - Support-E-Mail: deine E-Mail-Adresse
   - Autorisierte Domains: leer lassen
   - Kontaktdaten Entwickler: deine E-Mail-Adresse
4. Klicke **Speichern und fortfahren**
5. Unter **Bereiche** klicke **Bereiche hinzufuegen oder entfernen** und fuege hinzu:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
6. Klicke **Speichern und fortfahren**
7. Unter **Testnutzer** fuege deine eigene Google-E-Mail-Adresse hinzu
8. Klicke **Speichern und fortfahren**

> **Hinweis:** Solange die App im Status "Testing" ist, koennen nur die eingetragenen Testnutzer sich anmelden. Das reicht fuer den persoenlichen Gebrauch voellig aus. Eine Veroeffentlichung (mit Google-Review) ist nur noetig, wenn andere Personen das Plugin nutzen sollen.

### 1.4 OAuth2-Credentials erstellen

1. Gehe zu **APIs & Dienste > Anmeldedaten** (oder direkt: https://console.cloud.google.com/apis/credentials)
2. Klicke **+ Anmeldedaten erstellen > OAuth-Client-ID**
3. Anwendungstyp: **Desktop-App**
4. Name: `Mailspring Calendar Plugin`
5. Klicke **Erstellen**
6. Du erhaeltst eine **Client-ID** und ein **Client-Secret** -- kopiere beide Werte

---

## Schritt 2: Credentials im Plugin eintragen

Kopiere die Vorlage und trage deine Credentials ein:

```bash
cp .env.example .env
```

Oeffne `.env` und ersetze die Platzhalter:

```dotenv
GOOGLE_CLIENT_ID=DEINE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=DEIN_CLIENT_SECRET
```

> **Wichtig:** Die `.env`-Datei ist in `.gitignore` eingetragen und wird niemals committed. Die Credentials werden beim Build durch webpack eingebettet.

---

## Schritt 3: Plugin bauen

```bash
# Im Projektverzeichnis:
cd mailspring-google-calendar-plugin

# Abhaengigkeiten installieren
npm install

# TypeScript kompilieren
npm run build
```

Nach erfolgreichem Build sollte ein `lib/`-Ordner mit den kompilierten JS-Dateien existieren. Pruefe mit:

```bash
ls lib/main.js
```

---

## Schritt 4: Plugin in Mailspring installieren

Mailspring laedt Community-Plugins aus einem `packages/`-Ordner im Config-Verzeichnis.

**Wichtig: Der Pfad haengt von der Installationsart ab!**

| Installation | Config-Pfad |
|---|---|
| **Flatpak** (empfohlen unter Linux) | `~/.var/app/com.getmailspring.Mailspring/config/Mailspring/packages/` |
| Native Linux | `~/.config/Mailspring/packages/` |
| macOS | `~/Library/Application Support/Mailspring/packages/` |
| Windows | `%APPDATA%/Mailspring/packages/` |

> **Tipp:** Den genauen Pfad findest du in Mailspring unter **Developer > Toggle Developer Tools** (Ctrl+Shift+I), dann in der Console eingeben: `AppEnv.getConfigDirPath()`

**Wichtig: Symlinks funktionieren nicht zuverlaessig** (besonders bei Flatpak), da Node.js den realen Pfad auflöst und Mailsprings Module (React etc.) dann nicht gefunden werden. Nutze stattdessen die Kopier-Methode.

### Installation (Kopieren)

```bash
# Ersetze MAILSPRING_PACKAGES durch den richtigen Pfad (siehe Tabelle oben):

# Flatpak:
MAILSPRING_PACKAGES=~/.var/app/com.getmailspring.Mailspring/config/Mailspring/packages
# Native Linux:
# MAILSPRING_PACKAGES=~/.config/Mailspring/packages

mkdir -p "$MAILSPRING_PACKAGES/google-calendar"
cp -r lib/ styles/ assets/ package.json node_modules/ "$MAILSPRING_PACKAGES/google-calendar/"
```

### Aktualisieren nach Code-Aenderungen

```bash
# Nach Aenderungen neu bauen und kopieren:
npm run build
cp -r lib/ styles/ assets/ package.json node_modules/ "$MAILSPRING_PACKAGES/google-calendar/"
# Dann in Mailspring: Ctrl+Shift+R zum Reload
```

### Ordnerstruktur im Zielverzeichnis

Das Plugin-Verzeichnis muss mindestens diese Dateien enthalten:

```
.../Mailspring/packages/google-calendar/
├── package.json
├── lib/
│   ├── main.js          (+ alle weiteren .js-Dateien)
│   ├── components/
│   ├── stores/
│   ├── cache/
│   └── utils/
├── styles/
│   └── index.less
├── assets/
│   ├── icon-calendar.png
│   └── icon-calendar@2x.png
└── node_modules/
    ├── googleapis/
    └── google-auth-library/
```

---

## Schritt 5: Mailspring neu starten

```bash
# Mailspring komplett beenden (nicht nur Fenster schliessen)
# Linux:
pkill -f mailspring

# Dann neu starten:
mailspring
```

Alternativ: In Mailspring ueber **Entwickler > Reload** (Ctrl+Shift+R / Cmd+Shift+R) das Fenster neu laden.

---

## Schritt 6: Google-Account verbinden

1. Nach dem Neustart sollte in der linken Sidebar ein **Calendar**-Eintrag erscheinen
2. Klicke darauf -- es erscheint der "Connect Google Account"-Dialog
3. Klicke auf **Connect Google Account**
4. Der Browser oeffnet sich mit der Google-Anmeldeseite
5. Melde dich mit dem Google-Account an, den du als Testnutzer eingetragen hast
6. Bestaetige die angeforderten Berechtigungen (Kalender lesen/schreiben)
7. Nach erfolgreicher Anmeldung erscheint "Google Calendar connected!" im Browser
8. Zurueck in Mailspring: die Kalenderansicht laedt automatisch deine Kalender und Termine

---

## Fehlerbehebung

### "Calendar" erscheint nicht in der Sidebar

- Pruefe ob `package.json` im Plugin-Ordner liegt und `"main": "./lib/main"` enthalt
- Pruefe ob `lib/main.js` existiert
- Oeffne die Entwicklerkonsole in Mailspring (**Entwickler > Toggle Developer Tools**) und schaue nach Fehlern
- Stelle sicher, dass `node_modules/` im Plugin-Ordner vorhanden ist

### OAuth-Fehler "Error 403: access_denied"

- Du bist nicht als Testnutzer eingetragen. Gehe zum OAuth-Zustimmungsbildschirm und fuege deine E-Mail-Adresse unter **Testnutzer** hinzu.

### OAuth-Fehler "redirect_uri_mismatch"

- Das Plugin verwendet einen Loopback-Server auf `127.0.0.1` mit dynamischem Port. Bei Desktop-Apps sollte das automatisch funktionieren. Stelle sicher, dass der Anwendungstyp in der Cloud Console auf **Desktop-App** steht (nicht "Webanwendung").

### "invalid_client" Fehler

- Client-ID oder Client-Secret sind falsch eingetragen. Pruefe `src/google-auth.ts`, baue erneut mit `npm run build` und starte Mailspring neu.

### Kalender laedt nicht / bleibt leer

- Oeffne die Entwicklerkonsole und pruefe auf Netzwerkfehler
- Stelle sicher, dass die Google Calendar API im Cloud-Projekt aktiviert ist
- Klicke den Sync-Button (Kreispfeil) in der Kalender-Toolbar

### Plugin nach Code-Aenderungen aktualisieren

```bash
# Code aendern, dann:
npm run build

# Mailspring neu laden:
# Ctrl+Shift+R (Linux/Windows) oder Cmd+Shift+R (macOS)
```

Bei Symlink-Installation reicht der Rebuild + Reload. Bei Kopier-Installation muss nach jedem Build erneut kopiert werden.

---

## Deinstallation

```bash
# Symlink entfernen:
rm ~/.config/Mailspring/packages/google-calendar

# Oder kopierten Ordner loeschen:
rm -rf ~/.config/Mailspring/packages/google-calendar
```

Danach Mailspring neu starten. Die gespeicherten OAuth-Tokens werden beim naechsten Start automatisch ignoriert.

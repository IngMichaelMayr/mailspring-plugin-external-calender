# Datenschutzerklärung (DSGVO)

**Plugin:** `mailspring-google-calendar-plugin`
**Plattform:** Mailspring Desktop Client
**Stand:** März 2026
**Rechtsgrundlage:** EU-Datenschutz-Grundverordnung (DSGVO / GDPR), gültig ab 25. Mai 2018

---

## 1. Verantwortlicher

Dieses Plugin ist ein lokal installiertes Open-Source-Werkzeug ohne eigene Serverinfrastruktur. Die verantwortliche Person im Sinne der DSGVO ist die Person, die das Plugin installiert und betreibt (im Folgenden: **Betreiber**).

Sofern das Plugin innerhalb einer Organisation eingesetzt wird, ist die organisationsverantwortliche Stelle als Verantwortlicher im Sinne von Art. 4 Nr. 7 DSGVO zu benennen.

---

## 2. Zweck und Rechtsgrundlage der Datenverarbeitung

Das Plugin integriert den Google Calendar in den Mailspring Desktop Client. Ziel ist es, Termindaten anzuzeigen, zu verwalten und Termine aus E-Mails heraus zu erstellen.

| Verarbeitungsvorgang | Rechtsgrundlage |
|---|---|
| Authentifizierung via Google OAuth2 | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) |
| Synchronisation von Kalender- und Termindaten | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) |
| Erstellung von Terminen aus E-Mail-Inhalten | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) |
| Lokales Caching zur Offline-Funktionalität | Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) |
| Erinnerungsbenachrichtigungen | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) |

Die Einwilligung wird durch die aktive Nutzung der "Connect Google Account"-Funktion erteilt und kann jederzeit durch das Abmelden (Disconnect) widerrufen werden.

---

## 3. Verarbeitete Datenkategorien

### 3.1 Google-Kontodaten (OAuth2-Authentifizierung)

Beim Login-Vorgang werden OAuth2-Tokens von Google empfangen und verarbeitet:

- **Access Token** – kurzlebiges Token für API-Zugriffe
- **Refresh Token** – langlebiges Token zur automatischen Erneuerung des Access Tokens
- **Token-Ablaufzeitpunkt** (`expiry_date`)

**Speicherort:** Ausschließlich lokal auf dem Gerät des Nutzers in der Datei
`<Mailspring-Konfigurationsverzeichnis>/google-calendar-tokens.json`

**Übertragung:** Tokens werden nur zwischen dem Gerät des Nutzers und den Google-Servern ausgetauscht. Der Betreiber dieses Plugins hat **keinen Zugriff** auf diese Daten.

**Angeforderte OAuth2-Berechtigungen (Scopes):**
- `https://www.googleapis.com/auth/calendar` – Lese- und Schreibzugriff auf alle Kalender
- `https://www.googleapis.com/auth/calendar.events` – Lese- und Schreibzugriff auf alle Termine

### 3.2 Kalender- und Termindaten

Folgende Daten werden von der Google Calendar API abgerufen und lokal gecacht:

- **Kalendermetadaten:** Kalender-ID, Name, Farbe, Zeitzone, Standard-Erinnerungen
- **Termindaten:** Titel (Summary), Beschreibung, Start- und Endzeit, Ort, Teilnehmer (E-Mail-Adressen), Erinnerungseinstellungen, Wiederholungsregeln, Serientermin-Informationen, Ganztages-Flag
- **Sync-Tokens** – interne Tokens von Google zur inkrementellen Synchronisation (enthalten keine personenbezogenen Daten)

**Speicherort:** Lokal in `<Mailspring-Konfigurationsverzeichnis>/google-calendar-cache.json`

### 3.3 Nutzereinstellungen (Präferenzen)

Keine personenbezogenen Daten im engeren Sinne, aber nutzungsbezogene Konfigurationsdaten:

- Gewählter Kalenderanzeigemodus (`month`, `week`, `day`)
- Zoom-Faktor der Tagesansicht
- Liste ausgeblendeter Kalender-IDs

**Speicherort:** Lokal in `<Mailspring-Konfigurationsverzeichnis>/google-calendar-prefs.json`

### 3.4 E-Mail-Daten (Termin-aus-Mail-Funktion)

Beim Erstellen eines Termins aus einer E-Mail heraus verarbeitet das Plugin folgende E-Mail-Daten **ausschließlich im Arbeitsspeicher** (keine persistente Speicherung):

- Betreffzeile der E-Mail (zur Vorausfüllung des Termintitels)
- E-Mail-Adressen aller Teilnehmer des E-Mail-Threads (zur Vorausfüllung der Eingeladenen)
- Vorschautext der E-Mail (bis zu 200 Zeichen, zur Beschreibung des Termins)

Diese Daten werden nicht dauerhaft gespeichert. Sie verbleiben nur im Arbeitsspeicher, bis der Nutzer den Termin speichert oder das Formular schließt. Beim Speichern des Termins werden die Daten an die Google Calendar API übertragen.

### 3.5 Systembenarichtigungen (Erinnerungen)

Das Plugin verarbeitet Termindaten zur Anzeige lokaler Systembenachrichtigungen (Erinnerungen). Dabei werden verarbeitet:

- Termintitel
- Zeitangabe bis zum Terminbeginn

Diese Daten verlassen das Gerät des Nutzers nicht. Sie werden ausschließlich an das lokale Betriebssystem-Benachrichtigungssystem übergeben.

---

## 4. Datenweitergabe an Dritte

### 4.1 Google LLC

Die ausschließliche Drittpartei in dieser Datenverarbeitung ist **Google LLC**, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.

Das Plugin kommuniziert ausschließlich mit den offiziellen Google Calendar API-Endpunkten (v3). Folgende Datenübertragungen finden statt:

| Richtung | Inhalt |
|---|---|
| Plugin → Google | OAuth2-Code-Austausch, Termin-Erstellung/-Änderung/-Löschung, Kalenderänderungen |
| Google → Plugin | OAuth2-Tokens, Kalender- und Termindaten, Sync-Tokens |

Die Datenverarbeitung durch Google unterliegt den [Google-Datenschutzbestimmungen](https://policies.google.com/privacy) sowie den [Google API-Nutzungsbedingungen](https://developers.google.com/terms). Im Rahmen der DSGVO ist Google als **Auftragsverarbeiter** gemäß Art. 28 DSGVO anzusehen. Google LLC verfügt für Datentransfers in die USA über EU-Standardvertragsklauseln.

### 4.2 Keine weiteren Drittparteien

Es findet **keine** Datenübertragung an:
- Analytics-Dienste
- Crash-Reporting-Dienste
- den Plugin-Entwickler oder -Betreiber
- sonstige Drittparteien

---

## 5. Datenspeicherung und Speicherdauer

| Datei | Inhalt | Speicherort | Löschung |
|---|---|---|---|
| `google-calendar-tokens.json` | OAuth2-Tokens | Lokal auf dem Gerät | Bei Abmeldung ("Disconnect") automatisch |
| `google-calendar-cache.json` | Kalender- und Termindaten | Lokal auf dem Gerät | Bei Abmeldung automatisch; manuell jederzeit möglich |
| `google-calendar-prefs.json` | Anzeigeeinstellungen | Lokal auf dem Gerät | Manuell; enthält keine personenbezogenen Daten |

Alle Daten werden ausschließlich lokal auf dem Gerät des Nutzers gespeichert. Der Speicherort ist das Mailspring-Konfigurationsverzeichnis:

- **Linux:** `~/.config/Mailspring/` oder (Flatpak) `~/.var/app/com.getmailspring.Mailspring/config/Mailspring/`
- **macOS:** `~/Library/Application Support/Mailspring/`
- **Windows:** `%APPDATA%\Mailspring\`

---

## 6. Betroffenenrechte (Art. 15–22 DSGVO)

Als betroffene Person haben Sie folgende Rechte:

### 6.1 Recht auf Auskunft (Art. 15 DSGVO)
Sie können jederzeit Auskunft über alle gespeicherten Daten erhalten. Da alle Daten lokal auf Ihrem Gerät liegen, können Sie die o.g. Dateien direkt einsehen.

### 6.2 Recht auf Berichtigung (Art. 16 DSGVO)
Korrekturen von Kalender- und Termindaten erfolgen direkt über die Plugin-Oberfläche oder via Google Calendar. Geänderte Daten werden bei der nächsten Synchronisation aktualisiert.

### 6.3 Recht auf Löschung (Art. 17 DSGVO)
Sie können alle lokal gespeicherten Daten durch Abmelden ("Disconnect") aus dem Plugin löschen. Die lokalen Dateien (`google-calendar-tokens.json`, `google-calendar-cache.json`) werden dabei automatisch entfernt. Für die Löschung von Daten auf Googles Servern wenden Sie sich an Google oder nutzen Sie die Google-Kontoeinstellungen.

### 6.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
Sie können die Synchronisation jederzeit durch Abmelden aus dem Plugin pausieren.

### 6.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
Ihre Kalender- und Termindaten können direkt über Google Takeout (https://takeout.google.com) exportiert werden.

### 6.6 Recht auf Widerspruch (Art. 21 DSGVO) / Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)
Die Einwilligung kann jederzeit durch Abmelden ("Disconnect") im Plugin widerrufen werden. Dies berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung.

### 6.7 Beschwerderecht (Art. 77 DSGVO)
Sie haben das Recht, bei einer Datenschutz-Aufsichtsbehörde Beschwerde einzureichen, insbesondere in dem EU-Mitgliedstaat Ihres gewöhnlichen Aufenthaltsorts.

---

## 7. Datensicherheit (Art. 32 DSGVO)

Folgende technische Maßnahmen werden ergriffen:

- **Verschlüsselte Übertragung:** Alle Kommunikation mit Google-APIs erfolgt ausschließlich über HTTPS/TLS.
- **Lokale Speicherung:** Alle sensiblen Daten (insbesondere OAuth2-Tokens) werden ausschließlich lokal gespeichert und nicht extern übertragen.
- **OAuth2-Standard:** Die Authentifizierung nutzt den branchenüblichen OAuth2-Flow mit kurzlebigen Access Tokens und Refresh Tokens. Zugangsdaten (Passwörter) werden zu keiner Zeit verarbeitet oder gespeichert.
- **Loopback-Redirect:** Der OAuth2-Callback-Server wird auf `127.0.0.1` (Loopback-Adresse) betrieben und ist von außen nicht erreichbar.
- **Minimale Berechtigungen:** Das Plugin fordert nur die für die Funktion notwendigen OAuth2-Scopes an.

**Hinweis:** Die Sicherheit der lokal gespeicherten Dateien liegt in der Verantwortung des Nutzers bzw. des Betriebssystems. Es wird empfohlen, die Festplattenverschlüsselung des Betriebssystems zu aktivieren.

---

## 8. Keine automatisierte Entscheidungsfindung

Das Plugin trifft keine automatisierten Entscheidungen im Sinne von Art. 22 DSGVO. Alle Datenverarbeitungen dienen ausschließlich der Darstellung und Verwaltung von Kalenderinhalten.

---

## 9. Keine Datenverarbeitung Minderjähriger

Dieses Plugin ist nicht für die Verwendung durch Personen unter 16 Jahren bestimmt (bzw. unter dem gemäß Art. 8 DSGVO in dem jeweiligen Mitgliedstaat festgelegten Mindestalter).

---

## 10. Änderungen dieser Datenschutzerklärung

Diese Datenschutzerklärung kann bei wesentlichen Änderungen am Plugin (insbesondere bei Änderungen der verarbeiteten Datenkategorien oder der Drittparteien) aktualisiert werden. Das Datum der letzten Änderung ist im Kopf dieses Dokuments vermerkt.

---

## 11. Kontakt

Für datenschutzrechtliche Anfragen wenden Sie sich an den Betreiber des Plugins. Bei Anfragen zu Ihren Daten bei Google verwenden Sie die offiziellen Google-Datenschutzkanäle:

- Google-Datenschutz: https://policies.google.com/privacy
- Google-Sicherheitseinstellungen: https://myaccount.google.com/security
- Daten-Export (Takeout): https://takeout.google.com
- OAuth2-App-Berechtigungen verwalten: https://myaccount.google.com/permissions

---

---

# Privacy Policy (GDPR / DSGVO) *(English)*

**Plugin:** `mailspring-google-calendar-plugin`
**Platform:** Mailspring Desktop Client
**Last updated:** March 2026
**Legal basis:** EU General Data Protection Regulation (GDPR / DSGVO), applicable since 25 May 2018

---

## 1. Controller

This plugin is a locally installed open-source tool without its own server infrastructure. The controller within the meaning of the GDPR is the person who installs and operates the plugin (hereinafter referred to as the **operator**).

If the plugin is used within an organisation, the responsible organisational entity must be designated as the controller within the meaning of Art. 4(7) GDPR.

---

## 2. Purpose and Legal Basis of Processing

The plugin integrates Google Calendar into the Mailspring desktop client. Its purpose is to display, manage, and create calendar events from emails.

| Processing activity | Legal basis |
|---|---|
| Authentication via Google OAuth2 | Art. 6(1)(a) GDPR (consent) |
| Synchronisation of calendar and event data | Art. 6(1)(a) GDPR (consent) |
| Creating events from email content | Art. 6(1)(a) GDPR (consent) |
| Local caching for offline functionality | Art. 6(1)(b) GDPR (performance of a contract) |
| Reminder notifications | Art. 6(1)(a) GDPR (consent) |

Consent is given by actively using the "Connect Google Account" function and may be withdrawn at any time by signing out (Disconnect).

---

## 3. Categories of Data Processed

### 3.1 Google Account Data (OAuth2 Authentication)

During the login process, OAuth2 tokens are received from Google and processed:

- **Access Token** – short-lived token for API access
- **Refresh Token** – long-lived token for automatic renewal of the access token
- **Token expiry date** (`expiry_date`)

**Storage location:** Exclusively locally on the user's device in the file
`<Mailspring config directory>/google-calendar-tokens.json`

**Transmission:** Tokens are only exchanged between the user's device and Google's servers. The operator of this plugin has **no access** to this data.

**Requested OAuth2 scopes:**
- `https://www.googleapis.com/auth/calendar` – read and write access to all calendars
- `https://www.googleapis.com/auth/calendar.events` – read and write access to all events

### 3.2 Calendar and Event Data

The following data is retrieved from the Google Calendar API and cached locally:

- **Calendar metadata:** calendar ID, name, colour, time zone, default reminders
- **Event data:** title (summary), description, start and end time, location, attendees (email addresses), reminder settings, recurrence rules, recurring event information, all-day flag
- **Sync tokens** – internal Google tokens for incremental synchronisation (contain no personal data)

**Storage location:** Locally in `<Mailspring config directory>/google-calendar-cache.json`

### 3.3 User Settings (Preferences)

No personal data in the strict sense, but usage-related configuration data:

- Selected calendar display mode (`month`, `week`, `day`)
- Zoom level of the day view
- List of hidden calendar IDs

**Storage location:** Locally in `<Mailspring config directory>/google-calendar-prefs.json`

### 3.4 Email Data (Create Event from Email Feature)

When creating an event from an email, the plugin processes the following email data **exclusively in working memory** (no persistent storage):

- Subject line of the email (to pre-fill the event title)
- Email addresses of all participants in the email thread (to pre-fill invited attendees)
- Preview text of the email (up to 200 characters, for the event description)

This data is not stored permanently. It remains in working memory only until the user saves the event or closes the form. When the event is saved, the data is transmitted to the Google Calendar API.

### 3.5 System Notifications (Reminders)

The plugin processes event data in order to display local system notifications (reminders). The following data is processed:

- Event title
- Time until the event starts

This data does not leave the user's device. It is passed exclusively to the local operating system notification system.

---

## 4. Disclosure to Third Parties

### 4.1 Google LLC

The only third party involved in this data processing is **Google LLC**, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.

The plugin communicates exclusively with the official Google Calendar API endpoints (v3). The following data transfers take place:

| Direction | Content |
|---|---|
| Plugin → Google | OAuth2 code exchange, event creation/modification/deletion, calendar changes |
| Google → Plugin | OAuth2 tokens, calendar and event data, sync tokens |

Data processing by Google is subject to the [Google Privacy Policy](https://policies.google.com/privacy) and the [Google API Terms of Service](https://developers.google.com/terms). Under the GDPR, Google is to be regarded as a **data processor** within the meaning of Art. 28 GDPR. Google LLC relies on EU Standard Contractual Clauses for data transfers to the USA.

### 4.2 No Further Third Parties

There is **no** data transfer to:
- Analytics services
- Crash reporting services
- The plugin developer or operator
- Any other third parties

---

## 5. Data Storage and Retention Periods

| File | Content | Storage location | Deletion |
|---|---|---|---|
| `google-calendar-tokens.json` | OAuth2 tokens | Locally on the device | Automatically on sign-out ("Disconnect") |
| `google-calendar-cache.json` | Calendar and event data | Locally on the device | Automatically on sign-out; manual deletion possible at any time |
| `google-calendar-prefs.json` | Display settings | Locally on the device | Manual; contains no personal data |

All data is stored exclusively locally on the user's device. The storage location is the Mailspring configuration directory:

- **Linux:** `~/.config/Mailspring/` or (Flatpak) `~/.var/app/com.getmailspring.Mailspring/config/Mailspring/`
- **macOS:** `~/Library/Application Support/Mailspring/`
- **Windows:** `%APPDATA%\Mailspring\`

---

## 6. Rights of Data Subjects (Art. 15–22 GDPR)

As a data subject, you have the following rights:

### 6.1 Right of Access (Art. 15 GDPR)
You can obtain information about all stored data at any time. As all data is stored locally on your device, you can view the files mentioned above directly.

### 6.2 Right to Rectification (Art. 16 GDPR)
Corrections to calendar and event data are made directly through the plugin interface or via Google Calendar. Updated data will be refreshed at the next synchronisation.

### 6.3 Right to Erasure (Art. 17 GDPR)
You can delete all locally stored data by signing out ("Disconnect") from the plugin. The local files (`google-calendar-tokens.json`, `google-calendar-cache.json`) will be removed automatically. For the deletion of data on Google's servers, contact Google or use the Google account settings.

### 6.4 Right to Restriction of Processing (Art. 18 GDPR)
You can pause the synchronisation at any time by signing out from the plugin.

### 6.5 Right to Data Portability (Art. 20 GDPR)
Your calendar and event data can be exported directly via Google Takeout (https://takeout.google.com).

### 6.6 Right to Object (Art. 21 GDPR) / Withdrawal of Consent (Art. 7(3) GDPR)
Consent may be withdrawn at any time by signing out ("Disconnect") in the plugin. This does not affect the lawfulness of processing carried out prior to withdrawal.

### 6.7 Right to Lodge a Complaint (Art. 77 GDPR)
You have the right to lodge a complaint with a data protection supervisory authority, in particular in the EU Member State of your habitual residence.

---

## 7. Data Security (Art. 32 GDPR)

The following technical measures are implemented:

- **Encrypted transmission:** All communication with Google APIs takes place exclusively via HTTPS/TLS.
- **Local storage:** All sensitive data (in particular OAuth2 tokens) is stored exclusively locally and is not transmitted externally.
- **OAuth2 standard:** Authentication uses the industry-standard OAuth2 flow with short-lived access tokens and refresh tokens. Credentials (passwords) are never processed or stored.
- **Loopback redirect:** The OAuth2 callback server runs on `127.0.0.1` (loopback address) and is not accessible from outside.
- **Minimal permissions:** The plugin requests only the OAuth2 scopes necessary for its functionality.

**Note:** The security of locally stored files is the responsibility of the user or the operating system. It is recommended to enable the operating system's disk encryption.

---

## 8. No Automated Decision-Making

The plugin does not make any automated decisions within the meaning of Art. 22 GDPR. All data processing serves exclusively the display and management of calendar content.

---

## 9. No Processing of Children's Data

This plugin is not intended for use by persons under the age of 16 (or the minimum age set by the respective Member State in accordance with Art. 8 GDPR).

---

## 10. Changes to this Privacy Policy

This privacy policy may be updated in the event of significant changes to the plugin (in particular changes to the categories of data processed or the third parties involved). The date of the last amendment is noted at the top of this document.

---

## 11. Contact

For data protection enquiries, please contact the operator of the plugin. For enquiries regarding your data held by Google, use the official Google privacy channels:

- Google Privacy Policy: https://policies.google.com/privacy
- Google Security Settings: https://myaccount.google.com/security
- Data Export (Takeout): https://takeout.google.com
- Manage OAuth2 app permissions: https://myaccount.google.com/permissions

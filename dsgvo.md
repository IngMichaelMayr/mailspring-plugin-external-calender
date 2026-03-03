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

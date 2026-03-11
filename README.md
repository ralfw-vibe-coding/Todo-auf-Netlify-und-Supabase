# Everlist

Everlist ist eine Aufgaben-App mit Login, Listen, Tags und Status-Workflow.

Diese README ist bewusst für Menschen ohne Programmier-Erfahrung geschrieben. Ziel: Du sollst das Projekt in deinem eigenen Fork verstehen, lokal starten, mit Vibe Coding weiterentwickeln und dann ins Web deployen können.

Lernziele:

- Weiterentwicklung einer fremden Codebasis mit Vibe Coding.
- Deployment nach Netlify.
- Nutzung von Supabase für die Datenbank und Authentifizierung.
- Nutzung eines Event-Store für die Persistenz. Für eine Begründung siehe die Artikel [hier](https://ralfwestphal.substack.com/p/aq-over-crud) und [hier](https://ralfwestphal.substack.com/p/structuring-software-for-productivity). Die Vorteile in Kürze: Es gibt keine Schemaänderungen mehr in der Datenbank, die Migrationsaufwand machen würde; der Code ist in wesentlichen Teilen so strukturiert, dass auch mehrere KI-Agenten parallel an Features verschiedener Interaktionen arbeiten können.

## 1. Was macht Everlist?

Everlist verwaltet Aufgaben pro Benutzerkonto.

- Jede Person sieht nur ihre eigenen Aufgaben und Listen.
- Es gibt immer eine Standardliste (`default`).
- Aufgaben können in Listen organisiert werden.
- Aufgaben haben einen Status:
  - `Backlog`
  - `Ready`
  - `In Progress`
  - `Done`
- In der App gibt es zwei Sichten:
  - `Aktiv`: alles außer `Done`
  - `Done (Archiv)`: nur erledigte Aufgaben
- Aufgaben können zusätzlich haben:
  - Beschreibung
  - Fälligkeitsdatum
  - Tags

Wichtige Fachregeln:

- Bei der Registrierung eines Nutzers wird automatisch die Standardliste erstellt.
- Die Standardliste kann nicht gelöscht werden.
- Wenn eine normale Liste gelöscht wird, bleiben die Aufgaben erhalten und werden in die Standardliste verschoben.

## 2. Wie funktioniert das Account-Management?

Die Benutzerverwaltung läuft über **Supabase Auth**.

Unterstützte Abläufe in der App:

- **Signup** mit E-Mail, Passwort und Username
- **E-Mail-Bestätigung** nach Registrierung
- **Login** mit E-Mail + Passwort
- **Logout**
- **Passwort vergessen** (Reset-Link per E-Mail)
- **Passwort zurücksetzen** über den Link
- **Account bearbeiten** (Username und Passwort ändern)

Passwortregel in der App:

- mindestens 8 Zeichen
- enthält Buchstaben
- enthält Ziffern
- enthält Sonderzeichen

## 3. Technischer Überblick

Das Projekt ist in drei klare Bereiche aufgeteilt:

- **Frontend (React/Vite)**: Oberfläche im Browser
- **Backend (Netlify Functions)**: API-Endpunkte
- **Fachlogik (Slices + Event Sourcing)**: Geschäftsregeln

Wichtige Orte im Projekt:

- `src/App.tsx`: UI und Nutzerinteraktionen
- `src/body/slices/*`: Fachlogik je Anwendungsfall
- `src/body/processor.ts`: verbindet die Slices
- `netlify/functions/*`: HTTP-Endpunkte
- `netlify/functions/_lib/runtime.ts`: Auth-Prüfung und Event-Store-Anbindung

## 4. Voraussetzungen auf deinem Entwicklungsrechner

Bitte einmalig installieren:

1. **Git** (für Fork/Clone)
2. **Node.js 20+** (LTS empfohlen)
3. **npm** (kommt mit Node)
4. **Netlify Account**
5. **Supabase Account**

Optional hilfreich:

- GitHub Desktop oder VS Code
- Ein AI-Tool für Vibe Coding (z.B. Codex, Claude Code)

## 5. Projekt in den eigenen Fork holen

1. Repository auf GitHub forken.
2. Deinen Fork lokal klonen.
3. In den Projektordner wechseln.
4. Abhängigkeiten installieren:

```bash
npm install
```

## 6. Supabase einrichten

1. Neues Supabase-Projekt anlegen.
2. Diese Werte aus Supabase holen:
   - `SUPABASE_PROJECT_URL`
   - `SUPABASE_ANON_KEY`
   - `BACKEND_SUPABASE_DB_URL` (Postgres-Connection-String)
3. In Supabase unter **Authentication -> URL Configuration** Redirects sauber setzen:
   - **Site URL**: deine öffentliche Netlify-Domain (z. B. `https://deine-app.netlify.app`)
   - **Redirect URLs** mindestens:
     - `http://localhost:8899/*` (lokal mit `netlify dev`)
     - `http://localhost:5173/*` (lokal mit Vite, falls genutzt)
     - `https://deine-app.netlify.app/*` (Deployment)
4. Lokal `.env` erstellen (oder `.env.example` kopieren) und füllen:

```env
SUPABASE_PROJECT_URL=...
SUPABASE_ANON_KEY=...
BACKEND_SUPABASE_DB_URL=...
```

5. Event-Store-Tabellen initialisieren:

```bash
npm run init:eventstore
```

Damit wird die benötigte Datenstruktur für Event Sourcing in der Datenbank angelegt.

## 7. Lokal starten

Empfohlen über Netlify Dev (damit Frontend + Functions zusammen laufen):

```bash
npx netlify dev
```

Danach im Browser öffnen (normalerweise):

- `http://localhost:8899`

Wenn alles passt, kannst du:

- Account registrieren
- E-Mail bestätigen
- einloggen
- Aufgaben und Listen verwenden

## 8. Tests und Qualitätschecks

### Unit-Tests ausführen

```bash
npm run test
```

### Linting (Code-Qualität)

```bash
npm run lint
```

### Produktions-Build prüfen

```bash
npm run build
```

Empfehlung vor jedem Push: `lint`, `test`, `build` einmal lokal ausführen.

## 9. Netlify einrichten (Deployment)

### In Netlify

1. Neues Site-Projekt erstellen und mit deinem GitHub-Fork verbinden.
2. Build-Einstellungen:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Environment Variables setzen (kann durch Import der `.env` automatisch gesetzt werden):
   - `SUPABASE_PROJECT_URL`
   - `SUPABASE_ANON_KEY`
   - `BACKEND_SUPABASE_DB_URL`
4. Deploy starten.

Hinweis:

- Das Repository enthält bereits `netlify.toml` mit Build-, Functions- und Redirect-Konfiguration.
- API-Aufrufe unter `/api/*` werden auf Netlify Functions umgeleitet.

## 10. Was musst du bei Supabase und Netlify zusammen beachten?

- In **Supabase** werden Auth und Datenbank bereitgestellt.
- In **Netlify** laufen Frontend und serverseitige Functions.
- Beide brauchen dieselben Umgebungsvariablen.
- Nach Änderungen an Environment Variables in Netlify immer neu deployen.
- Nach Änderungen an Supabase-Redirect-URLs immer einen neuen E-Mail-Link anfordern (alte Links können ungültig/abgelaufen sein).

## 11. Vibe-Coding-Guide für Weiterentwicklung im Fork

Wenn du neue Features bauen willst, arbeite in dieser Reihenfolge:

1. Fachregel festlegen (Was soll für den Benutzer passieren?)
2. Slice in `src/body/slices/` anpassen/erweitern
3. In `src/body/processor.ts` einhängen
4. Netlify Function ergänzen/anpassen
5. UI in `src/App.tsx` anschließen
6. Tests ergänzen (`src/body/__tests__/processor.test.ts`)
7. `npm run lint && npm run test && npm run build`

(Das sind Hinweise für deinen AI Vibe Coding Assistenten. Du selbst willst dich eigentlich nicht mit solchen Details beschäftigen.)

Gute Prompts für dein AI-Tool:

- „Erkläre mir die bestehende Fachregel für Listenlöschung in einfachen Worten.“
- „Füge ein neues Task-Feld `priority` hinzu, inklusive Slice, API und UI.“
- „Schreibe einen Test für den Fall: gelöschte Liste verschiebt Tasks in `default`."

## 12. Häufige Probleme

- **„Missing Supabase config“**
  - Prüfe `SUPABASE_PROJECT_URL` und `SUPABASE_ANON_KEY` in deiner `.env`.
- **401/Unauthorized bei API-Aufrufen**
  - Meist kein gültiger Login-Token oder fehlende Supabase-Variablen in Netlify.
- **E-Mail-Link zeigt auf falsche Domain oder `localhost:3000`**
  - In Supabase die URL Configuration prüfen (Site URL + Redirect URLs) und danach einen neuen Link erzeugen.
- **`otp_expired` beim Klick auf E-Mail-Link**
  - Link ist abgelaufen oder bereits benutzt. Einfach einen neuen Link anfordern.
- **Event-Store-Fehler**
  - Prüfe `BACKEND_SUPABASE_DB_URL` und führe `npm run init:eventstore` erneut aus.

---

Wenn du dieses Setup einmal sauber gemacht hast, kannst du sehr schnell neue Funktionen per Vibe Coding iterativ entwickeln.

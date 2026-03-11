# Everlist

React SPA + Netlify Functions + Event Sourcing.

## Architektur

- `src/body/slices/*`: Fachlogik je Slice (Command/Query), direkt testbar mit `MemoryEventStore`.
- `src/body/processor.ts`: Entry-Points pro Slice, ruft Slices auf.
- `netlify/functions/*`: HTTP-Adapter für die Slices, inkl. Supabase-Token-Prüfung und `PostgresEventStore`.
- `src/client/processor.ts`: Client-Adapter, ruft Netlify-Slice-Endpunkte auf.

## Setup

1. Abhängigkeiten installieren:

```bash
npm install
```

2. Umgebungsvariablen setzen (lokal und in Netlify):

- `SUPABASE_PROJECT_URL`
- `SUPABASE_ANON_KEY`
- `BACKEND_SUPABASE_DB_URL`

3. Event-Store initialisieren:

```bash
npm run init:eventstore
```

4. Lokal starten:

```bash
npx netlify dev
```

## Skripte

- `npm run test`: Unit-Tests (Slices/Processor mit MemoryEventStore)
- `npm run build`: Typecheck + SPA-Build

## Aktuelle Slice-Endpunkte

- `POST /api/tasks-create`
- `POST /api/tasks-set-status`
- `GET /api/tasks-query?mode=active|archived`

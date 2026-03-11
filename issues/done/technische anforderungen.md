# Technische Anforderungen

Die Anwendung soll als node.js Anwendung mit Typescript entwickelt werden.

Es ist eine Single Page Application (SPA) mit einer React/Shadcn UI Benutzerschnittstelle. Das Layout ist modern, frisch, funktional und very easy to use.

Die Anwendung wird deployt bei Netlify mit static HTML pages und CSS/JS. Funktionalität wird im Browser ausgeführt.

Der Zustand wird in einem Event Store in einer Postgres Datenbank bei Supabase gespeichert.
Bei Supabase werden auch die Benutzer verwaltet. Benutzeranmeldung und -registrierung werden über Supabase Authentication durchgeführt.

In Tests sollen die Slices mit dem MemoryEventStore betrieben werden. In production soll der PostgresEventStore verwendet werden.
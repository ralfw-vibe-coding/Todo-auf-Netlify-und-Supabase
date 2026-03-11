Bei der Registrierung (und auch beim Password Reset) sendet Supabase eine Email mit einem Link.
In dem Link steht am Ende eine Redirect URL. Die zeigt derzeit noch auf localhost.
Das funktioniert nicht bei Deployment im Web.

Ändere das so, dass es jeweils korrekt ist: beim Deployment auf dem Desktop (localhost) und beim Deployment im Web (öffentlicher Domainname).
---

Umsetzung am 2026-03-11:

- Signup angepasst: Supabase bekommt jetzt `emailRedirectTo` dynamisch aus der aktuellen App-URL (`window.location.origin + window.location.pathname`).
- Password-Reset vereinheitlicht: nutzt dieselbe dynamische Redirect-URL über eine gemeinsame Hilfsfunktion.
- Ergebnis: Die Redirect-URL in E-Mails passt automatisch zur laufenden Umgebung:
  - lokal: `localhost`
  - deployed: öffentliche Domain

Technische Änderung:

- Datei: `src/App.tsx`
- Neue Hilfsfunktion: `getAuthEmailRedirectUrl()`
- Verwendung in:
  - `supabase.auth.signUp(... options.emailRedirectTo ...)`
  - `supabase.auth.resetPasswordForEmail(... redirectTo ... )`

Verifikation:

- `npm run lint` erfolgreich
- `npm run test` erfolgreich

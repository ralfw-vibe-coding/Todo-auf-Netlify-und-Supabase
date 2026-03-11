# Benutzerschnittstelle

## Benutzerverwaltung und -anmeldung

Die Screens für Login, Signup, Passwort vergessen, Passwod reset sind wie üblich.

Auch der Screen für die Bearbeitung des Benutzerkontos ist simpel. Achtung: Passwort nicht im Klartext zeigen und das Passwort 2x eingeben lassen mit Maskierung.

Vom Login Screen kommt man angemeldet zum Hauptscreen der Anwendung oder zum Passwort vergessen Screen.

## Hauptscreen

Bei Anwendungsstart soll der Hauptscreen gezeigt werden. Solange der User noch nicht angemeldet ist, sollen keine Aufgaben gezeigt werden, sondern die Aufforderung zum Login oder Signup.

Sobald der User angemeldet ist, sollen seine Aufgaben angezeigt werden.

Links auf dem Screen sollen die angelegten Listen zu sehen sein. Außerdem kann man die Liste dort umbenennen oder löschen oder neue Listen erstellen.

Rechts auf den Screen die verwendeten Tags. Tags erscheinen dort, sobald eine Aufgabe ein Tag enthält. Es verschwindet, wenn ein Tag aus der letzten Aufgabe entfernt wurde. (Oder die letzte Aufgabe mit dem Tag gelöscht wurde.)

Wenn der Bildschirm schmall ist, verschwinden diese Seitenleisten mit Listen und Tags automatisch; sie können aber jederzeit aufgeklappt werden.

Über der Liste der Aufgaben ist ein Suchfeld mit einem Button.

Am Kopf des Screen steht "Everlist" und es gibt ein Menü (wenn wenig Platz ist, dann nur ein Hamburger-Menü). In dem Menü steht als erster Eintrag der Benutzername des angemeldeten Benutzer. Darunter dann die Menüpunke "Profil..." (zur Bearbeitung seines Benutzerprofils) und "Logout" (zum Abmelden des Benutzers).

Wenn der Benutzer angemeldet ist, bleibt er solange angemeldet, wie das Supabase Token angibt. Eine neue Anmeldung ist nur nötig, wenn das Token abgelaufen ist (oder der Benutzer sich abgemeldet hat).

In der Liste der Aufgaben und Listen sollen sehr dezent Möglichkeiten zur Bearbeitung und zum Löschen je Eintrag vorhanden sein. Wenn dafür kleine Icons genommen werden können, wäre das wunderbar.

Das User Interface soll modern, schlicht und Shadcn/ui konform sein.

Wenn du bei Screens Interaktionen bemerkst, frage kurz zurück. Wir klären dann, ob dahinter ein Query oder Command Slice stehen soll.
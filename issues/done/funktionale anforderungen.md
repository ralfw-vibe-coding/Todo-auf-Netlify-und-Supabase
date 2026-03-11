# Everlist - Eine Todo-App für die, die es einfach lieben

## Aufgabenverwaltung

Im Kern von Everlist stehen Aufgaben.

Aufgaben haben folgende Eigenschaften:
- einen Titel (einzeilig, required)
- eine längere Beschreibung (optional)
- ein Fälligkeitsdatum (optional)
- einen Status (Backlog, Ready, In Progress, Done) (default: In Progress)
- ein oder mehrere Tags (optional)

Aufgaben können in Listen zusammengefasst werden. Jede Aufgabe kann immer nur in einer Liste sein.

Es kann beliebig viele Aufgaben in jeder Liste geben. Und es kann beliebig viele Listen geben.

Listen haben folgende Eigenschaften:
- einen Namen (einzeilig, required, unique)

Listen können vom User erstellt und gelöscht und umbenannt werden. Wenn eine Liste gelöscht wird, wird gefragt, was mit den darin enthaltenen Aufgaben passieren soll. Mögliche Antworten: Aufgaben ebenfalls löschen oder Aufgaben ohne Liste behalten.

Es gibt immer eine default Liste, in der alle Aufgaben sonstige Liste landen.

Aufgaben können von einer Liste in eine andere verschoben werden.

Aufgaben, deren Fälligkeitsdatum erreicht ist, werden rot markiert.

Aufgaben, deren Status Done ist, gelten als archiviert.

Aufgaben können in einer Liste (oder auch außerhalb) neu angelegt und gelöscht werden. Oder sie können bearbeitet werden. Oder sie können einer anderen Liste zugewiesen werden.

Aufgaben können gesucht werden über einen Text, der entweder in ihrem Titel oder in ihrer Beschreibung steht.

Aufgaben einer Liste können angezeigt werden.

Aufgaben eines Tag können angezeigt werden.

Sobald ein Tag in keiner Aufgabe mehr vorhanden ist, wird das Tag nicht mehr angezeigt.

## Zugriffsberechtigung

User müssen sich bei der App anmelden mit ihrer Email-Adresse und einem Passwort. Nur während sie angemeldet sind, können sie ihre Aufgaben und Liste verwalten.

Bevor User sich anmelden können, müssen sie eine Account erstellen. Sie müssen ein Sign-Up-Formular ausfüllen, um einen Account zu erstellen. Dabei sind zu erfassen:
- User Email-Adresse (required, unique)
- User Passwort (required, min. 8 Zeichen mit min. einem Buchstaben und einer Ziffern und einem Sonderzeichen)
- Username (required, unique)

Nach einem Signup ist der User erstmal nur temporär Mitglied. Seine expiration time ist auf Anmeldezeit + 24h gesetzt.
Wenn er nicht innerhalb dieser Zeit einen Confirmation Link klickt, wird sein Account automatisch gelöscht.
Nach dem Signup wird also eine Email an die registrierte Email-Adresse gesendet. Diese enthält einen Link, mit dem der User sein Account bestätigen kann.

Der User kann auch seine Account-Daten in der App verändern. Dazu muss er sich zuerst anmelden. Anschließend kann er auf seine Profilseite zugreifen und dort seine Account-Daten ändern. (Nur die Email-Adresse kann nicht geändert werden.)

Der User kann auch melden, dass er sein Passwort vergessen hat. Dann wird ihm ein Link zugesandt, mit dem er sein Passwort zurücksetzen kann.

Der User kann sein Passwort zurücksetzen, indem er auf den Rücksetz-Link in der Email klickt. Er wird dann zu einem Formular geführt, in dem er sein neues Passwort eingeben muss.
# Strukturelle Anforderungen

Die Anwendung wird in einer IODA.SH / Vertical Slice Architecture realisiert.

Dabei steht jeder Benutzerinteraktion im User Interface (z.B. Klick auf einen Button), d.h. im Head der Anwendung, ein Slice im Body der Anwendung gegenüber.

Alle Slices werden über einen Processor als Schnittstelle des Body zusammengefasst und dem Head angeboten.

Jedes Slice liest Events aus dem Event Store (seinen Kontext), erstellt daraus ein Slice-spezifisches Kontextmodell und erfüllt dann seine Aufgabe.

Bei Queries werden Daten aus dem Kontextmodell in ein Resultatsmodell projiziert und zurückgegeben.

Bei Commands werden auf der Basis von Parametern, Kontextmodell neue Events generiert und an den Event Store angehängt.

Slices sollten unabhängig von Providern sein. Wenn Slices Daten aus Providern brauchen oder Ergebnisse von Slices an Provider übergeben werden müssen, dann sollte im Entry Point des Slice im Proessor ein Datenfluss integriert werden zwischen Providern und Slices.

## Eventstruktur

Events haben immer einen Typ und eine Payload.

Die Payload enthält immer eine Event-Id mit einem Namen passend zum Eventtyp.

Wenn Events sich auf andere beziehen, geschieht das in scopes in der Payload mit deren Event-Ids.

Bezüge können aufgrund von Kausalität sein: weil ein Event durch einen früheren ausgelöst wurde, kann der spätere sich auf den früheren in seinen scopes beziehen.
Oder Bezüge dokumentieren Korrelationen. Dann hängen Events "aus irgendwelchen Gründen" zusammen.

Wenn ein Event sich auf einen früheren bezieht, dann übernimmt er dessen scopes und fügt ihn als weitere Referenz für sich hinzu.

Welche Events bei Commands zu schreiben sind, sollte immer mit mir diskutiert werden. Du kannst gern Vorschläge machen.
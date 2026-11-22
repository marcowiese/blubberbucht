# Blubberbucht 🐠

*von BunnyLabs*

Ein entspanntes Unterwasser-Sortierpuzzle für Smartphone und Tablet – direkt im Browser, offline-fähig und als App auf dem Homescreen installierbar.

**Spielen:** https://marcowiese.github.io/blubberbucht/

## So geht's
- Tippe Meeresbewohner in den Blasen an.
- Passt ein Tier zu einer Karte unter den Gläsern, schwimmt es ins Glas – sonst landet es in der Ablage (5 Plätze).
- Drei gleiche im Glas = gesammelt, das Glas bekommt eine neue Art.
- Blasen in verschiedenen Größen liegen lose aufeinander. Leere Blasen platzen, die anderen rutschen schräg nach und rollen seitlich ab – neue kommen von oben ins Bild.
- Ist die Ablage voll, ist das Level verloren.
- In jedem Level sind 2 Aquarien frei – Aquarium 3 und 4 lassen sich für je 500 Münzen für das laufende Level dazukaufen.
- Jedes 5. Level ist „Schwer“, jedes 10. „Extrem schwer“.
- Münzen gibt es für jedes geschaffte Level (mehr für schwere Level). Booster kosten 200 Münzen.

## Booster
- **Kescher** – holt die fehlenden Tiere für ein Glas, auch aus verdeckten Blasen
- **Aufräumen** – räumt die ganze Ablage in ein Stapelfeld (6. Feld); von dort gehen die Tiere automatisch ins passende Aquarium. Die Ablage hat sonst 5 Felder.
- **Wirbel** – mischt alle Tiere in den Blasen neu

## Weiteres
- Endlose, automatisch erzeugte Level mit steigender Schwierigkeit, Zeit-Challenges in jedem 6. Level
- 16 Arten zum Entdecken, eigenes Aquarium mit allen gesammelten Tieren
- Grafiken und Soundeffekte werden im Code erzeugt; Musik: eigene Tracks © BunnyLabs (Bubble Fish, Crystal Bubbles, Coral Garden, Moonlit Aquarium, Deep Blue Drift; Weihnachten: Schneeflocken-Bucht, Lichterglanz im Riff, Stille Nacht am Meeresgrund, Kekse und Korallen)
- Musik und Soundeffekte getrennt ein-/ausschaltbar
- Fortschritt wird lokal im Browser gespeichert

Technik: reines HTML/CSS/JavaScript, keine Abhängigkeiten.

## Weihnachts-Theme
- Schalter: `const XMAS = true` in `js/xmas.js` (auf `false` setzen = wieder normales Theme).
- Schnee, Tannengrün mit Kugeln, Lichterkette am Regal, Mützen für alle Tiere (König Krabbo: Krone und kleine schräge Mütze), Glöckchen-Klänge, eigene Weihnachts-Playlist (music/x1–x4) statt der normalen Musik.
- 7 Weihnachtstiere (Flocke, Renni, Lebi, Tanni, Pingo, Päckchen-Paul, Zuckerli): in jedem Level ersetzt eine davon reihum eine ältere Art (gleiche Artenzahl, gleiche Schwierigkeit). Ohne Theme sind sie unsichtbar; der Fang bleibt gespeichert und ist nächstes Jahr wieder da.
- Adventskalender: 1.–24. Dezember je ein Türchen (knapp 600 Münzen + 4 Booster insgesamt), verpasste Türchen im Dezember nachholbar. Im Entwicklermodus lässt sich ein Dezembertag simulieren.

## Neue Version veröffentlichen
```bash
tools/release.sh 1.6.1   # setzt Versionsnummer überall
git commit -am "v1.6.1: …" && git push
```
Das Spiel prüft beim Start, beim Zurückkehren in die App und vor jedem Level `version.json` und lädt eine neue Version automatisch (nie mitten im Level).

## Verwendete Bibliotheken
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) – QR-Code für die Spielstand-Übertragung
- [jsQR](https://github.com/cozmo/jsQR) (Apache-2.0) – QR-Scanner im Spiel

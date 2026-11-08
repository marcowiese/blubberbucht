# Blubberbucht 🐠

*von Hase Games*

Ein entspanntes Unterwasser-Sortierpuzzle für Smartphone und Tablet – direkt im Browser, offline-fähig und als App auf dem Homescreen installierbar.

**Spielen:** https://marcowiese.github.io/blubberbucht/

## So geht's
- Tippe Meeresbewohner in den Blasen an.
- Passt ein Tier zu einer Karte unter den Gläsern, schwimmt es ins Glas – sonst landet es in der Ablage (6 Plätze).
- Drei gleiche im Glas = gesammelt, das Glas bekommt eine neue Art.
- Leere Blasen platzen, die Blasen darüber rutschen nach und neue kommen von oben ins Bild.
- Ist die Ablage voll, ist das Level verloren.
- In jedem Level sind 2 Aquarien frei – Aquarium 3 und 4 lassen sich für je 650 Münzen für das laufende Level dazukaufen.
- Jedes 5. Level ist „Schwer“, jedes 10. „Extrem schwer“.
- Münzen gibt es für jedes geschaffte Level (mehr für schwere Level). Booster kosten 200 Münzen.

## Booster
- **Kescher** – holt die fehlenden Tiere für ein Glas, auch aus verdeckten Blasen
- **Aufräumen** – packt bis zu 3 Tiere aus der Ablage zurück in eine neue Blase
- **Wirbel** – mischt alle Tiere in den Blasen neu

## Weiteres
- Endlose, automatisch erzeugte Level mit steigender Schwierigkeit, Zeit-Challenges in jedem 6. Level
- 16 Arten zum Entdecken, eigenes Aquarium mit allen gesammelten Tieren
- Grafiken und Soundeffekte werden im Code erzeugt; Musik: 4 eigene Tracks © Hase Games (Bubble Fish, Crystal Bubbles, Coral Garden, Moonlit Aquarium)
- Musik und Soundeffekte getrennt ein-/ausschaltbar
- Fortschritt wird lokal im Browser gespeichert

Technik: reines HTML/CSS/JavaScript, keine Abhängigkeiten.

## Neue Version veröffentlichen
```bash
tools/release.sh 1.6.1   # setzt Versionsnummer überall
git commit -am "v1.6.1: …" && git push
```
Das Spiel prüft beim Start, beim Zurückkehren in die App und vor jedem Level `version.json` und lädt eine neue Version automatisch (nie mitten im Level).

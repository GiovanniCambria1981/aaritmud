# Inventario legacy Aarit 1.1.3

Audit dello stato importato da `CatCode79/aaritmud` @ `d067415` (tag `upstream-aarit-1.1.3`).
Licenza: GPL-2.0 (`license.txt`). Ultimo commit upstream: 2015-05-08.

## Dimensioni

| Percorso | Ruolo | File Python (ordine di grandezza) |
|---|---|---|
| `src/*.py` | Motore, dominio, persistenza, web | ~61 moduli core |
| `src/commands/` | Comandi giocatore e admin | ~140 |
| `src/socials/` | Emote / social | ~200 |
| `src/controllers/` + `src/views/` | Sito Twisted / HTML | ~70 + template |
| `src/enums/` | Enumerazioni di dominio | decine |
| `src/entitypes/` | Tipi oggetto (arma, pianta, cadavere, portale, denaro…) | ~15 |
| `src/loops/` | Loop periodici (aggressività, digestione…) | pochi |
| `src/games/` | Mini-giochi (maze, wumpus) | 2 |
| `data/areas/*.dat` | Aree testuali | 37 |
| `data/proto_rooms/`, `proto_mobs/`, `proto_items/` | Prototipi + gamescript | centinaia |
| `data/commands/`, `data/helps/`, `www/` | Metadati comandi, help, asset web | molti |
| `wild/` | Utility wilderness | 2 script |

Entry point: `start.py` → `src.engine.engine.start()`.
Loop principale: Twisted reactor + `src/game.py` (`GameLoop`) + loop in `src/loops/` e `src/loop.py`.

## Dipendenze esterne

| Dipendenza | Stato | Classificazione |
|---|---|---|
| Python 2.7 (originario) | EOL | `REPLACE` — portato a Python 3 |
| Twisted (web + reactor) | Storico, ancora mantenuto ma API cambiate | `REPLACE` per il prodotto Vox; `DEFER` per il runtime Aarit |
| PIL / Pillow | Usato in log e mappe | `PORT` (Pillow) |
| numpy | Opzionale, monkey-patch di `random` | `DEFER` |
| SMTP / email | Avvisi staff | `DEFER` |

Nessun `requirements.txt` originario. Nessun test automatizzato originario.

## Modello dati e persistenza

- Parser testuale custom in `src/database.py` (`fread` / `fwrite`) su file `.dat` e persistenza in `persistence/`.
- Tabelle: `areas`, `proto_rooms`, `proto_mobs`, `proto_items`, `rooms`, `mobs`, `items`, `players`, `accounts`, comandi, note, help, social, ban, ecc.
- Chiavi primarie con `#` per le istanze derivate dai prototipi.
- Backup su tar + compressione (`gz` / `bz2`).
- Nessun database SQL. Nessun `pickle` nel percorso principale osservato.

Classificazione: `PORT` l’importatore `.dat`; `REPLACE` la persistenza runtime (SQLite versionato).

## Parser `.dat`

Formato a blocchi (`Comment`, `Code`, `Name`, `Descr`, `RoomResets`, `EntityResets`, `End`).
Supporta coordinate `x y z area`, flag enumerate, messaggi di reset, quantità, orari.

Classificazione: `KEEP` il formato come sorgente di contenuti; `PORT` il parser in un importatore idempotente.

## Entità e tipologie

- `Room`, `Mob`, `Item`, `Player` derivano da `Entity` / `Data` / `Describable`.
- Uscite, porte, muri, contenitori, proto vs istanza.
- `entitypes/`: arma, indumento, cibo, bevanda, libro, denaro, pianta, seme, portale, cadavere, shop.
- Parti del corpo, equipaggiamento, inventari, quantità globali.

Classificazione: `KEEP` / `PORT`.

## Sensi

Campi su stanza ed entità (con varianti notturne):

- `descr` / `descr_night`
- `descr_hearing` / `descr_hearing_night`
- `descr_smell` / `descr_smell_night`
- `descr_touch` / `descr_touch_night`
- `descr_taste` / `descr_taste_night`
- `descr_sixth` / `descr_sixth_night`

Comandi: `look`, `listen`, `smell`, `touch`, `taste`, `examine`, `intuition`.

Classificazione: `KEEP` — input del Perception Engine.

## Comandi giocatore (vertical slice)

`look`, `listen`, `smell`, `touch`, `taste`, movimento (`north`…`down`), `open`/`close`/`lock`/`unlock`, `get`/`drop`/`put`/`give`, `inventory`/`equipment`, `say`/`tell`/`whisper`/`shout`, `kill`/`attack`/`flee`, `score`, `who`.

Classificazione: `PORT` i verbi di dominio; `DROP` il parser Telnet come interfaccia giocatore.

## Combattimento, skill, behaviour, trigger

- `src/fight.py`: turni, danno, livello, forza, armi.
- `src/skill.py` + `src/skills/`.
- `src/behaviour.py` + loop di aggressività.
- `src/gamescript.py`: trigger `on_booting`, `on_reset`, `before_inject`, `on_dawn`, ecc. I gamescript sono moduli Python caricati/ricaricati a runtime (`reload`).

Classificazione: `PORT` regole; `REPLACE` i gamescript eseguibili (rischio di esecuzione dinamica). `DEFER` skill complete.

## Calendario e clima

- `src/calendar.py`, `src/climate.py`, `config.ini` sezioni `TIME` e `GAME`.
- Alba, tramonto, mezzogiorno, minuti di gioco compressi (`seconds_in_minute = 2`).
- Luce, temperatura, rumore legati a stanza/settore.

Classificazione: `PORT`.

## Multiplayer Aarit (da conservare concettualmente)

| Sottosistema | File | Classificazione |
|---|---|---|
| Presenza / connessioni | `connection.py`, `player.py` | `PORT` come membership + sessione |
| Who / incognito | `command_who.py`, `command_incognito.py` | `PORT` presenza percepibile |
| Canali RPG e off-RPG | `channel.py` (say, tell, whisper, shout, group, yell) | `REPLACE` come eventi percepiti, non canali Telnet |
| Gruppi | `group.py`, `command_follow.py`, `command_gtell.py` | `PORT` |
| Combattimento multi-entità | `fight.py` | `PORT` |
| Snoop admin | `command_snoop.py` | `DROP` / `DEFER` (sorveglianza) |
| Forum, mail, square | `forum_db.py`, `mail.py`, controller `square` | `DROP` |

## Interfaccia web e amministrazione

Sito Twisted (`web_resource.py`, `site.py`, `controllers/`, `www/`).
Editor aree, stats browser, gestione giocatori, backup, login account/password.

Classificazione: `DROP` UI storica; `DEFER` admin non necessari al prototipo; `REPLACE` identità.

## Codice incompleto o non raggiungibile

- Molti `(TD)` (to do) e `(bb)` (bug noto) nel core.
- `asizeof.py`: utility di profiling Python 2, già parzialmente pronta a Py3.
- Gamescript di debug con `print` sparsi nei prototipi flora / villaggio-zingaro.
- Wilderness (`wild.py`) e mini-giochi: secondari.

## Rischi di sicurezza

- Gamescript = Python eseguito dal processo del gioco.
- Account e password legacy in file testuali.
- Nessuna autenticazione moderna.
- Input web storico (Twisted request.args) da rivalidare.
- `reload` di moduli a runtime.
- Nessun isolation dei mondi: un solo processo, un solo mondo globale.

## Fixture scelta per il vertical slice

**Area `novizi`** (`data/areas/novizi.dat`, “Il Cammino del Sapere”).

Motivi: piccola, coerente, già pensata come tutorial (stanze sensoriali, get/drop, equipaggiamento, stanza segreta, reset a orario). Coordinate di spawn di default in `config.ini`: `0 0 1 novizi`.

Runtime legacy isolato: **non riproducibile qui** (Python 2 assente sulla macchina). I test golden master andranno marcati come specifica ricostruita dal codice, non come equivalenza verificata.

## Classificazione per sottosistema

| Sottosistema | Azione |
|---|---|
| Aree, stanze, uscite, porte | `KEEP` / `PORT` |
| Entità, inventari, proto `.dat` | `KEEP` / `PORT` |
| Sensi e descrizioni | `KEEP` |
| Tempo, clima, luce | `PORT` |
| Combattimento base | `PORT` |
| Behaviour / trigger essenziali | `PORT` |
| Dialoghi | `PORT` |
| Gruppi, presenza, canali come eventi | `PORT` concettuale / `REPLACE` implementazione |
| Parser Telnet | `DROP` (harness solo) |
| Client web / forum / square | `DROP` |
| Account/password legacy | `DROP` |
| Gamescript Python arbitrari | `REPLACE` |
| Twisted come server di gioco | `REPLACE` |
| Wilderness, maze, wumpus | `DEFER` |
| Admin completi, snoop, stats browser | `DEFER` / `DROP` |

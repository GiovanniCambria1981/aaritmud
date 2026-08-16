# Mappa Aarit → Vox

Ogni concetto importante del legacy e il corrispondente nel nucleo moderno previsto.

| Aarit | Vox | Note |
|---|---|---|
| Processo unico, mondo globale | `World` + `WorldMode` | Un mondo per campagna; `single_player` o `shared_async` |
| `Account` + password file | `UserIdentity` | Nessuna password legacy; subject ChatGPT / identità di sviluppo |
| `Player` | `Character` + `Membership` | Personaggio distinto dall’utente e dal mondo |
| `Connection` / sessione Twisted | `Session` applicativa | Non è un socket Telnet |
| `Room` + coordinate `x y z area` | `Location` / stanza di dominio | Conservare coordinate e area |
| `Exit` / porta / muro | `Exit` + ostacoli | Apertura, chiusura, segreti |
| `Mob` / `Item` / proto | `Entity` + prototipo importato | Importatore `.dat` → oggetti di dominio |
| `database["rooms"]` ecc. | `WorldRepository` | Niente dict globale |
| `fread` / `fwrite` | Importatore + persistenza SQLite | I `.dat` restano solo sorgente |
| `descr_*` | `Perception` nel `WorldSnapshot` | Fatti, non prosa |
| `look` / `listen` / `smell` / `touch` / `taste` | `observe` + `perform_action` | ChatGPT non emette stringhe Telnet |
| `interpret()` + alias | `ActionIntent.verb` | Parser semantico fuori dal motore |
| `GameLoop` + secondi compressi | `ClockPolicy` | Single player vs shared async |
| `calendar` / `climate` | `GameTime` + modificatori | Luce, temperatura, rumore |
| `fight.py` | `combat` di dominio | Un turno elementare nel vertical slice |
| `behaviour` / gamescript trigger | Eventi + regole esplicite | Niente `reload` di Python utente |
| `channel.rpg_channel` | `PerceivedEvent` per osservatore | Stesso evento, proiezioni diverse |
| `Group` | Gruppo di dominio (dopo M2) | Conservare il concetto |
| `who` / presenza | `perceived_players` | Solo ciò che è percepibile |
| `snoop` | Non portato | Sorveglianza admin |
| Forum / square / mail | Non portati | |
| Twisted HTTP UI | MCP Streamable HTTP + widget | Dopo che i tool funzionano senza UI |
| `config.ini` | Impostazioni moderne + `.env.example` | Senza segreti |

## Pacchetto proposto (da M1 in poi)

Il codice Aarit resta in questo repository come fonte e, dopo il port Python 3, come runtime legacy isolato. Il nucleo di produzione non deve importarlo per errore.

```text
src/vox_mud/          # nuovo nucleo Python 3.12
legacy/ o src/        # Aarit portato, non importato dal package moderno
tests/
fixtures/novizi/
docs/
```

Finché il nucleo Vox non esiste, Aarit occupa `src/` come nel fork originale.

## Modello World / Membership / Event

- `World`: stato autorevole, versione monotona, mode, clock.
- `Membership`: utente ↔ mondo ↔ personaggio, ruolo, invito.
- `Event`: fatto accaduto (chi, dove, verbo, bersagli). Non è narrazione.
- `PerceptionInbox`: proiezione per osservatore + cursore.

Il multiplayer Aarit (canali, who, gruppi, fight condiviso) si ricostruisce su questi tre concetti, non copiando Twisted.
